# cPilot Web App 前端与模型接口通信数据格式规范

## 数据格式定义

```typescript
// 消息基础结构
export interface Message {
  id: string;              // 消息唯一标识
  role: 'user' | 'assistant'; // 角色：用户或助手
  content: string;         // 消息内容
  timestamp: string;       // 时间戳
  model?: string;          // 使用的模型
  isStreaming?: boolean;   // 是否正在流式输出
  steps?: ThinkingStep[];  // 思考步骤（可选）
}

// 对话结构
export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  model?: string;
}

// 思考步骤结构
export interface ThinkingStep {
  id: string;
  type: 'analysis' | 'planning' | 'execution' | 'result';
  content: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string;
}

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
}

// 流式数据块
export interface StreamChunk {
  content: string;
  isComplete: boolean;
  step?: ThinkingStep;
}
```

## 请求数据格式

### 1. cPilot 服务请求格式

```typescript
interface CpilotRequest {
  question: string;        // 用户问题内容（必需）
  module_name?: string;    // 可选的模块名称
  model?: string;          // 可选的模型名称
}
```

**示例：**
```json
{
  "question": "请帮我分析这个数据集",
  "module_name": "data_analysis",
  "model": "cpilot"
}
```

### 2. Qwen API 请求格式

```typescript
{
  model: 'qwen-max',       // 模型名称
  messages: [
    {
      role: 'user',        // 角色：用户
      content: string      // 消息内容
    }
  ],
  stream: boolean,         // 是否流式输出
  temperature: 0.7,        // 温度参数
  max_tokens: 4000        // 最大token数
}
```

**示例：**
```json
{
  "model": "qwen-max",
  "messages": [
    {
      "role": "user",
      "content": "请帮我写一个Python函数"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 4000
}
```

## 响应数据格式

### 1. cPilot 服务响应格式

```typescript
interface CpilotResponse {
  answer: string;          // 模型回答内容
  token_info: string;      // token使用信息
  status: string;          // 响应状态
}
```

**示例：**
```json
{
  "answer": "根据您的需求，我建议使用pandas库进行数据分析...",
  "token_info": "Tokens: 150",
  "status": "Success"
}
```

### 2. Qwen API 响应格式

```typescript
interface QwenResponse {
  content: string;         // 模型回答内容
  finish_reason?: string;  // 完成原因
  usage?: {
    total_tokens: number;      // 总token数
    prompt_tokens: number;     // 提示token数
    completion_tokens: number; // 完成token数
  };
}
```

**示例：**
```json
{
  "content": "这是一个Python函数示例：\n\ndef hello_world():\n    print('Hello, World!')",
  "finish_reason": "stop",
  "usage": {
    "total_tokens": 25,
    "prompt_tokens": 10,
    "completion_tokens": 15
  }
}
```

### 3. 流式响应格式

```typescript
interface QwenStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;     // 流式内容片段
    };
    finish_reason?: string;
  }>;
}
```

**示例：**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "qwen-max",
  "choices": [
    {
      "index": 0,
      "delta": {
        "content": "这是"
      },
      "finish_reason": null
    }
  ]
}
```

### 



## 关键代码位置

| 功能模块     | 文件路径                           | 主要职责               |
| ------------ | ---------------------------------- | ---------------------- |
| 数据格式定义 | `src/types/chat.ts`                | 定义所有接口类型       |
| API 服务层   | `src/services/cpilotService.ts`    | 处理与模型接口的通信   |
| 消息处理逻辑 | `src/contexts/ChatContext.tsx`     | 管理消息状态和业务逻辑 |
| 消息显示组件 | `src/components/Message.tsx`       | 渲染消息内容和样式     |
| 聊天界面     | `src/components/ChatInterface.tsx` | 用户交互界面           |