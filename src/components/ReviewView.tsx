// SABO OS 1.1 振り返りビュー

import { useState, useEffect } from 'react';
import { getCompletedItemsByDate, getCompletedStatsByDate } from '../services/dataService';
import type { SaboItem } from '../types';
import './ReviewView.css';

export default function ReviewView() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [items, setItems] = useState<SaboItem[]>([]);
  const [stats, setStats] = useState<{ total: number; byCategory: Record<string, number> }>({
    total: 0,
    byCategory: {},
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = () => {
    const targetDate = new Date(selectedDate + 'T00:00:00');
    const completedItems = getCompletedItemsByDate(targetDate);
    const completedStats = getCompletedStatsByDate(targetDate);

    setItems(completedItems);
    setStats(completedStats);
  };

  const getCategoryEmoji = (category: string): string => {
    switch (category) {
      case 'work': return '💼';
      case 'idea': return '💡';
      case 'life': return '🏠';
      case 'emotion': return '😊';
      case 'mind': return '🧠';
      case 'system': return '⚙️';
      default: return '📝';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'work': return '仕事';
      case 'idea': return 'アイデア';
      case 'life': return '人生';
      case 'emotion': return '感情';
      case 'mind': return '内省';
      case 'system': return 'システム';
      default: return 'その他';
    }
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  return (
    <div className="review-view">
      <div className="review-card">
        <h2 className="review-title">🌅 今日を振り返る</h2>

        <div className="date-selector">
          <label htmlFor="review-date" className="date-label">
            日付を選択
          </label>
          <input
            id="review-date"
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="review-summary">
          <h3 className="summary-date">{formatDateDisplay(selectedDate)} のまとめ</h3>
          <p className="summary-count">完了したタスク数: {stats.total}件</p>

          {stats.total > 0 && (
            <div className="category-breakdown">
              <h4 className="breakdown-title">カテゴリ別の内訳</h4>
              <div className="category-list">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div key={category} className="category-item">
                    <span className="category-emoji">{getCategoryEmoji(category)}</span>
                    <span className="category-name">{getCategoryLabel(category)}</span>
                    <span className="category-count">{count}件</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-review">
            <p className="empty-emoji">📭</p>
            <p className="empty-message">この日はまだ完了したことがありません。</p>
          </div>
        ) : (
          <div className="completed-items">
            <h4 className="items-title">完了したアイテム</h4>
            {items.map(item => (
              <div key={item.id} className="review-item">
                <div className="item-header-row">
                  <span className="item-category-badge">
                    {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
                  </span>
                  {item.completedAt && (
                    <span className="item-time">{formatTime(item.completedAt)}</span>
                  )}
                </div>
                <div className="item-summary-text">{item.summary}</div>
                <div className="item-raw-text-small">{item.rawText}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 今日の日付を YYYY-MM-DD 形式で取得
 */
function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
