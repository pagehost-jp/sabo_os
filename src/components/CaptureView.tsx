// SABO OS 1.0 アイデア入力画面

import { useState } from 'react';
import { createSaboItem } from '../services/classifier';
import { saveItem } from '../services/dataService';
import './CaptureView.css';

interface CaptureViewProps {
  onSave: () => void;
}

export default function CaptureView({ onSave }: CaptureViewProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      alert('何か入力してください');
      return;
    }

    // 自動分類してアイテム作成
    const item = createSaboItem(text);

    // 保存
    saveItem(item);

    // 入力欄をクリア
    setText('');

    // 親に通知（リスト更新など）
    onSave();

    alert('保存しました！');
  };

  return (
    <div className="capture-view">
      <h2 className="capture-title">💭 思いついたことを入力</h2>

      <textarea
        className="capture-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例: アプリの影分身モード作りたい"
        rows={5}
      />

      <button className="capture-button" onClick={handleSubmit}>
        送信
      </button>
    </div>
  );
}
