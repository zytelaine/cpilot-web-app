#!/usr/bin/env python3
"""
Qwen API 服务器
模拟 OpenAI 兼容的 API 接口
"""

import os
import json
import time
from flask import Flask, request, Response, stream_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 配置
API_KEY = os.getenv('QWEN_API_KEY', 'dummy-key')
MODEL_NAME = 'qwen-max'
PORT = int(os.getenv('QWEN_API_PORT', 8000))

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """聊天完成接口"""
    try:
        data = request.get_json()
        message = data.get('messages', [{}])[-1].get('content', '')
        stream = data.get('stream', False)
        model = data.get('model', MODEL_NAME)
        
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
    # 模拟Qwen的回复
    response_text = generate_response(message)
    
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
                    "content": response_text
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": len(message) // 4,
            "completion_tokens": len(response_text) // 4,
            "total_tokens": (len(message) + len(response_text)) // 4
        }
    }
    
    return response_data

def stream_response(message, model):
    """流式响应"""
    def generate():
        response_text = generate_response(message)
        words = response_text.split()
        
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
            time.sleep(0.1)  # 模拟打字效果
        
        # 发送完成信号
        yield "data: [DONE]\n\n"
    
    return Response(generate(), mimetype='text/plain')

def generate_response(message):
    """生成回复内容"""
    # 简单的回复逻辑，您可以根据需要修改
    if "你好" in message or "hello" in message.lower():
        return "你好！我是Qwen Max，很高兴为您服务。我可以帮助您回答问题、编写代码、分析问题等。请告诉我您需要什么帮助？"
    elif "天气" in message:
        return "抱歉，我无法获取实时天气信息。建议您查看天气预报应用或网站获取准确的天气数据。"
    elif "代码" in message or "编程" in message:
        return "我很乐意帮助您解决编程问题！请具体描述您遇到的编程难题，我会尽力提供解决方案和代码示例。"
    elif "数学" in message or "计算" in message:
        return "我可以帮助您解决数学问题！请提供具体的数学题目或计算需求，我会为您详细解答。"
    else:
        return f"我理解您的问题：'{message}'。这是一个很有趣的话题，让我为您详细分析一下..."

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return {'status': 'healthy', 'model': MODEL_NAME, 'timestamp': time.time()}

@app.route('/', methods=['GET'])
def root():
    """根路径"""
    return {
        'message': 'Qwen API Server',
        'version': '1.0.0',
        'model': MODEL_NAME,
        'endpoints': {
            'chat': '/v1/chat/completions',
            'health': '/health'
        }
    }

if __name__ == '__main__':
    print(f"🌟 Qwen API 服务启动中...")
    print(f"📡 服务地址: http://localhost:{PORT}")
    print(f"🔑 API Key: {API_KEY}")
    print(f"🤖 模型: {MODEL_NAME}")
    print(f"📝 流式输出: 支持")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=PORT, debug=True)
