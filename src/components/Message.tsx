import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const hasSteps = message.steps && message.steps.length > 0;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModelIcon = (model?: string) => {
    if (model === 'qwen') {
      return (
        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">Q</span>
        </div>
      );
    } else if (model === 'cpilot') {
      return (
        <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex items-start space-x-3 max-w-4xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
            : 'bg-gradient-to-r from-accent-600 to-accent-500'
        }`}>
          {isUser ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          {/* Message Header */}
          <div className={`flex items-center space-x-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-sm font-medium ${
              isUser ? 'text-blue-700' : 'text-accent-700'
            }`}>
              {isUser ? '您' : (message.model === 'qwen' ? 'Qwen Max' : 'cPilot')}
            </span>
            
            {/* Model Icon */}
            {!isUser && getModelIcon(message.model)}
            
            {/* Timestamp */}
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
            
            {/* Streaming Indicator */}
            {isStreaming && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600">输入中...</span>
              </div>
            )}
          </div>

          {/* Message Body */}
          <div className={`rounded-2xl px-5 py-4 backdrop-blur-sm shadow-lg ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-gradient-to-r from-accent-50/80 to-cpilot-50/80 border border-accent-200/50'
          }`}>
            {isUser ? (
              // 用户消息：纯文本显示
              <div className="whitespace-pre-wrap text-white">
                {message.content}
              </div>
            ) : (
              // AI消息：Markdown渲染
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className={`markdown-content ${
                    isUser ? 'text-white' : 'text-accent-800'
                  }`}
                  components={{
                    // 自定义代码块样式
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // 自定义表格样式
                    table: ({ children }) => (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    // 自定义列表样式
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1">
                        {children}
                      </ol>
                    ),
                    // 自定义标题样式
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-accent-800 mb-4 border-b border-accent-200 pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold text-accent-700 mb-3 mt-6">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium text-accent-700 mb-2 mt-4">
                        {children}
                      </h3>
                    ),
                    // 自定义引用样式
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-accent-400 pl-4 italic text-accent-700 bg-accent-50/50 py-2 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    // 自定义链接样式
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            {/* Steps Display */}
            {hasSteps && (
              <div className="mt-4 pt-4 border-t border-accent-200/50">
                <h4 className="text-sm font-semibold text-accent-700 mb-3">执行步骤：</h4>
                <div className="space-y-3">
                  {message.steps!.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        step.status === 'completed' 
                          ? 'bg-green-500 text-white' 
                          : step.status === 'processing'
                          ? 'bg-blue-500 text-white animate-pulse'
                          : step.status === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? '✓' : 
                         step.status === 'processing' ? '⟳' :
                         step.status === 'error' ? '✗' : 
                         index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-accent-700">
                          {step.type === 'analysis' && '📊 分析'}
                          {step.type === 'planning' && '📋 规划'}
                          {step.type === 'execution' && '⚡ 执行'}
                          {step.type === 'result' && '🎯 结果'}
                        </div>
                        <div className="text-sm text-accent-600 mt-1">{step.content}</div>
                        {step.details && (
                          <div className="text-xs text-accent-500 mt-2 bg-accent-100/50 p-2 rounded">
                            {step.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;