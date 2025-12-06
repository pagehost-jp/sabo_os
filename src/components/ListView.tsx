// SABO OS 1.0 リスト画面（管理・振り返り用）

import { useState, useEffect } from 'react';
import { getAllItems, deleteItem, uncompleteTask, completeTask, setTaskToToday } from '../services/dataService';
import type { SaboItem } from '../types';
import './ListView.css';

type FilterType = 'all' | 'tasks' | 'done';

export default function ListView() {
  const [items, setItems] = useState<SaboItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('tasks');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeItemId, setSwipeItemId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const allItems = getAllItems();
    setItems(allItems);
  };

  const handleCardLongPress = () => {
    const timer = setTimeout(() => {
      setIsSelectionMode(true);
      setLongPressTimer(null);
    }, 500); // 0.5秒長押しで選択モード
    setLongPressTimer(timer);
  };

  const handleCardLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;

    if (window.confirm(`${selectedItems.size}件のアイテムを削除しますか？`)) {
      selectedItems.forEach(id => deleteItem(id));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      loadItems();
    }
  };

  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleUncomplete = async (id: string) => {
    await uncompleteTask(id);
    loadItems();
  };

  const handleComplete = async (id: string) => {
    await completeTask(id);
    loadItems();
  };

  const handleSetToToday = async (id: string) => {
    await setTaskToToday(id);
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
          (item.category === 'work' || item.category === 'idea' || item.category === 'mind') &&
          item.status === 'todo'
        );
        break;
      case 'done':
        filtered = items.filter(item => item.status === 'done');
        break;
      default:
        filtered = items;
    }

    // 検索クエリでフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.summary.toLowerCase().includes(query) ||
        item.rawText.toLowerCase().includes(query)
      );
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

      {/* 検索ボックス */}
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
            title="クリア"
          >
            ✕
          </button>
        )}
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn active`}
          disabled
        >
          タスク ({items.filter(i => (i.category === 'work' || i.category === 'idea' || i.category === 'mind') && i.status === 'todo').length})
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
                className={`item-card ${isSelectionMode && selectedItems.has(item.id) ? 'selected' : ''}`}
                style={{
                  transform: `translateX(-${offset}px)`,
                  transition: isCurrentSwipe ? 'none' : 'transform 0.3s ease',
                }}
                onMouseDown={handleCardLongPress}
                onMouseUp={handleCardLongPressEnd}
                onMouseLeave={handleCardLongPressEnd}
                onTouchStart={handleCardLongPress}
                onTouchEnd={handleCardLongPressEnd}
                onTouchCancel={handleCardLongPressEnd}
                onClick={() => isSelectionMode && toggleItemSelection(item.id)}
              >
              <div className="item-header">
                <div className="item-header-left">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      className="item-checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <span className="item-category">
                    {getCategoryEmoji(item.category)} {item.category}
                  </span>
                </div>
                <div className="item-header-right">
                  {!isSelectionMode && item.status === 'todo' && (
                    <button
                      className="btn-complete-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(item.id);
                      }}
                    >
                      完了
                    </button>
                  )}
                  {!isSelectionMode && item.status === 'done' && (
                    <button
                      className="btn-uncomplete-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUncomplete(item.id);
                      }}
                    >
                      ✓ 完了済み
                    </button>
                  )}
                </div>
              </div>
              {/* タイトル = summary（Gemini API 連携後もこの設計を維持） */}
              <div className="item-title">{item.summary}</div>
              {/* サブテキスト = rawText（元の入力文） */}
              <div className="item-raw-text">{item.rawText}</div>
              <div className="item-footer">
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

      {/* 選択モード時の操作ボタン */}
      {isSelectionMode && (
        <div className="selection-actions">
          <button className="btn-cancel-selection" onClick={handleCancelSelection}>
            キャンセル
          </button>
          <button
            className="btn-delete-selected"
            onClick={handleDeleteSelected}
            disabled={selectedItems.size === 0}
          >
            削除 ({selectedItems.size})
          </button>
        </div>
      )}
    </div>
  );
}
