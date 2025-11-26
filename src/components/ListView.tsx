// SABO OS 1.0 リスト画面（管理・振り返り用）

import { useState, useEffect } from 'react';
import { getAllItems } from '../services/dataService';
import { SaboItem } from '../types';
import './ListView.css';

type FilterType = 'all' | 'tasks' | 'done';

export default function ListView() {
  const [items, setItems] = useState<SaboItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const allItems = getAllItems();
    setItems(allItems);
  };

  const getFilteredItems = (): SaboItem[] => {
    switch (filter) {
      case 'tasks':
        return items.filter(item => item.category === 'task');
      case 'done':
        return items.filter(item => item.status === 'done');
      default:
        return items;
    }
  };

  const getCategoryEmoji = (category: string): string => {
    switch (category) {
      case 'task': return '✅';
      case 'idea': return '💡';
      case 'emotion': return '😊';
      case 'life': return '🏠';
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
          タスク ({items.filter(i => i.category === 'task').length})
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
          filteredItems.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className="item-category">
                  {getCategoryEmoji(item.category)} {item.category}
                </span>
                <span className="item-status">
                  {item.status === 'done' ? '✓' : '□'}
                </span>
              </div>
              <div className="item-summary">{item.summary}</div>
              <div className="item-raw">{item.rawText}</div>
              <div className="item-footer">
                <span className="item-scope">{item.scope}</span>
                <span className="item-date">
                  {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
