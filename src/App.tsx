// SABO OS 1.2 メインアプリ

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import CaptureView from './components/CaptureView';
import SingleTaskView from './components/SingleTaskView';
import ListView from './components/ListView';
import ReviewView from './components/ReviewView';
import LoginView from './components/LoginView';
import { onAuthChange, signOut as firebaseSignOut } from './services/authService';
import { enableSync, disableSync, syncWithCloud } from './services/dataService';
import './App.css';

type ViewType = 'task' | 'capture' | 'list' | 'review';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('task');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      setIsAuthLoading(false);

      if (authUser) {
        // ログイン時：同期を有効化してクラウドと同期
        console.log('ログイン成功:', authUser.displayName);
        enableSync();
        await syncWithCloud();
      } else {
        // ログアウト時：同期を無効化
        disableSync();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDataUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      console.log('ログアウトしました');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // 初回ロード中
  if (isAuthLoading) {
    return (
      <div className="app-loading">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {showLoginModal && !user && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>
              ×
            </button>
            <LoginView onLoginSuccess={() => {
              setShowLoginModal(false);
            }} />
          </div>
        </div>
      )}

      <>
        <header className="app-header">
          <div className="header-content">
            <div>
              <h1 className="app-title">SABO OS 1.2</h1>
              <p className="app-subtitle">思いついたことを、ただ投げるだけ</p>
            </div>
            {user ? (
              <div className="user-info">
                <img
                  src={user.photoURL || 'https://via.placeholder.com/40'}
                  alt={user.displayName || 'User'}
                  className="user-avatar"
                />
                <span className="user-name">{user.displayName}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  ログアウト
                </button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLoginModal(true)}>
                ログイン
              </button>
            )}
          </div>
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
          <button
            className={`nav-btn ${currentView === 'review' ? 'active' : ''}`}
            onClick={() => setCurrentView('review')}
          >
            🌅 今日を振り返る
          </button>
        </nav>

        <main className="app-main" key={updateTrigger}>
          {currentView === 'task' && <SingleTaskView onUpdate={handleDataUpdate} />}
          {currentView === 'capture' && <CaptureView onSave={handleDataUpdate} />}
          {currentView === 'list' && <ListView />}
          {currentView === 'review' && <ReviewView />}
        </main>

        <footer className="app-footer">
          <p>SABO OS v1.2 - あなたの脳のOS {user && '🔄 クラウド同期中'}</p>
        </footer>
      </>
    </div>
  );
}

export default App;
