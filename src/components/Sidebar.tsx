import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';

const Sidebar: React.FC = () => {
  const { state, createNewChat, setCurrentConversation, deleteConversation, renameConversation } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleRename = (conversation: any) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveRename = () => {
    if (editingId && editingTitle.trim()) {
      renameConversation(editingId, editingTitle.trim());
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个对话吗？')) {
      deleteConversation(id);
    }
  };

  return (
    <div className={`bg-gradient-to-b from-dark-900 to-dark-800 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">cPilot</h2>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-dark-700 transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={createNewChat}
          className={`w-full mb-4 flex items-center justify-center space-x-2 btn-cpilot ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!isCollapsed && <span>新对话</span>}
        </button>

        {/* Navigation */}
        <nav className="space-y-2">
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-all duration-200 hover:scale-105 group"
          >
            <div className="p-2 rounded-lg bg-cpilot-500/20 group-hover:bg-cpilot-500/30 transition-colors">
              <svg className="w-5 h-5 text-cpilot-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            {!isCollapsed && <span>对话</span>}
          </a>

          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-all duration-200 hover:scale-105 group"
          >
            <div className="p-2 rounded-lg bg-cpilot-600/20 group-hover:bg-cpilot-600/30 transition-colors">
              <svg className="w-5 h-5 text-cpilot-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            {!isCollapsed && <span>实验</span>}
          </a>
        </nav>

        {/* Conversations */}
        {!isCollapsed && state.conversations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-dark-300 mb-3">最近对话</h3>
            <div className="space-y-1">
              {state.conversations.slice(0, 5).map((conv) => (
                <div key={conv.id} className="group relative">
                  {editingId === conv.id ? (
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-dark-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cpilot-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveRename()}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveRename}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          state.currentConversationId === conv.id
                            ? 'bg-gradient-to-r from-cpilot-600 to-cpilot-500 text-white shadow-cpilot'
                            : 'text-dark-300 hover:bg-dark-700 hover:scale-105'
                        }`}
                      >
                        <div className="truncate">{conv.title}</div>
                        <div className="text-xs text-dark-400 mt-1">
                          {new Date(conv.timestamp).toLocaleDateString()}
                        </div>
                      </button>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(conv);
                          }}
                          className="p-1 text-dark-400 hover:text-cpilot-400 transition-colors"
                          title="重命名"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conv.id);
                          }}
                          className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                          title="删除"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mt-auto pt-6">
          <button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-all duration-200 hover:scale-105 group w-full">
            <div className="p-2 rounded-lg bg-dark-600/50 group-hover:bg-dark-600/70 transition-colors">
              <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {!isCollapsed && <span>设置</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;