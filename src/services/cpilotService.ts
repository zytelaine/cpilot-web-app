import { io, Socket } from 'socket.io-client';
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
  useWebsocket?: boolean; // 新增：是否使用WebSocket
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

// 新增：实时日志数据结构
export interface LogData {
  round: number;
  user: string;
  assistant: string;
  tool_calls: any[];
  completed?: boolean;
}

class CpilotService {
  private baseUrl: string;
  private qwenUrl: string;
  private socket: Socket | null;
  private isConnected: boolean;
  private messageId: number;
  private logCallbacks: Set<(log: LogData) => void>;
  private taskCompleteCallbacks: Set<(response: CpilotResponse) => void>;
  private errorCallbacks: Set<(error: Error) => void>;

  constructor() {
    this.baseUrl = import.meta.env.VITE_CPILOT_API_URL || 'http://localhost:8765';
    this.qwenUrl = import.meta.env.VITE_QWEN_API_URL || 'http://localhost:8000';
    this.socket = null;
    this.isConnected = false;
    this.messageId = 0;
    this.logCallbacks = new Set();
    this.taskCompleteCallbacks = new Set();
    this.errorCallbacks = new Set();
    
    console.log('🔧 初始化cPilot服务，后端地址:', this.baseUrl);
    this.initWebSocket();
  }


  // 初始化SocketIO连接
  private initWebSocket() {
    try {
      // 直接使用HTTP URL，Socket.IO会自动处理协议转换
      this.socket = io(this.baseUrl, {
        transports: ['websocket', 'polling'], // 允许降级到polling
        autoConnect: true,
        reconnection: true, // 启用重连
        reconnectionAttempts: 5, // 最大重连次数
        reconnectionDelay: 1000 // 重连间隔
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('✅ SocketIO连接成功，会话ID:', this.socket?.id);
      });

      this.socket.on('cPilot_log', (logData: LogData) => {
        console.log('📡 收到cPilot_log信号:', logData);
        this.logCallbacks.forEach(callback => callback(logData));
      });

      this.socket.on('cPilot_complete', (response: CpilotResponse) => {
        console.log('✅ 收到cPilot_complete信号:', response);
        this.taskCompleteCallbacks.forEach(callback => callback(response));
        this.resetCallbacks();
      });

      this.socket.on('cPilot_error', (error: { message: string }) => {
        this.errorCallbacks.forEach(callback => callback(new Error(error.message)));
        this.resetCallbacks();
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('SocketIO连接错误:', error);
        this.errorCallbacks.forEach(callback => callback(error));
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('SocketIO连接断开');
        this.resetCallbacks();
      });

    } catch (error) {
      console.error('初始化SocketIO失败:', error);
    }
  }

  // 重置回调函数
  private resetCallbacks() {
    this.logCallbacks.clear();
    this.taskCompleteCallbacks.clear();
    this.errorCallbacks.clear();
  }

  // 发送消息（支持WebSocket实时日志）
  async sendMessage(
    message: string, 
    moduleName: string = 'run_qwen_zh', 
    model: string,
    useWebsocket: boolean = true
  ): Promise<CpilotResponse> {
    return new Promise((resolve, reject) => {
      if (model === 'qwen') {
        // Qwen模型仍使用原有API
        this.sendToQwen(message)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (useWebsocket && this.isConnected) {
        // 使用WebSocket发送消息并接收实时日志
        this.sendMessageWithWebsocket(message, moduleName, resolve, reject);
      } else {
        // 回退到HTTP请求
        this.sendMessageWithHttp(message, moduleName, model)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  // 通过HTTP发送消息
  private async sendMessageWithHttp(
    message: string, 
    moduleName: string, 
    model: string
  ): Promise<CpilotResponse> {
    try {
      const response = await fetch(`${this.qwenUrl}/v1/chat/cPilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          module_name: moduleName,
          model
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('通过HTTP发送消息失败', error);
      throw error;
    }
  }


  // 通过WebSocket发送消息并接收实时日志
  private sendMessageWithWebsocket(
    message: string, 
    moduleName: string,
    resolve: (value: CpilotResponse) => void,
    reject: (reason?: any) => void
  ): void {
    if (!this.socket) {
      reject(new Error('SocketIO未连接'));
      return;
    }

    const request = {
      question: message,
      module_name: moduleName
    };

    console.log('🚀 发送WebSocket消息:', request);

    // 注册一次性回调（事件名与后端一致）
    this.socket.once('cPilot_complete', (response: CpilotResponse) => {
      console.log('✅ 收到cPilot_complete响应:', response);
      resolve(response);
    });

    this.socket.once('cPilot_error', (error: { message: string }) => {
      console.log('❌ 收到cPilot_error:', error);
      reject(new Error(error.message));
    });
    
    // 发送SocketIO事件（与后端事件名匹配）
    this.socket.emit('start_cPilot_task', request);
    console.log('📤 已发送start_cPilot_task事件');
  }

  // 发送消息到Qwen（保持原有逻辑）
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
      console.error('发送消息到Qwen失败:', error);
      throw error;
    }
  }

  // 流式发送消息（保持原有逻辑）
  async sendMessageStream(
    message: string, 
    onChunk: (chunk: string) => void, 
    model: string = 'qwen'
  ): Promise<void> {
    try {
      if (model === 'qwen') {
        await this.sendToQwenStream(message, onChunk);
      } else {
        // 对于cPilot模型，使用WebSocket获取实时日志
        if (this.isConnected) {
          await this.sendMessageWithWebsocketStream(message, onChunk, model);
        } else {
          // 回退到HTTP流式
          const response = await this.sendMessage(message, 'run_qwen_zh', model);
          onChunk(response.answer);
        }
      }
    } catch (error) {
      console.error('流式发送消息失败:', error);
      throw error;
    }
  }

  // 通过WebSocket流式发送消息
  private async sendMessageWithWebsocketStream(
    message: string, 
    onChunk: (chunk: string) => void, 
    model: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('SocketIO未连接'));
        return;
      }

      const request = {
        question: message,
        module_name: 'run_qwen_zh',
        model
      };

      let fullAnswer = '';

      // 发送SocketIO事件
      this.socket.emit('start_cPilot_task', request);

      // 注册日志回调以获取实时回答
      const logHandler = (logData: LogData) => {
        if (logData.assistant) {
          fullAnswer += logData.assistant;
          onChunk(logData.assistant);
        }
      };
      this.logCallbacks.add(logHandler);

      // 注册完成回调
      this.socket.once('cPilot_complete', () => {
        this.logCallbacks.delete(logHandler);
        resolve();
      });

      // 注册错误回调
      this.socket.once('cPilot_error', (error: { message: string }) => {
        this.logCallbacks.delete(logHandler);
        reject(new Error(error.message));
      });
    });
  }

  // 其他方法保持不变
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
      console.error('Qwen流式发送消息失败:', error);
      throw error;
    }
  }

  // 其他方法保持不变
  async getAvailableModules(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/modules`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.modules || [];
    } catch (error) {
      console.error('获取模块列表失败:', error);
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
      console.error('获取模块描述失败:', error);
      return 'No description available';
    }
  }

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

  // 添加方法：注册实时日志回调
  onLogReceived(callback: (log: LogData) => void): void {
    this.logCallbacks.add(callback);
  }

  // 添加方法：断开连接
  disconnect(): void {
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
      this.isConnected = false;
      this.resetCallbacks();
    }
  }
}

export const cpilotService = new CpilotService();
export default cpilotService;