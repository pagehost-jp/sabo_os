// SABO OS 1.0 メインアプリ

import { useState } from 'react';
import CaptureView from './components/CaptureView';
import SingleTaskView from './components/SingleTaskView';
import ListView from './components/ListView';
import './App.css';

type ViewType = 'task' | 'capture' | 'list';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('task');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleDataUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">SABO OS 1.0</h1>
        <p className="app-subtitle">思いついたことを、ただ投げるだけ</p>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${currentView === 'task' ? 'active' : ''}`}
          onClick={() => setCurrentView('task')}
        >
          📝 今日やること
        </button>
        <button
          className={`nav-btn ${currentView === 'capture' ? 'active' : ''}`}
          onClick={() => setCurrentView('capture')}
        >
          ➕ 入力
        </button>
        <button
          className={`nav-btn ${currentView === 'list' ? 'active' : ''}`}
          onClick={() => setCurrentView('list')}
        >
          📂 リスト
        </button>
      </nav>

      <main className="app-main" key={updateTrigger}>
        {currentView === 'task' && <SingleTaskView onUpdate={handleDataUpdate} />}
        {currentView === 'capture' && <CaptureView onSave={handleDataUpdate} />}
        {currentView === 'list' && <ListView />}
      </main>

      <footer className="app-footer">
        <p>SABO OS v1.0 - あなたの脳のOS</p>
      </footer>
    </div>
  );
}

export default App;
