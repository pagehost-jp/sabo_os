// SABO OS 1.0 型定義

export type Category =
  | 'task'      // やるべきこと
  | 'idea'      // ひらめき
  | 'emotion'   // 感情
  | 'life'      // 日常
  | 'system'    // OS関連
  | 'other';    // その他

export type Status = 'todo' | 'done';

export type Scope = 'today' | 'this_week' | 'someday';

export interface SaboItem {
  id: string;                    // ユニークID
  rawText: string;               // 元の入力文章
  createdAt: string;             // 作成日時（ISO形式）
  category: Category;            // 自動分類
  status: Status;                // 完了状態
  summary: string;               // 一言要約
  scope: Scope;                  // 時間範囲
}
