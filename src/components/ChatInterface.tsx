import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import Message from './Message';
import ThinkingProcess from './ThinkingProcess';
import ModelSelector from './ModelSelector';

const ChatInterface: React.FC = () => {
  const { state, sendMessage, stopProcessing } = useChat();
  const [input, setInput] = useState<string>('');
  const [showThinking, setShowThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || state.isProcessing) return;

    const message = input.trim();
    setInput('');
    setShowThinking(true);
    
    try {
      await sendMessage(message);
    } finally {
      setShowThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event('submit', { bubbles: true, cancelable: true });
      e.currentTarget.form?.dispatchEvent(formEvent);
    }
  };

  const adjustTextareaHeight = (): void => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-blue-200/50 border-b-2 px-6 py-4 bg-white/80 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/cpilot_logo.png" 
              alt="cPilot" 
              className="h-8 w-auto"
              style={{ objectFit: 'contain' }}
            />
            {state.currentConversationId ? (
              <div className="flex items-center space-x-2">
                <div className="w-0.5 h-6 bg-blue-300 rounded-full"></div>
                <h1 className="text-lg font-semibold text-blue-800">
                  {state.conversations.find(c => c.id === state.currentConversationId)?.title || '新对话'}
                </h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-blue-800">开始新对话</h1>
            )}
          </div>
          <ModelSelector />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {state.messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-20 w-20 text-blue-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">开始对话</h3>
            <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
              向cPilot提出您的问题，它将通过多智能体协作来帮助您解决
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>智能体协作</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-purple-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span>任务自动化</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span>智能决策</span>
              </div>
            </div>
          </div>
        ) : (
          state.messages.map((message, index) => (
            <Message key={index} message={message} />
          ))
        )}
        
        {showThinking && <ThinkingProcess />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-blue-200/50 border-t-2 px-6 py-4 bg-white/80 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="向cPilot描述您的任务..."
              className="w-full resize-none border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white/80"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-blue-400">
              Shift + Enter 换行
            </div>
          </div>
          
          {state.isProcessing ? (
            <button
              type="button"
              onClick={stopProcessing}
              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>停止</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>发送</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;