export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  isStreaming?: boolean;
  steps?: ThinkingStep[];
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  model?: string;
}

export interface ThinkingStep {
  id: string;
  type: 'analysis' | 'planning' | 'execution' | 'result';
  content: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  step?: ThinkingStep;
} 