import React, { useState } from 'react';

const ModelSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('run');

  const models = [
    { id: 'run', name: 'OpenAI Default', description: '默认OpenAI模型协作模式', color: 'cpilot' },
    { id: 'run_gemini', name: 'Gemini', description: '使用Gemini模型处理任务', color: 'accent' },
    { id: 'run_claude', name: 'Claude', description: '使用Claude模型处理任务', color: 'cpilot' },
    { id: 'run_deepseek_zh', name: 'DeepSeek', description: '使用DeepSeek模型处理中文任务', color: 'accent' },
    { id: 'run_mistral', name: 'Mistral', description: '使用Mistral模型处理任务', color: 'cpilot' },
    { id: 'run_qwen_zh', name: 'Qwen', description: '使用Qwen模型处理任务', color: 'accent' },
  ];

  const getModelColor = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return model?.color || 'cpilot';
  };

  const getModelColorClasses = (modelId: string) => {
    const color = getModelColor(modelId);
    return {
      bg: color === 'cpilot' ? 'bg-cpilot-500' : 'bg-accent-500',
      text: color === 'cpilot' ? 'text-cpilot-500' : 'text-accent-500',
      border: color === 'cpilot' ? 'border-cpilot-500' : 'border-accent-500',
      bgLight: color === 'cpilot' ? 'bg-cpilot-50/50' : 'bg-accent-50/50',
      shadow: color === 'cpilot' ? 'shadow-cpilot' : 'shadow-accent',
      textSelected: color === 'cpilot' ? 'text-cpilot-700' : 'text-accent-700'
    };
  };

  const selectedColorClasses = getModelColorClasses(selectedModel);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-dark-700 bg-white/90 backdrop-blur-sm border border-cpilot-200/50 rounded-xl hover:bg-white hover:border-cpilot-300 focus:outline-none focus:ring-2 focus:ring-cpilot-500 focus:border-transparent transition-all duration-200 hover:scale-105 shadow-lg"
      >
        <div className={`w-2 h-2 rounded-full ${selectedColorClasses.bg}`}></div>
        <span>{models.find(m => m.id === selectedModel)?.name}</span>
        <svg className={`w-4 h-4 ${selectedColorClasses.text} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-lg border border-cpilot-100/50 rounded-2xl shadow-xl z-10 animate-fade-in">
          <div className="p-5">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-cpilot-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-dark-800">选择模型</h3>
            </div>
            <div className="space-y-3">
              {models.map((model) => {
                const modelColorClasses = getModelColorClasses(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                      selectedModel === model.id
                        ? `${modelColorClasses.border} ${modelColorClasses.bgLight} ${modelColorClasses.shadow}`
                        : 'border-cpilot-100 hover:border-cpilot-200 hover:bg-cpilot-50/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${modelColorClasses.bg}`}></div>
                      <div className="flex-1">
                        <div className={`font-semibold text-dark-800 ${selectedModel === model.id ? modelColorClasses.textSelected : ''}`}>
                          {model.name}
                        </div>
                        <div className="text-sm text-dark-600 mt-1">{model.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;