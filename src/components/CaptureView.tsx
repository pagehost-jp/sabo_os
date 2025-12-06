// SABO OS 2.0 アイデア入力画面（Gemini API対応）

import { useState } from 'react';
import { createSaboItem } from '../services/classifier';
import { saveItem } from '../services/dataService';
import { isGeminiAvailable } from '../services/geminiService';
import './CaptureView.css';

interface CaptureViewProps {
  onSave: () => void;
}

export default function CaptureView({ onSave }: CaptureViewProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      <textarea
        className="capture-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: アプリの影分身モード作りたい"
        rows={8}
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
