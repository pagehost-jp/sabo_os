// SABO OS 1.0 リスト画面（管理・振り返り用）

import { useState, useEffect } from 'react';
import { getAllItems, deleteItem, uncompleteTask, setTaskToToday } from '../services/dataService';
import type { SaboItem } from '../types';
import './ListView.css';

type FilterType = 'all' | 'tasks' | 'done';

export default function ListView() {
  const [items, setItems] = useState<SaboItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeItemId, setSwipeItemId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const allItems = getAllItems();
    setItems(allItems);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('このアイテムを削除しますか？')) {
      deleteItem(id);
      loadItems();
    }
  };

  const handleUncomplete = (id: string) => {
    uncompleteTask(id);
    loadItems();
  };

  const handleSetToToday = (id: string) => {
    setTaskToToday(id);
    loadItems();
  };

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeItemId(itemId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = swipeStartX - currentX;
    setSwipeOffset(Math.max(0, Math.min(diff, 200)));
  };

  const handleTouchEnd = (item: SaboItem) => {
    if (swipeOffset > 100) {
      // 左スワイプ（100px以上）
      if (item.status === 'todo' &&
          (item.category === 'work' || item.category === 'idea' || item.category === 'mind') &&
          item.scope !== 'today') {
        handleSetToToday(item.id);
      }
    }
    setSwipeStartX(null);
    setSwipeItemId(null);
    setSwipeOffset(0);
  };

  const getFilteredItems = (): SaboItem[] => {
    let filtered: SaboItem[];

    switch (filter) {
      case 'tasks':
        filtered = items.filter(item =>
          item.category === 'work' || item.category === 'idea' || item.category === 'mind'
        );
        break;
      case 'done':
        filtered = items.filter(item => item.status === 'done');
        break;
      default:
        filtered = items;
    }

    // 最新が一番上に来るように降順ソート
    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  const filteredItems = getFilteredItems();

  return (
    <div className="list-view">
      <h2 className="list-title">📂 すべてのアイテム</h2>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          すべて ({items.length})
        </button>
        <button
          className={`filter-btn ${filter === 'tasks' ? 'active' : ''}`}
          onClick={() => setFilter('tasks')}
        >
          タスク ({items.filter(i => i.category === 'work' || i.category === 'idea' || i.category === 'mind').length})
        </button>
        <button
          className={`filter-btn ${filter === 'done' ? 'active' : ''}`}
          onClick={() => setFilter('done')}
        >
          完了 ({items.filter(i => i.status === 'done').length})
        </button>
      </div>

      <div className="item-list">
        {filteredItems.length === 0 ? (
          <div className="empty-list">
            <p>📭</p>
            <p>アイテムがありません</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isSwipeable = item.status === 'todo' &&
              (item.category === 'work' || item.category === 'idea' || item.category === 'mind') &&
              item.scope !== 'today';
            const isCurrentSwipe = swipeItemId === item.id;
            const offset = isCurrentSwipe ? swipeOffset : 0;

            return (
            <div key={item.id} className="item-card-wrapper">
              {isSwipeable && (
                <div
                  className="swipe-action"
                  style={{
                    width: `${offset}px`,
                    opacity: offset > 50 ? 1 : offset / 50,
                  }}
                >
                  📅 今日やる
                </div>
              )}
              <div
                className="item-card"
                style={{
                  transform: `translateX(-${offset}px)`,
                  transition: isCurrentSwipe ? 'none' : 'transform 0.3s ease',
                }}
                onTouchStart={(e) => isSwipeable && handleTouchStart(e, item.id)}
                onTouchMove={(e) => isSwipeable && handleTouchMove(e)}
                onTouchEnd={() => isSwipeable && handleTouchEnd(item)}
              >
              <div className="item-header">
                <span className="item-category">
                  {getCategoryEmoji(item.category)} {item.category}
                </span>
                <div className="item-header-right">
                  <span className="item-status">
                    {item.status === 'done' ? '✓' : '□'}
                  </span>
                  {item.status === 'done' && (
                    <button
                      className="btn-uncomplete"
                      onClick={() => handleUncomplete(item.id)}
                      title="未完了に戻す"
                    >
                      ↩️
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(item.id)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {/* タイトル = summary（Gemini API 連携後もこの設計を維持） */}
              <div className="item-title">{item.summary}</div>
              {/* サブテキスト = rawText（元の入力文） */}
              <div className="item-raw-text">{item.rawText}</div>
              <div className="item-footer">
                <div className="item-footer-left">
                  <span className="item-scope">{item.scope}</span>
                  {item.status === 'todo' &&
                   (item.category === 'work' || item.category === 'idea' || item.category === 'mind') &&
                   item.scope !== 'today' && (
                    <button
                      className="btn-set-today"
                      onClick={() => handleSetToToday(item.id)}
                    >
                      📅 今日やる
                    </button>
                  )}
                </div>
                <div className="item-dates">
                  <span className="item-date">📝 {formatDateTime(item.createdAt)}</span>
                  {item.completedAt && (
                    <span className="item-date">✅ {formatDateTime(item.completedAt)}</span>
                  )}
                </div>
              </div>
            </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
