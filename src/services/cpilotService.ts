import { Message } from '../types/chat';

export interface CpilotResponse {
  answer: string;
  token_info: string;
  status: string;
}

export interface CpilotRequest {
  question: string;
  module_name?: string;
  model?: string;
}

export interface QwenResponse {
  content: string;
  finish_reason?: string;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface QwenStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

class CpilotService {
  private baseUrl: string;
  private qwenUrl: string;

  constructor() {
    // 默认使用本地 cPilot_v1 服务
    this.baseUrl = import.meta.env.VITE_CPILOT_API_URL || 'http://localhost:7860';
    // Qwen API 地址
    this.qwenUrl = import.meta.env.VITE_QWEN_API_URL || 'http://localhost:8000';
  }

  async sendMessage(message: string, moduleName: string = 'run_qwen_zh', model: string = 'qwen'): Promise<CpilotResponse> {
    try {
      // 如果选择qwen模型，使用qwen API
      if (model === 'qwen') {
        return await this.sendToQwen(message);
      }
      
      // 否则使用原有的cPilot服务
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          module_name: moduleName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendToQwen(message: string): Promise<CpilotResponse> {
    try {
      const response = await fetch(`${this.qwenUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_QWEN_API_KEY || 'dummy-key'}`,
        },
        body: JSON.stringify({
          model: 'qwen-max',
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        answer: data.choices[0]?.message?.content || '抱歉，没有收到有效回复',
        token_info: `Tokens: ${data.usage?.total_tokens || 0}`,
        status: 'Success'
      };
    } catch (error) {
      console.error('Error sending message to Qwen:', error);
      throw error;
    }
  }

  async sendMessageStream(message: string, onChunk: (chunk: string) => void, model: string = 'qwen'): Promise<void> {
    try {
      if (model === 'qwen') {
        await this.sendToQwenStream(message, onChunk);
      } else {
        // 对于非qwen模型，可以模拟流式输出
        const response = await this.sendMessage(message, 'run_qwen_zh', model);
        onChunk(response.answer);
      }
    } catch (error) {
      console.error('Error in stream message:', error);
      throw error;
    }
  }

  async sendToQwenStream(message: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      const response = await fetch(`${this.qwenUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_QWEN_API_KEY || 'dummy-key'}`,
        },
        body: JSON.stringify({
          model: 'qwen-max',
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in Qwen stream:', error);
      throw error;
    }
  }

  async getAvailableModules(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/modules`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.modules || [];
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  }

  async getModuleDescription(moduleName: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/module_description?module_name=${encodeURIComponent(moduleName)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.description || 'No description available';
    } catch (error) {
      console.error('Error fetching module description:', error);
      return 'No description available';
    }
  }

  // 获取可用的模型列表
  getAvailableModels(): Array<{id: string, name: string, description: string}> {
    return [
      {
        id: 'qwen',
        name: 'Qwen Max',
        description: '阿里云通义千问大模型，支持中文对话和代码生成'
      },
      {
        id: 'cpilot',
        name: 'cPilot',
        description: '多智能体协作系统，支持复杂任务分解和执行'
      }
    ];
  }
}

export const cpilotService = new CpilotService();
export default cpilotService; 