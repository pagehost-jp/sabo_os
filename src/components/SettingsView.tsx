// SABO OS 設定画面

import { useState, useEffect } from 'react';
import { getApiKey, saveApiKey } from '../services/apiKeyService';
import './SettingsView.css';

export default function SettingsView() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const key = getApiKey();
    if (key) {
      setApiKey(key);
      setHasKey(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      alert('APIキーを入力してください');
      return;
    }

    saveApiKey(apiKey);
    setHasKey(true);
    alert('✅ APIキーを保存しました！');
  };

  return (
    <div className="settings-view">
      <h2 className="settings-title">⚙️ 設定</h2>

      <div className="settings-section">
        <h3 className="section-title">Gemini API 設定</h3>

        {hasKey ? (
          <div className="api-status">
            <p className="status-message success">🤖 AI自動解析モード（Gemini）</p>
            <p className="status-description">
              入力したテキストは自動的にAIで解析され、カテゴリ分類されます。
            </p>
          </div>
        ) : (
          <div className="api-status">
            <p className="status-message warning">⚠️ APIキー未設定（ルールベース分類）</p>
            <p className="status-description">
              現在はシンプルなルールで分類されています。AIで高精度な解析を行うには、APIキーを設定してください。
            </p>
          </div>
        )}

        <div className="api-key-input-section">
          <label htmlFor="api-key-input" className="api-key-label">
            Gemini APIキー
          </label>
          <input
            id="api-key-input"
            type="text"
            className="api-key-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
          />
          <button
            className="api-key-save-btn"
            onClick={handleSaveApiKey}
          >
            保存
          </button>
          <p className="api-key-help">
            APIキーは <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> で取得できます
          </p>
        </div>
      </div>
    </div>
  );
}
