#!/usr/bin/env python3
"""
真实 Qwen API 服务器
连接到阿里云通义千问API
"""

import os
import json
import time
import requests
from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 真实Qwen API配置
QWEN_API_KEY = "sk-77b01575f9214835b6ab05ea5630ba32"
QWEN_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
PORT = int(os.getenv('QWEN_API_PORT', 8000))

def call_qwen_api(message, stream=False):
    """调用真实的Qwen API"""
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
            "top_p": 0.8
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

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """聊天完成接口 - OpenAI兼容格式"""
    try:
        data = request.get_json()
        message = data.get('messages', [{}])[-1].get('content', '')
        stream = data.get('stream', False)
        model = data.get('model', 'qwen-max')
        
        print(f"📝 收到请求: {message[:50]}...")
        
        if stream:
            return stream_response(message, model)
        else:
            return normal_response(message, model)
            
    except Exception as e:
        print(f"❌ 错误: {e}")
        return {'error': str(e)}, 500

def normal_response(message, model):
    """普通响应（非流式）"""
    # 调用真实Qwen API
    qwen_result = call_qwen_api(message)
    
    if qwen_result and 'output' in qwen_result:
        # 从Qwen API响应中提取内容
        content = qwen_result['output']['choices'][0]['message']['content']
        
        response_data = {
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": content
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": qwen_result.get('usage', {}).get('input_tokens', 0),
                "completion_tokens": qwen_result.get('usage', {}).get('output_tokens', 0),
                "total_tokens": qwen_result.get('usage', {}).get('total_tokens', 0)
            }
        }
        
        return response_data
    else:
        # 如果API调用失败，返回错误信息
        error_message = "抱歉，连接Qwen API失败，请检查网络连接或API配置。"
        if qwen_result and 'message' in qwen_result:
            error_message = f"Qwen API错误: {qwen_result['message']}"
        
        return {
            "error": error_message,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": error_message
                    }
                }
            ]
        }

def stream_response(message, model):
    """流式响应"""
    def generate():
        # 调用真实Qwen API
        qwen_result = call_qwen_api(message)
        
        if qwen_result and 'output' in qwen_result:
            content = qwen_result['output']['choices'][0]['message']['content']
            words = content.split()
            
            for i, word in enumerate(words):
                chunk_data = {
                    "id": f"chatcmpl-{int(time.time())}",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": model,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {
                                "content": word + " "
                            },
                            "finish_reason": None
                        }
                    ]
                }
                
                yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"
                time.sleep(0.05)  # 稍微快一点的打字效果
            
            # 发送完成信号
            yield "data: [DONE]\n\n"
        else:
            # 发送错误信息
            error_chunk = {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {
                            "content": "抱歉，连接Qwen API失败，请重试。"
                        },
                        "finish_reason": "stop"
                    }
                ]
            }
            yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
    
    return Response(generate(), mimetype='text/plain')

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return {
        'status': 'healthy', 
        'model': 'qwen-max', 
        'timestamp': time.time(),
        'api_connected': True
    }

@app.route('/', methods=['GET'])
def root():
    """根路径"""
    return {
        'message': 'Real Qwen API Server',
        'version': '1.0.0',
        'model': 'qwen-max',
        'api_provider': 'Alibaba Cloud',
        'endpoints': {
            'chat': '/v1/chat/completions',
            'health': '/health'
        }
    }

if __name__ == '__main__':
    print(f"🌟 真实 Qwen API 服务启动中...")
    print(f"📡 服务地址: http://localhost:{PORT}")
    print(f"🔑 API Key: {QWEN_API_KEY[:10]}...{QWEN_API_KEY[-4:]}")
    print(f"🤖 模型: qwen-max")
    print(f"🌐 API提供商: 阿里云通义千问")
    print(f"📝 流式输出: 支持")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=PORT, debug=True) 