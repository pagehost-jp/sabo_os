# SABO OS 2.0 - 開発メモ

## 📝 プロジェクト概要

**サボさん専用の脳OS（タスク管理アプリ）**

思いついたことを投げると、Gemini AIが自動で分類・要約してくれるタスク管理システム。
直感的なスワイプ操作で「今日やること」にタスクを移動できる、感覚的に使えるWebアプリ。

- **技術スタック**: React 19 + TypeScript + Vite
- **AI連携**: Gemini API (gemini-2.5-flash)
- **データ保存**: localStorage
- **リポジトリ**: https://github.com/pagehost-jp/sabo_os

---

## ✅ 完成した機能

### 1. AI自動分類・要約機能（Gemini API連携）
- 入力テキストを7カテゴリに自動分類（work, idea, life, emotion, mind, system, other）
- AIが10〜20文字の短い要約を生成（summaryとしてタイトル表示）
- 時間範囲（today, this_week, someday）を自動判定
- 404エラー時の自動リトライ機能（利用可能なモデルを自動探索）

### 2. APIキー管理
- localStorage でAPIキーを安全に管理
- .env不要、ブラウザのUIから直接設定可能
- APIキー未設定時はルールベース分類にフォールバック

### 3. スワイプジェスチャー
- タスクを左にスワイプ（100px以上）で「今日やる」に移動
- 緑色の背景で視覚的フィードバック
- スマホ操作に最適化

### 4. ListView機能
- 最新順ソート（新しいタスクが一番上）
- フィルター機能（すべて / タスク / 完了）
- 削除機能（確認ダイアログ付き）
- 未完了に戻す機能
- 作成日時・完了日時の表示（例: 11/26 14:30）
- 「今日やる」ボタン（スワイプ不可の環境用）

### 5. SingleTaskView（今日やること画面）
- 今日やるタスクを1件だけ表示（フォーカス）
- 完了/後回しボタン
- 優先順位: today → this_week → someday

### 6. CaptureView（入力画面）
- AI解析中の状態表示（🔄 AI解析中...）
- APIキー設定UI（トグル式）
- ルールベース分類時の警告表示

---

## 🔧 解決した問題と原因

### 問題1: Gemini APIが404エラー
**原因**: モデル名 `gemini-pro` が古く、API v1beta では利用不可だった

**解決策**:
1. Google AI Studio の公式サンプルコードを確認
2. 最新モデル名 `gemini-2.5-flash` に変更
3. 404エラー時の自動リトライ機能を実装（既知のモデルを順番に試す）

**該当ファイル**: `src/services/geminiService.ts:19-28`

### 問題2: AI要約が長すぎる（入力文と同じ）
**原因**: Gemini へのプロンプトが曖昧で、短い要約を生成するルールが不明確だった

**解決策**:
- プロンプトに詳細なルールを追加（10〜20文字厳守）
- 除外すべき要素を明記（時間表現、口癖、感情表現、言い訳など）
- 具体的な変換例を3つ提示

**該当ファイル**: `src/services/geminiService.ts:66-86`

### 問題3: 「今日やる」への移動がボタン式で直感的でない
**原因**: ボタンクリックだと操作が煩雑

**解決策**:
- スワイプジェスチャーを実装
- Touch API（touchStart, touchMove, touchEnd）を使用
- CSS transform でスムーズなアニメーション

**該当ファイル**:
- `src/components/ListView.tsx:52-76`
- `src/components/ListView.css:49-68`

### 問題4: リストが逆順（古いものが上）
**原因**: `getFilteredItems()` でソートしていなかった

**解決策**:
- `createdAt` の降順ソートを追加

**該当ファイル**: `src/components/ListView.tsx:95-97`

---

## 📂 ファイル構成

```
sabo_os/
├── src/
│   ├── components/
│   │   ├── CaptureView.tsx       # 入力画面（Gemini連携、APIキー設定）
│   │   ├── CaptureView.css
│   │   ├── ListView.tsx          # リスト画面（スワイプ、削除、完了管理）
│   │   ├── ListView.css
│   │   ├── SingleTaskView.tsx    # 今日やること画面
│   │   └── SingleTaskView.css
│   ├── services/
│   │   ├── geminiService.ts      # Gemini API連携（404リトライ付き）
│   │   ├── apiKeyService.ts      # APIキー管理（localStorage）
│   │   ├── dataService.ts        # データCRUD（localStorage）
│   │   └── classifier.ts         # 分類ロジック（Gemini優先、ルールベースフォールバック）
│   ├── types/
│   │   └── index.ts              # 型定義（SaboItem, Category, Scope）
│   ├── App.tsx                   # メインアプリ（タブ切り替え）
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example                  # APIキー設定例（実際は不要）
└── PROJECT_MEMO.md               # このファイル
```

---

## 🚀 使い方

### 1. セットアップ

```bash
cd ~/Desktop/プロジェクト/sabo_os
npm install
```

### 2. Gemini APIキーを取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. APIキーをコピー

### 3. 開発サーバー起動

```bash
npm run dev -- --port 8000
```

ブラウザで http://localhost:8000 を開く

### 4. APIキーを設定

1. 「💭 思いついたことを入力」タブを開く
2. 「APIキー設定」ボタンをクリック
3. 取得したAPIキーを貼り付けて「保存」

### 5. 使ってみる

- **入力**: 「明日は市役所行って書類取りに行くなあかん」
- **AI処理**: カテゴリ自動分類 → 要約生成 → 時間範囲判定
- **結果**:
  - カテゴリ: life
  - タイトル: 「市役所で書類受け取り」
  - 範囲: today

### 6. タスク管理

- **今日やること**: 「📝 今日やること」タブでフォーカス
- **スワイプ**: リストで左にスワイプ → 「今日やる」に移動
- **完了**: チェックボタンをタップ
- **削除**: 🗑️ ボタンをタップ

### スマホからアクセス

```bash
# 同じWiFi内のデバイスからアクセス可能にする
npm run dev -- --host --port 8000
```

表示されるネットワークアドレス（例: http://192.168.1.100:8000）にスマホでアクセス

---

## 📋 次にやること候補

### 優先度: 高
- [ ] Vercel/Netlify へのデプロイ（常時アクセス可能にする）
- [ ] PWA化（ホーム画面に追加、オフライン対応）
- [ ] タスクの編集機能（タイトル・カテゴリ・範囲を変更）

### 優先度: 中
- [ ] タグ機能の表示（現在は保存されているが未表示）
- [ ] 検索機能（タイトル・タグで絞り込み）
- [ ] カテゴリ別の統計表示（週ごとの完了数など）
- [ ] ダークモード対応

### 優先度: 低
- [ ] Firebase 連携（複数デバイス同期）
- [ ] 通知機能（今日やることのリマインダー）
- [ ] 音声入力対応（スマホでハンズフリー入力）
- [ ] カレンダービュー（日付ごとの完了タスク一覧）

---

## 🎨 デザイン設計

### カラーパレット
- プライマリー: `#4CAF50` (グリーン)
- アクセント: `#667eea` (パープル、Gemini用)
- 背景: `#f5f5f5`
- テキスト: `#333`

### Summary-as-Title 設計
- **summary**: AIが生成した10〜20文字の要約をタイトルとして表示
- **rawText**: 元の入力文をサブテキストとして表示
- この設計により、AI切り替え時もUI変更不要

---

## 📊 現在の状態

**バージョン**: 2.0
**最終更新**: 2025-11-26
**開発状況**: MVP完成、GitHubにプッシュ済み

- ✅ Gemini API連携完了
- ✅ スワイプジェスチャー実装完了
- ✅ タスク管理CRUD完了
- 🔄 デプロイ準備中

---

## 💡 技術メモ

### Gemini API のモデル名変更対応
モデル名は頻繁に変わるため、`KNOWN_GEMINI_MODELS` 配列で既知のモデルをリスト化。
404エラー時は自動で代替モデルを探索し、見つかったモデル名をキャッシュする。

### localStorage の使用理由
v1.0 では手軽さ優先で localStorage を採用。
将来的に Firebase 等へ移行可能な設計（dataService で抽象化済み）。

### スワイプジェスチャーの実装
- `touch-action: pan-y` で縦スクロールを維持
- `user-select: none` で誤選択を防止
- 100px 以上のスワイプでアクション発火

---

## 🔗 参考リンク

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API ドキュメント](https://ai.google.dev/gemini-api/docs)
- [React 公式ドキュメント](https://react.dev/)
- [Vite 公式ドキュメント](https://vitejs.dev/)
