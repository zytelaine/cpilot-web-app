import { io, Socket } from 'socket.io-client';
import { Message } from '../types/chat';

export interface CpilotResponse {
  answer: string;
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


export interface QwenStreamData {
  content: string;
  finish_reason?: string;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  messageId: number;
}

export interface LogData {
  round: number;
  user: string;
  assistant: string;
  tool_calls: any[];
  completed?: boolean;
}

export interface CpilotTaskCompleteData {
  answer: string;
  status: string;
  task_id?: string;
}

export interface CpilotStreamCompleteData {
  finish_reason: string;
  task_id?: string;
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
  private qwenStreamCallbacks: Map<number, (chunk: string) => void>; // 存储流式响应回调
  private cpilotTaskCallbacks: Map<string, (response: CpilotResponse) => void>;//存储cPilot任务的回调（按任务ID区分）

  constructor() {
    this.baseUrl = import.meta.env.VITE_CPILOT_API_URL || 'http://localhost:8765';
    this.qwenUrl = import.meta.env.VITE_QWEN_API_URL || 'http://localhost:8765';
    this.socket = null;
    this.isConnected = false;
    this.messageId = 0;
    this.logCallbacks = new Set();
    this.taskCompleteCallbacks = new Set();
    this.errorCallbacks = new Set();
    this.qwenStreamCallbacks = new Map();
    this.cpilotTaskCallbacks = new Map();
    
    console.log('🔧 初始化cPilot服务，后端地址:', this.baseUrl);
    this.initWebSocket();
  }

  // 初始化SocketIO连接
  private initWebSocket() {
    try {
      this.socket = io(this.baseUrl, {
        transports: ['websocket'], 
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('✅ SocketIO连接成功，会话ID:', this.socket?.id);
      });

      this.socket.on('cPilot_log', (logData: LogData) => {
        console.log('📡 收到cPilot_log信号:', logData);
        this.logCallbacks.forEach(callback => callback(logData));
      });

      this.socket.on('cpilot_task_complete', (data: CpilotTaskCompleteData) => {
        console.log('📡 收到cPilot任务完成信号:', data);
        // 找到对应的任务回调并执行
        const taskId = data.task_id || 'default';
        const callback = this.cpilotTaskCallbacks.get(taskId);
        if (callback) {
          callback({
            answer: data.answer,
            status: data.status
          });
          this.cpilotTaskCallbacks.delete(taskId); // 清理回调
        }
      });

      this.socket.on('cpilot_stream_complete', (data: CpilotStreamCompleteData) => {
        console.log('📡 收到cPilot流结束信号:', data);
        // 可在此处执行额外的收尾逻辑（如隐藏加载状态）
      });

      this.socket.on('qwen_stream_chunk', (data: QwenStreamData) => {
        const callback = this.qwenStreamCallbacks.get(data.messageId);
        if (callback && data.content) {
          callback(data.content);
        }
      });

      this.socket.on('qwen_stream_complete', (data: QwenResponse & {messageId: number}) => {
        this.qwenStreamCallbacks.delete(data.messageId);
      });

      this.socket.on('qwen_task_complete', (response: CpilotResponse) => {
        this.taskCompleteCallbacks.forEach(callback => callback(response));
      });

      // 处理Qwen错误
      this.socket.on('qwen_error', (error: {message: string, messageId: number}) => {
        this.qwenStreamCallbacks.delete(error.messageId);
        this.errorCallbacks.forEach(callback => callback(new Error(error.message)));
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('SocketIO连接断开');
        console.log('⚠️ 警告：WebSocket连接在任务进行中断开！');
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
    this.qwenStreamCallbacks.clear();
  }

  // 发送消息（支持WebSocket实时日志和Qwen SocketIO调用）
  async sendMessage(
    message: string, 
    moduleName: string = 'run_qwen_zh', 
    model: string = 'qwen',
  ): Promise<CpilotResponse> {
    return new Promise((resolve, reject) => {

      console.log(`🚀 发送消息，模块: ${moduleName}, 模型: ${model}`);
      if (moduleName === 'Qwen' ) {
        // 使用SocketIO调用Qwen
        this.sendMessageWithQwenSocket(message, model, resolve, reject);
      } else if (this.isConnected) {
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

    // 生成唯一任务ID（用于关联回调）
    const taskId = `cpilot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const request = {
      question: message,
      module_name: moduleName,
      task_id: taskId // 传递任务ID
    };

    // 存储回调（按任务ID）
    this.cpilotTaskCallbacks.set(taskId, resolve);

    // 注册错误回调
    const onError = (error: {message: string, task_id?: string}) => {
      if (error.task_id === taskId) {
        this.errorCallbacks.delete(onError);
        this.cpilotTaskCallbacks.delete(taskId);
        reject(new Error(error.message));
      }
    };
    this.errorCallbacks.add(onError);

    this.socket.emit('start_cPilot_task', request);
    console.log(`📤 已发送start_cPilot_task事件，任务ID: ${taskId}`);
  }

  // 通过SocketIO调用Qwen API
  private sendMessageWithQwenSocket(
    message: string, 
    model: string,
    resolve: (value: CpilotResponse) => void,
    reject: (reason?: any) => void
  ): void {
    if (!this.socket) {
      reject(new Error('SocketIO未连接'));
      return;
    }

    const messageId = this.messageId++;
    const request = {
      question: message,
      model,
      messageId
    };

    // 注册流式响应回调
    const onChunk = (chunk: string) => {
      console.log('📝 Qwen流式响应:', chunk);
    };
    this.qwenStreamCallbacks.set(messageId, onChunk);

    // 注册任务完成回调
    const onTaskComplete = (response: CpilotResponse) => {
      if (this.taskCompleteCallbacks.has(onTaskComplete)) {
        this.taskCompleteCallbacks.delete(onTaskComplete);
        this.qwenStreamCallbacks.delete(messageId);
        resolve(response);
      }
    };
    this.taskCompleteCallbacks.add(onTaskComplete);

    // 注册错误回调
    const onError = (error: Error) => {
      if (this.errorCallbacks.has(onError)) {
        this.errorCallbacks.delete(onError);
        this.qwenStreamCallbacks.delete(messageId);
        reject(error);
      }
    };
    this.errorCallbacks.add(onError);

    this.socket.emit('start_qwen_task', request);
    console.log(`📤 已发送start_qwen_task事件，消息ID: ${messageId}`);
  }

  // 提供给外部使用的Qwen流式调用
  async sendToQwenStream(message: string, onChunk: (chunk: string) => void): Promise<void> {
    if (this.isConnected) {
      // 使用SocketIO的流式调用
      return new Promise((resolve, reject) => {
        const messageId = this.messageId++;
        const request = {
          question: message,
          model: 'qwen-max',
          messageId,
          stream: true
        };

        // 存储回调
        this.qwenStreamCallbacks.set(messageId, onChunk);

        // 注册完成回调
        const onComplete = (data: QwenResponse & {messageId: number}) => {
          if (data.messageId === messageId) {
            this.socket?.off('qwen_stream_complete', onComplete);
            this.socket?.off('qwen_error', onError);
            this.qwenStreamCallbacks.delete(messageId);
            resolve();
          }
        };

        // 注册错误回调
        const onError = (error: {message: string, messageId: number}) => {
          if (error.messageId === messageId) {
            this.socket?.off('qwen_stream_complete', onComplete);
            this.socket?.off('qwen_error', onError);
            this.qwenStreamCallbacks.delete(messageId);
            reject(new Error(error.message));
          }
        };

        this.socket?.on('qwen_stream_complete', onComplete);
        this.socket?.on('qwen_error', onError);

        this.socket?.emit('start_qwen_task', request);
      });
    } else {
      // 回退到HTTP流式调用
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
  }

  // 原有Qwen API调用（保留作为备用）
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
        status: 'Success'
      };
    } catch (error) {
      console.error('发送消息到Qwen失败:', error);
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

  onLogReceived(callback: (log: LogData) => void): void {
    this.logCallbacks.clear();//确保每次只注册一个回调，避免重复调用，会出现
    this.logCallbacks.add(callback);
  }

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
