#!/usr/bin/env python3
"""
在线qwen api + 本地cPilot模型混合服务，集成SocketIO调用Qwen功能
"""
import eventlet
eventlet.monkey_patch()
import os
import time
import requests
import socketio
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cPilot_v1.examples import run_qwen_zh as RUN

# 真实Qwen API配置
QWEN_API_KEY = "sk-77b01575f9214835b6ab05ea5630ba32"
QWEN_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
PORT = int(os.getenv('QWEN_API_PORT', 8765))

# 创建全局可访问的socketio实例
sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

# 定义房间名称
CPILOT_ROOM = "cPilot"

from log_manager import log_manager

class cPilotServer:
    def __init__(self):
        self.sio = sio
        self.app = app
        
        # 设置日志管理器的SocketIO实例
        log_manager.set_sio(sio)

        # 注册事件处理函数
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('start_cPilot_task', self.run_cPilot)
        self.sio.on('start_qwen_task', self.run_qwen_via_socket)
        self.sio.on('join_room', self.on_join_room)  # 处理客户端加入房间
        
    def on_join_room(self, sid, data):
        """客户端主动加入房间"""
        room = data.get('room', CPILOT_ROOM)
        self.sio.enter_room(sid, room)
        log_manager.info(sid, f"客户端加入房间: {room}", to_room=True)

    def on_connect(self, sid, environ):
        """客户端连接时加入cPilot房间"""
        # 将新连接的客户端加入cPilot房间
        self.sio.enter_room(sid, CPILOT_ROOM)
        print(f"客户端 {sid} 已连接并加入 {CPILOT_ROOM} 房间")
        log_manager.info(sid, f"客户端 {sid} 已连接", to_room=True)
        
        # 向所有房间成员广播新客户端加入的消息
        self.sio.emit(
            'room_notification',
            {
                'message': f"新客户端加入 {CPILOT_ROOM} 房间",
                'client_id': sid,
                'timestamp': time.time()
            },
            room=CPILOT_ROOM
        )

    def on_disconnect(self, sid):
        """客户端断开连接时离开房间"""
        print(f"客户端 {sid} 已断开连接")
        self.sio.leave_room(sid, CPILOT_ROOM)
        log_manager.info(sid, f"客户端 {sid} 已断开连接", to_room=True)

    def run_cPilot(self, sid, data):
        message = data.get('question', '')  # 任务问题
        
        def log_callback(log_data):
            log_manager.send_log(sid, log_data)

        def task_complete_callback(result):
            """cPilot任务完成后调用，发送完成信号给前端"""
            
            complete_data = {
                "answer": result.get("answer", ""),  
                "status": "Success",  
                "task_id": data.get("task_id", "")  # 任务ID
            }
            # 发送给特定客户端
            self.sio.emit('cpilot_task_complete', complete_data, room=sid)
            # 同时广播到房间
            self.sio.emit('cpilot_room_update', {
                "message": f"任务 {data.get('task_id', '')} 已完成",
                "status": "Success"
            }, room=CPILOT_ROOM)
            
            stream_end_data = {
                "finish_reason": "stop",
                "task_id": data.get("task_id", "")
            }
            self.sio.emit('cpilot_stream_complete', stream_end_data, room=sid)

        try:
            eventlet.spawn(RUN.main, message, log_callback, task_complete_callback)
        except Exception as e:
            log_manager.error(sid, f"启动cPilot任务失败: {str(e)}", to_room=True)

    def run_qwen_via_socket(self, sid, data):
        """通过SocketIO处理Qwen请求"""
        try:
            message = data.get('question', '')
            model = data.get('model', 'qwen-max')
            message_id = data.get('messageId', 0)
            stream = data.get('stream', True)
            
            # 使用日志管理器记录，同时广播到房间
            log_manager.info(sid, f"收到Qwen请求 (ID: {message_id}): {message[:30]}...", to_room=True)
            
            eventlet.spawn(self.process_qwen_request, sid, message, model, message_id, stream)
            
        except Exception as e:
            error_msg = f"处理Qwen SocketIO请求时出错: {e}"
            log_manager.error(sid, error_msg, to_room=True)
            self.sio.emit('qwen_error', {'error': str(e), 'messageId': message_id}, room=sid)

    def process_qwen_request(self, sid, message, model, message_id, stream):
        """处理Qwen请求并通过SocketIO发送流式响应"""
        try:
            log_manager.debug(sid, f"开始处理Qwen请求 (ID: {message_id})")
            qwen_result = call_qwen_api(message, stream=stream, sid=sid)
            
            if qwen_result and 'output' in qwen_result:
                content = qwen_result['output']['choices'][0]['message']['content']
                
                if stream:
                    words = content.split()
                    for i, word in enumerate(words):
                        chunk_data = {
                            "content": word + " ",
                            "usage": {
                                "total_tokens": qwen_result.get('usage', {}).get('total_tokens', 0),
                                "prompt_tokens": qwen_result.get('usage', {}).get('input_tokens', 0),
                                "completion_tokens": i + 1
                            },
                            "messageId": message_id
                        }
                        
                        self.sio.emit('qwen_stream_chunk', chunk_data, room=sid)
                        eventlet.sleep(0.05)  # 使用非阻塞的sleep
                

                final_data = {
                    "content": content,
                    "finish_reason": "stop",
                    "usage": qwen_result.get('usage', {}),
                    "messageId": message_id
                }
                self.sio.emit('qwen_stream_complete', final_data, room=sid)
                
                response = {
                    "answer": content,
                    "token_info": f"Tokens: {qwen_result.get('usage', {}).get('total_tokens', 0)}",
                    "status": "Success"
                }
                self.sio.emit('qwen_task_complete', response, room=sid)
                log_manager.info(sid, f"Qwen请求处理完成 (ID: {message_id})", to_room=True)
                
                # 向房间广播任务完成信息
                self.sio.emit('qwen_room_update', {
                    "message": f"Qwen任务 {message_id} 已完成",
                    "status": "Success"
                }, room=CPILOT_ROOM)
                
            else:
                # 处理API调用失败的情况
                error_message = "抱歉，连接Qwen API失败，请检查网络连接或API配置。"
                if qwen_result and 'message' in qwen_result:
                    error_message = f"Qwen API错误: {qwen_result['message']}"
                    
                log_manager.error(sid, f"Qwen请求处理失败 (ID: {message_id}): {error_message}", to_room=True)
                
                error_data = {
                    "answer": error_message,
                    "token_info": "0",
                    "status": "Error"
                }
                self.sio.emit('qwen_task_complete', error_data, room=sid)
                self.sio.emit('qwen_error', {'error': error_message, 'messageId': message_id}, room=sid)
                
                # 向房间广播任务失败信息
                self.sio.emit('qwen_room_update', {
                    "message": f"Qwen任务 {message_id} 处理失败",
                    "status": "Error",
                    "error": error_message
                }, room=CPILOT_ROOM)
                
        except Exception as e:
            error_msg = f"Qwen请求处理过程中出错: {e}"
            log_manager.error(sid, error_msg, to_room=True)
            error_data = {
                "answer": "处理请求时发生错误",
                "token_info": "0",
                "status": "Error"
            }
            self.sio.emit('qwen_task_complete', error_data, room=sid)
            self.sio.emit('qwen_error', {'error': str(e), 'messageId': message_id}, room=sid)

    def run(self, host='localhost', port=8765):
        print(f"🌟 cPilot服务启动中...")
        print(f"📡 服务地址: http://{host}:{port}")
        print(f"🔑 API Key: {QWEN_API_KEY[:10]}...{QWEN_API_KEY[-4:]}")
        print(f"🤖 模型: qwen-max")
        print(f"🌐 通信协议: SocketIO + WebSocket")
        print(f"📝 流式输出: 支持")
        print(f"🏠 房间名称: {CPILOT_ROOM}")
        print("=" * 60)
        
        # 向房间发送服务启动通知（如果有客户端连接的话）
        self.sio.emit(
            'room_notification',
            {
                'message': f"cPilot服务已启动",
                'timestamp': time.time()
            },
            room=CPILOT_ROOM
        )
        
        eventlet.wsgi.server(eventlet.listen((host, port)), self.app)
    

def call_qwen_api(message, stream=False, sid=None):
    """调用真实的Qwen API，支持流式响应"""
    # 使用全局日志管理器
    if sid:
        log_manager.debug(sid, f"准备调用Qwen API: {message[:30]}...")
        
    headers = {
        "Authorization": f"Bearer {QWEN_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "qwen-max",
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": message
                }
            ]
        },
        "parameters": {
            "result_format": "message",
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.8,
            "stream": stream  # 启用流式响应
        }
    }
    
    try:
        response = requests.post(QWEN_API_URL, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if sid:
                log_manager.info(sid, "Qwen API 调用成功")
            return result
        else:
            error_msg = f"Qwen API 调用失败: {response.status_code} - {response.text}"
            if sid:
                log_manager.error(sid, error_msg)
            print(error_msg)
            return None
            
    except Exception as e:
        error_msg = f"调用Qwen API时出错: {e}"
        if sid:
            log_manager.error(sid, error_msg)
        print(error_msg)
        return None


if __name__ == '__main__':
    server = cPilotServer()
    server.run()