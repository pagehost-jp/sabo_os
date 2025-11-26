// SABO OS 1.0 データ管理サービス
// v1.0: localStorage（将来Firebase等に移行可能な設計）

import type { SaboItem } from '../types';

const STORAGE_KEY = 'sabo_os_items';

/**
 * すべてのアイテムを取得
 */
export function getAllItems(): SaboItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SaboItem[];
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    return [];
  }
}

/**
 * アイテムを保存（新規作成）
 */
export function saveItem(item: Omit<SaboItem, 'id'>): SaboItem {
  const items = getAllItems();
  const newItem: SaboItem = {
    ...item,
    id: generateId(),
  };
  items.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return newItem;
}

/**
 * アイテムを更新
 */
export function updateItem(id: string, updates: Partial<SaboItem>): void {
  const items = getAllItems();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

/**
 * アイテムを削除
 */
export function deleteItem(id: string): void {
  const items = getAllItems();
  const filtered = items.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 今日やるタスクを1件取得（優先順位: today → this_week → someday）
 * work, idea, mind カテゴリをタスクとして扱う
 */
export function getTodayTask(): SaboItem | null {
  const items = getAllItems();
  const tasks = items.filter(
    item => (item.category === 'work' || item.category === 'idea' || item.category === 'mind') && item.status === 'todo'
  );

  // 優先順位順に探す
  const todayTask = tasks.find(t => t.scope === 'today');
  if (todayTask) return todayTask;

  const thisWeekTask = tasks.find(t => t.scope === 'this_week');
  if (thisWeekTask) return thisWeekTask;

  const somedayTask = tasks.find(t => t.scope === 'someday');
  if (somedayTask) return somedayTask;

  return null;
}

/**
 * タスクを完了にする
 */
export function completeTask(id: string): void {
  updateItem(id, {
    status: 'done',
    completedAt: new Date().toISOString(),
  });
}

/**
 * タスクを未完了に戻す
 */
export function uncompleteTask(id: string): void {
  updateItem(id, {
    status: 'todo',
    completedAt: undefined,
  });
}

/**
 * タスクを後回しにする
 */
export function deferTask(id: string): void {
  updateItem(id, { scope: 'someday' });
}

/**
 * タスクを今日やることに設定
 */
export function setTaskToToday(id: string): void {
  updateItem(id, { scope: 'today' });
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * すべてのデータをクリア（デバッグ用）
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
