import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message, Conversation } from '../types/chat';
import cpilotService, { CpilotResponse } from '../services/cpilotService';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isProcessing: boolean;
}


export interface LogData {
  round: number;
  user: string;
  assistant: string;
  tool_calls: any[];
  completed?: boolean;
}

type ChatAction =
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'RENAME_CONVERSATION'; payload: { id: string; title: string } };

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  isProcessing: false,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'CREATE_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload.id,
        messages: [],
      };
    case 'SET_CURRENT_CONVERSATION':
      const conversation = state.conversations.find(c => c.id === action.payload);
      return {
        ...state,
        currentConversationId: action.payload,
        messages: conversation?.messages || [],
      };
    case 'ADD_MESSAGE':
      // console.log('🔄 状态更新：添加新消息', action.payload);
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        ),
      };
    case 'DELETE_CONVERSATION':
      const filteredConversations = state.conversations.filter(c => c.id !== action.payload);
      const newCurrentId = state.currentConversationId === action.payload 
        ? (filteredConversations.length > 0 ? filteredConversations[0].id : null)
        : state.currentConversationId;
      return {
        ...state,
        conversations: filteredConversations,
        currentConversationId: newCurrentId,
        messages: newCurrentId ? 
          filteredConversations.find(c => c.id === newCurrentId)?.messages || [] : [],
      };
    case 'RENAME_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.id
            ? { ...c, title: action.payload.title }
            : c
        ),
      };
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  createNewChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  setCurrentConversation: (id: string) => void;
  stopProcessing: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  const createNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      timestamp: new Date().toISOString(),
      messages: [],
    };
    dispatch({ type: 'CREATE_CONVERSATION', payload: newConversation });
  };

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {

      const logHandler = (logData: LogData) => {
        console.log("logHandler")
        const assistantMessage: Message = {
          id: Date.now().toString(), 
          role: 'assistant',         
          content: "123456789", 
          // content: logData.assistant, 
          timestamp: new Date().toISOString() 
        };

        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: assistantMessage 
        });
      };

      cpilotService.onLogReceived(logHandler);

      const response: CpilotResponse = await cpilotService.sendMessage(
        content, 
        'run_qwen_zh', 
        'cpilot' // 指定使用cPilot模型，确保走WebSocket日志流程
      );
      
      if (response.status.includes('Success')) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      } else {
        // 处理错误情况
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ 错误: ${response.answer}`,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      }
    } catch (error) {
      console.error('Error sending message to cPilot:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ 连接 cPilot 服务失败，请检查服务是否正在运行。',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const setCurrentConversation = (id: string) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: id });
  };

  const stopProcessing = () => {
    dispatch({ type: 'SET_PROCESSING', payload: false });
  };

  const deleteConversation = (id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  };

  const renameConversation = (id: string, title: string) => {
    dispatch({ type: 'RENAME_CONVERSATION', payload: { id, title } });
  };

  const value: ChatContextType = {
    state,
    createNewChat,
    sendMessage,
    setCurrentConversation,
    stopProcessing,
    deleteConversation,
    renameConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 