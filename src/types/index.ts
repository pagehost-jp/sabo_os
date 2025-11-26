// SABO OS 2.0 型定義（Gemini API対応）

export type Category =
  | 'work'      // 作業系（ブログ、せどり、経理、編集、tool開発）
  | 'idea'      // ひらめき系（閃いた、作りたい、構想、気づき）
  | 'life'      // 日常系（体調、家事、買い物、連絡）
  | 'emotion'   // 感情系（落ち込んだ、嬉しい、頭パンク、だるい）
  | 'mind'      // 内省・気づき系（気づき、書きたい、学び、振り返り）
  | 'system'    // OS管理系（タスク、影分身、OS改善、設計）
  | 'other';    // その他（分類不可・混乱）

export type Status = 'todo' | 'done';

export type Scope = 'today' | 'this_week' | 'someday';

export interface SaboItem {
  id: string;                    // ユニークID
  rawText: string;               // 元の入力文章
  createdAt: string;             // 作成日時（ISO形式）
  completedAt?: string;          // 完了日時（ISO形式、オプション）
  category: Category;            // 自動分類（7種類）
  status: Status;                // 完了状態
  summary: string;               // AI要約（一言で理解できる）
  scope: Scope;                  // 時間範囲
  detail?: string;               // AI生成の詳細説明（オプション）
  tags?: string[];               // AI生成のタグ（オプション）
  aiProcessed?: boolean;         // AIで処理済みかどうか
}
