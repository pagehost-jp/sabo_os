// SABO OS 1.2 データ管理サービス
// v1.2: localStorage + Firestore 同期（オフラインファースト）

import type { SaboItem } from '../types';
import { getCurrentUser } from './authService';
import { saveUserData, getUserData } from './firestoreService';

const STORAGE_KEY = 'sabo_os_items';
let syncEnabled = false;

/**
 * 同期を有効化（ログイン時に呼ぶ）
 */
export function enableSync(): void {
  syncEnabled = true;
}

/**
 * 同期を無効化（ログアウト時に呼ぶ）
 */
export function disableSync(): void {
  syncEnabled = false;
}

/**
 * Firestoreと同期（ログイン直後に呼ぶ）
 */
export async function syncWithCloud(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  try {
    // Firestoreからデータを取得
    const cloudItems = await getUserData(user.uid);
    const localItems = getAllItems();

    // 統合：IDで重複をチェックし、新しいタイムスタンプを優先
    const itemMap = new Map<string, SaboItem>();

    // ローカルデータを追加
    localItems.forEach(item => {
      itemMap.set(item.id, item);
    });

    // クラウドデータで更新（新しいもの、または存在しないもの）
    cloudItems.forEach(cloudItem => {
      const localItem = itemMap.get(cloudItem.id);
      if (!localItem || new Date(cloudItem.createdAt) > new Date(localItem.createdAt)) {
        itemMap.set(cloudItem.id, cloudItem);
      }
    });

    // 統合結果をlocalStorageに保存
    const mergedItems = Array.from(itemMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedItems));

    // Firestoreにも保存
    await saveUserData(user.uid, mergedItems);

    console.log('✅ クラウド同期完了');
  } catch (error) {
    console.error('同期エラー:', error);
  }
}

/**
 * データを保存（localStorageとFirestoreの両方）
 */
async function saveToStorage(items: SaboItem[]): Promise<void> {
  // localStorageに保存（即座に）
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  // Firestoreにも保存（バックグラウンド）
  if (syncEnabled) {
    const user = getCurrentUser();
    if (user) {
      try {
        await saveUserData(user.uid, items);
      } catch (error) {
        console.error('Firestore保存エラー:', error);
      }
    }
  }
}

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
export async function saveItem(item: Omit<SaboItem, 'id'>): Promise<SaboItem> {
  const items = getAllItems();
  const newItem: SaboItem = {
    ...item,
    id: generateId(),
  };
  items.push(newItem);
  await saveToStorage(items);
  return newItem;
}

/**
 * アイテムを更新
 */
export async function updateItem(id: string, updates: Partial<SaboItem>): Promise<void> {
  const items = getAllItems();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    await saveToStorage(items);
  }
}

/**
 * アイテムを削除
 */
export async function deleteItem(id: string): Promise<void> {
  const items = getAllItems();
  const filtered = items.filter(item => item.id !== id);
  await saveToStorage(filtered);
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
export async function completeTask(id: string): Promise<void> {
  await updateItem(id, {
    status: 'done',
    completedAt: new Date().toISOString(),
  });
}

/**
 * タスクを未完了に戻す
 */
export async function uncompleteTask(id: string): Promise<void> {
  await updateItem(id, {
    status: 'todo',
    completedAt: undefined,
  });
}

/**
 * タスクを後回しにする
 */
export async function deferTask(id: string): Promise<void> {
  await updateItem(id, { scope: 'someday' });
}

/**
 * タスクを今日やることに設定
 */
export async function setTaskToToday(id: string): Promise<void> {
  await updateItem(id, { scope: 'today' });
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

/**
 * 日付を年月日だけで比較（時間は無視）
 */
function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 指定日付に完了したアイテムを取得
 */
export function getCompletedItemsByDate(targetDate: Date): SaboItem[] {
  const items = getAllItems();
  return items.filter(item => {
    if (item.status !== 'done') return false;

    // completedAt があればそれを使用、なければ createdAt を使用
    const dateStr = item.completedAt || item.createdAt;
    const itemDate = new Date(dateStr);

    return isSameDate(itemDate, targetDate);
  });
}

/**
 * 指定日付の完了タスクの統計を取得
 */
export function getCompletedStatsByDate(targetDate: Date): {
  total: number;
  byCategory: Record<string, number>;
} {
  const items = getCompletedItemsByDate(targetDate);

  const byCategory: Record<string, number> = {};
  items.forEach(item => {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  });

  return {
    total: items.length,
    byCategory,
  };
}
