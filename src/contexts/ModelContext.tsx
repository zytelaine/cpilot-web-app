// src/contexts/ModelContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

//model ID
export type ModelId = 'OpenAI' | 'Gemini' | 'Claude' | 'DeepSeek' | 'Mistral' | 'Qwen';

interface ModelContextType {
  selectedModel: ModelId;
  setSelectedModel: (modelId: ModelId) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);


export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};


interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<ModelId>('OpenAI');

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
};