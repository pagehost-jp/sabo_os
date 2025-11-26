// SABO OS 2.0 アイデア入力画面（Gemini API対応）

import { useState, useEffect } from 'react';
import { createSaboItem } from '../services/classifier';
import { saveItem } from '../services/dataService';
import { isGeminiAvailable } from '../services/geminiService';
import { getApiKey, saveApiKey } from '../services/apiKeyService';
import './CaptureView.css';

interface CaptureViewProps {
  onSave: () => void;
}

export default function CaptureView({ onSave }: CaptureViewProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
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
    setShowApiKeyInput(false);
    alert('✅ APIキーを保存しました！');
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert('何か入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // AI解析＆自動分類してアイテム作成
      const item = await createSaboItem(text);

      // 保存
      saveItem(item);

      // 入力欄をクリア
      setText('');

      // 親に通知（リスト更新など）
      onSave();

      const message = isGeminiAvailable()
        ? '🤖 AI解析完了！保存しました！'
        : '✅ 保存しました！';
      alert(message);

    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="capture-view">
      <h2 className="capture-title">💭 思いついたことを入力</h2>

      {/* APIキーステータス表示 */}
      {hasKey ? (
        <div className="ai-status">
          🤖 AI自動解析モード（Gemini）
          <button
            className="api-key-toggle-btn"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            {showApiKeyInput ? '閉じる' : 'APIキー変更'}
          </button>
        </div>
      ) : (
        <div className="rule-based-notice">
          ⚠️ APIキー未設定（ルールベース分類）
          <button
            className="api-key-toggle-btn"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            {showApiKeyInput ? '閉じる' : 'APIキー設定'}
          </button>
        </div>
      )}

      {/* APIキー入力欄 */}
      {showApiKeyInput && (
        <div className="api-key-input-box">
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
      )}

      {/* メインの入力欄 */}
      <textarea
        className="capture-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: アプリの影分身モード作りたい"
        rows={5}
        disabled={isLoading}
      />

      <button
        className="capture-button"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? '🔄 AI解析中...' : '送信'}
      </button>
    </div>
  );
}
