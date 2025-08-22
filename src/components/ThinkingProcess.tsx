import React from 'react';

const ThinkingProcess: React.FC = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start space-x-3 max-w-4xl">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-accent-600 to-accent-500 flex items-center justify-center shadow-accent animate-float">
          <div className="relative">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {/* 小方块装饰，呼应logo设计 */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-sm opacity-80"></div>
          </div>
        </div>

        {/* Thinking Process */}
        <div className="flex-1">
          <div className="bg-gradient-to-r from-accent-50/80 to-cpilot-50/80 border border-accent-200/50 rounded-2xl px-5 py-4 backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3 text-accent-700">
              <div className="relative">
                <svg className="w-6 h-6 animate-spin text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {/* 小方块装饰 */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-sm opacity-80"></div>
              </div>
              <span className="font-semibold text-lg">cPilot正在思考...</span>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-cpilot-500 rounded-full animate-pulse group-hover:scale-125 transition-transform duration-200"></div>
                <span className="text-sm text-cpilot-700 font-medium">分析任务需求</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-accent-700 font-medium">规划智能体协作策略</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-cpilot-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm text-cpilot-800 font-medium">执行多智能体协作</span>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-4 w-full bg-accent-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-cpilot-500 to-accent-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingProcess;