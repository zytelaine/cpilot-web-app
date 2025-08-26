#!/usr/bin/env python3
"""
在线qwen api + 本地cPilot模型混合服务，集成SocketIO调用Qwen功能
"""
import eventlet
eventlet.monkey_patch()
import os
import json
import time
import requests
from flask import Flask, request, Response
import threading
import socketio

from cPilot_v1.examples import run_qwen_zh as RUN

# 真实Qwen API配置
QWEN_API_KEY = "sk-77b01575f9214835b6ab05ea5630ba32"
QWEN_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
PORT = int(os.getenv('QWEN_API_PORT', 8765))

sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

class cPilotServer:
    def __init__(self):
        self.sio = sio
        self.app = app

        self.sio.on('start_cPilot_task', self.run_cPilot)
        self.sio.on('start_qwen_task', self.run_qwen_via_socket)

    def run_cPilot(self, sid, data):
        message = data.get('question', '')  # 任务问题

        def log_callback(log_data):
            self.sio.emit('cPilot_log', log_data, room=sid)

        def task_complete_callback(result):
            """cPilot任务完成后调用，发送完成信号给前端"""

            complete_data = {
                "answer": result.get("answer", ""),  
                "status": "Success",  
                "task_id": data.get("task_id", "")  # 任务ID
            }
            self.sio.emit('cpilot_task_complete', complete_data, room=sid)
            
            stream_end_data = {
                "finish_reason": "stop",
                "task_id": data.get("task_id", "")
            }
            self.sio.emit('cpilot_stream_complete', stream_end_data, room=sid)

        eventlet.spawn(RUN.main, message, log_callback, task_complete_callback)

    def run_qwen_via_socket(self, sid, data):
        """通过SocketIO处理Qwen请求"""
        try:
            message = data.get('question', '')
            model = data.get('model', 'qwen-max')
            message_id = data.get('messageId', 0)
            stream = data.get('stream', True)
            
            print(f"📝 通过SocketIO收到Qwen请求: {message[:50]}..., 消息ID: {message_id}")
            
            eventlet.spawn(self.process_qwen_request, sid, message, model, message_id, stream)
            
        except Exception as e:
            print(f"❌ 处理Qwen SocketIO请求时出错: {e}")
            self.sio.emit('qwen_error', {'error': str(e), 'messageId': message_id}, room=sid)

    def process_qwen_request(self, sid, message, model, message_id, stream):
        """处理Qwen请求并通过SocketIO发送流式响应"""
        try:
            qwen_result = call_qwen_api(message, stream=stream)
            
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
                        time.sleep(0.05)  # 模拟流式输出的延迟
                

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
                
            else:
                # 处理API调用失败的情况
                error_message = "抱歉，连接Qwen API失败，请检查网络连接或API配置。"
                if qwen_result and 'message' in qwen_result:
                    error_message = f"Qwen API错误: {qwen_result['message']}"
                    
                error_data = {
                    "answer": error_message,
                    "token_info": "0",
                    "status": "Error"
                }
                self.sio.emit('qwen_task_complete', error_data, room=sid)
                self.sio.emit('qwen_error', {'error': error_message, 'messageId': message_id}, room=sid)
                
        except Exception as e:
            print(f"❌ Qwen请求处理过程中出错: {e}")
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
        print("=" * 60)
        eventlet.wsgi.server(eventlet.listen((host, port)), self.app)
    

def call_qwen_api(message, stream=False):
    """调用真实的Qwen API，支持流式响应"""
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
        print(f"📝 调用真实Qwen API: {message[:50]}...")
        response = requests.post(QWEN_API_URL, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Qwen API 调用成功")
            return result
        else:
            print(f"❌ Qwen API 调用失败: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 调用Qwen API时出错: {e}")
        return None


if __name__ == '__main__':
    server = cPilotServer()
    server.run()
