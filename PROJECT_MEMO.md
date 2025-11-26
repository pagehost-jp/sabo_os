# SABO OS 1.0 - 開発メモ

## 📋 プロジェクト概要

**SABO OS 1.0** - サボ専用の「脳OS」

サボが思いついたことを投げるだけで、アプリが自動で整理・分類・タスク化してくれるシステム。

---

## ✅ 完成した機能（時系列）

### 2025-11-26 初期実装

#### データ層
- ✅ 型定義ファイル作成（`src/types/index.ts`）
  - `SaboItem` インターフェース
  - `Category`, `Status`, `Scope` 型定義

- ✅ 自動分類ロジック実装（`src/services/classifier.ts`）
  - カテゴリ判定: task / idea / emotion / life / system / other
  - 時間範囲判定: today / this_week / someday
  - サマリー生成（簡易版）
  - `createSaboItem()` 関数で完全なアイテム生成

- ✅ データサービス実装（`src/services/dataService.ts`）
  - localStorage でのCRUD操作
  - `getTodayTask()` - 優先順位付きタスク取得
  - `completeTask()` / `deferTask()` - タスク操作

#### UI層
- ✅ 入力画面（`CaptureView.tsx`）
  - シンプルなテキストエリア
  - 自動分類＋保存
  - 送信後クリア

- ✅ 今日の1タスク画面（`SingleTaskView.tsx`）★メイン画面
  - 1件だけ大きく表示
  - 完了 / あとで ボタン
  - タスクなし時の表示

- ✅ リスト画面（`ListView.tsx`）
  - すべて / タスク / 完了 フィルタ
  - カテゴリ別絵文字表示
  - 元テキストとサマリーの両方表示

- ✅ メインアプリ（`App.tsx`）
  - 3画面の切り替え
  - グラデーションヘッダー
  - レスポンシブ対応

#### スタイル
- ✅ グローバルスタイル（`index.css`）
- ✅ コンポーネント別CSS
- ✅ モバイル優先デザイン

#### ドキュメント
- ✅ README.md 作成
- ✅ PROJECT_MEMO.md 作成（このファイル）

---

## 🐛 解決した問題

### 問題1: ファイル書き込みエラー
**状況**: 既存ファイルを読まずにWriteツールを使用
**原因**: Writeツールは既読ファイルのみ編集可能
**解決**: Readツールで読み込んでからEditツールで編集

### 問題2: デフォルトREADME上書き
**状況**: ViteのデフォルトREADMEが存在
**原因**: Vite生成時に自動作成される
**解決**: Editツールで全体を置き換え

---

## 📝 使い方

### 開発者向け
```bash
# セットアップ
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

### ユーザー向け

1. **入力画面** - 思いついたことを入力
   - テキストエリアに入力
   - 送信ボタンを押す
   - カテゴリ分類は自動

2. **今日やること画面** - メイン画面
   - 1つだけタスクが表示される
   - 完了 → 次のタスクへ
   - あとで → 優先度を下げる

3. **リスト画面** - 振り返り用
   - 全アイテムを一覧
   - フィルタで絞り込み
   - デバッグ・確認用

---

## 🔄 次にやること（TODO）

### v1.0 完成まで
- [ ] アプリ起動確認
- [ ] Git初期化・GitHub公開
- [ ] 実際のデータでテスト
  - タスク入力
  - アイデア入力
  - 感情入力
- [ ] バグ修正

### v1.1以降の改善案
- [ ] タスク優先度の視覚化
- [ ] 完了タスク数の表示
- [ ] データエクスポート機能
- [ ] ダークモード対応

### v2.0以降
- [ ] LLM API連携（GPT-4等）
  - 高度な分類
  - 自然な要約
  - コンテキスト理解
- [ ] Firebase連携
  - クラウド同期
  - マルチデバイス対応
- [ ] 音声入力対応
- [ ] リマインダー機能
- [ ] 週次レポート

---

## 🏗️ ファイル構成

```
sabo_os/
├── README.md
├── PROJECT_MEMO.md (このファイル)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx              # エントリーポイント
│   ├── App.tsx               # メインアプリ
│   ├── App.css
│   ├── index.css             # グローバルスタイル
│   ├── components/
│   │   ├── CaptureView.tsx   # 入力画面
│   │   ├── CaptureView.css
│   │   ├── SingleTaskView.tsx # 今日の1タスク
│   │   ├── SingleTaskView.css
│   │   ├── ListView.tsx      # リスト画面
│   │   └── ListView.css
│   ├── services/
│   │   ├── dataService.ts    # localStorage管理
│   │   └── classifier.ts     # 自動分類
│   └── types/
│       └── index.ts          # 型定義
└── public/
```

---

## 💡 設計メモ

### データフロー
1. ユーザー入力（CaptureView）
2. 自動分類（classifier.ts）
   - カテゴリ判定
   - スコープ判定
   - サマリー生成
3. 保存（dataService.ts → localStorage）
4. 表示（SingleTaskView / ListView）

### 拡張性
- `dataService.ts` を変更するだけでFirebase等に移行可能
- `classifier.ts` を変更するだけでLLM連携可能
- コンポーネントは独立しているため個別改修が容易

---

## 📚 参考・学び

- React + TypeScript の基本
- localStorage API
- CSS Grid / Flexbox レイアウト
- コンポーネント設計

---

**最終更新**: 2025-11-26
