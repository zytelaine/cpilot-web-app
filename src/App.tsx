import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import { ModelProvider } from './contexts/ModelContext';

function App() {
  return (
    <ModelProvider>
      <ChatProvider>
        <Router>
          <div className="flex h-screen bg-gradient-to-br from-dark-50 via-cpilot-50/30 to-accent-50/30">
            <Sidebar />
            <main className="flex-1 flex flex-col">
              <Routes>
                <Route path="/" element={<ChatInterface />} />
                <Route path="/chat/:id" element={<ChatInterface />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ChatProvider>
    </ModelProvider>
  );
}

export default App;