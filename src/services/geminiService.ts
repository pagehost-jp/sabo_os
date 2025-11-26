// SABO OS 2.0 Gemini API サービス
// 入力テキストをAIで解析し、カテゴリ分類・要約・詳細化を行う

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Category, Scope } from '../types';
import { getApiKey } from './apiKeyService';

// Gemini APIクライアント（キャッシュ）
let genAI: GoogleGenerativeAI | null = null;
let cachedApiKey: string | null = null;
// モデル名キャッシュ（404発生時に代替モデルを記憶）
let cachedModelName: string | null = null;

// ========================================
// 定数
// ========================================

/** デフォルトで使用するGeminiモデル */
const DEFAULT_MODEL = 'gemini-2.5-flash';

/** 404エラー時に試行する既知のGeminiモデル一覧（新しい順） */
const KNOWN_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
] as const;

// ========================================
// ヘルパー関数
// ========================================

/**
 * 404エラーかどうかを判定
 */
function is404Error(error: any): boolean {
  return (
    error?.status === 404 ||
    error?.message?.includes('404') ||
    error?.message?.includes('not found')
  );
}

/**
 * Gemini API用のプロンプトを生成
 */
function buildAnalysisPrompt(text: string): string {
  return `
あなたはサボさんの脳OSアシスタントです。
サボさんが投げた言葉を解析し、以下のJSON形式で返してください。

入力テキスト: "${text}"

【重要な判定基準】
1. カテゴリ分類（7種類）:
   - work: 作業系（ブログ、せどり、経理、編集、tool開発、仕事）
   - idea: ひらめき系（閃いた、作りたい、構想、アイデア、気づき）
   - life: 日常系（体調、家事、買い物、連絡、日常的なこと）
   - emotion: 感情系（落ち込んだ、嬉しい、頭パンク、疲れた、だるい）
   - mind: 内省・気づき系（気づき、書きたい、学び、振り返り、スピ的）
   - system: OS管理系（タスク、影分身、OS改善、設計、要件定義）
   - other: その他（分類不可・混乱）

2. summary（要約）:
   - **最重要**: summary は入力テキストの「やるべきこと」「テーマ」のみを表す
   - **文字数**: 10〜20文字以内（厳守）
   - **形式**: タスクを名詞化し、簡潔な名詞句にする（「〜する」ではなく「〜の準備」「〜作業」など）
   - **主語は不要**: 「僕」「自分」などの主語は summary に含めない
   - **除外すべき要素**:
     - 時間表現: 「明日」「今日」「あした」など
     - 冒頭の口癖: 「あー」「なんか」「そういや」「まじで」など
     - 言い訳や理由: 「けど」「ので」「ちょっと」「まずい」「正直」など
     - 感情表現: 「寝たい」「疲れた」「だるい」「めんどい」「めんどくさい」など
     - 否定的な表現: 「しないと」「あかん」「まだ〜ない」など
   - **抽出すべき要素**: 実際に行う作業・テーマの核心部分のみ
   - **例**:
     - 入力: 「確定申告の準備しないと行けないけど今日はちょっと寝たいのであしたやる」
       → summary: 「確定申告の準備」
     - 入力: 「まじで今日レシート整理しないとまずい」
       → summary: 「レシート整理」
     - 入力: 「YouTubeの説明文まだ書いてないや」
       → summary: 「YouTube説明文作成」
     - 入力: 「明日は市役所行って書類取りに行くなあかんけど、正直めんどいなぁ」
       → summary: 「市役所で書類受け取り」

3. detail（詳細説明）:
   - サボさんの意図を汲み取った具体的な説明
   - 50文字程度
   - 例: "ブログ記事の構成案を考え、執筆を進めたい。特にアイキャッチ画像の作成が必要。"

4. scope（時間範囲）:
   - today: 今日、いま、すぐ、急、明日まで
   - this_week: 今週、週末、来週
   - someday: いつか、将来、特に期限なし

5. tags（タグ）:
   - 内容に関連するキーワードを3〜5個
   - 例: ["ブログ", "執筆", "アイキャッチ"]

【出力形式（必ずこのJSON形式で）】
{
  "category": "work",
  "summary": "〜〜",
  "detail": "〜〜",
  "scope": "today",
  "tags": ["〜", "〜"]
}

【注意】
- JSON以外の文字列は出力しないでください
- サボさんの投げた言葉の意図を最大限汲み取ってください
- 複数の要素が混ざっている場合は、最も重要な要素を優先してください
`;
}

/**
 * Gemini APIを初期化
 */
function initGemini(): GoogleGenerativeAI | null {
  const apiKey = getApiKey();
  console.log('🔑 APIキー取得:', apiKey ? `${apiKey.substring(0, 10)}...` : 'なし');

  if (!apiKey || apiKey === '') {
    console.warn('⚠️ Gemini API Key が設定されていません。ルールベース分類を使用します。');
    return null;
  }

  // APIキーが変わった場合は再初期化
  if (cachedApiKey !== apiKey) {
    console.log('🔄 Gemini AI クライアント初期化中...');
    genAI = new GoogleGenerativeAI(apiKey);
    cachedApiKey = apiKey;
    console.log('✅ Gemini AI クライアント初期化完了');
  } else {
    console.log('♻️ キャッシュされた Gemini AI クライアントを使用');
  }

  return genAI;
}

/**
 * 404エラー時に代替モデルを探す（既知のモデル名を順番に試す）
 */
async function findAlternativeModel(ai: GoogleGenerativeAI, failedModel: string): Promise<string | null> {
  console.log('🔍 利用可能な代替モデルを探索中...');

  // 失敗したモデルを除外
  const modelsToTry = KNOWN_GEMINI_MODELS.filter(m => m !== failedModel);

  // 各モデルを順番に試す
  for (const modelName of modelsToTry) {
    try {
      console.log(`🧪 ${modelName} を試行中...`);
      const testModel = ai.getGenerativeModel({ model: modelName });

      // 簡単なテストリクエストを送信
      await testModel.generateContent('test');

      console.log(`✅ 代替モデル発見: ${modelName}`);
      return modelName;
    } catch (error: any) {
      console.log(`❌ ${modelName}: 利用不可`);
      // 次のモデルを試す
    }
  }

  console.warn('⚠️ 利用可能なGeminiモデルが見つかりませんでした');
  return null;
}

/**
 * AI解析結果の型
 */
export interface AIAnalysisResult {
  category: Category;
  summary: string;
  detail: string;
  scope: Scope;
  tags: string[];
}

/**
 * Gemini APIで入力テキストを解析（404エラー時の自動リトライ機能付き）
 */
export async function analyzeWithGemini(text: string): Promise<AIAnalysisResult | null> {
  console.log('🌟 analyzeWithGemini 開始');
  const ai = initGemini();

  if (!ai) {
    console.warn('⚠️ Gemini AI インスタンスが null');
    return null; // APIキーがない場合はnullを返す（ルールベースにフォールバック）
  }

  // 使用するモデル名（キャッシュがあればそれを使用）
  const modelName = cachedModelName || DEFAULT_MODEL;
  console.log(`🔧 使用モデル: ${modelName}`);

  try {
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = buildAnalysisPrompt(text);

    console.log('📤 Gemini API リクエスト送信中...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    console.log('📥 Gemini API レスポンス受信:', responseText);

    // JSONを抽出（```json ``` のような囲みを削除）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Gemini APIからのレスポンスがJSON形式ではありません:', responseText);
      return null;
    }

    console.log('🔍 JSON抽出成功:', jsonMatch[0]);
    const parsed = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    console.log('✅ JSONパース成功:', parsed);

    // バリデーション
    if (!isValidCategory(parsed.category)) {
      console.error('❌ 無効なカテゴリ:', parsed.category);
      return null;
    }

    if (!isValidScope(parsed.scope)) {
      console.error('❌ 無効なScope:', parsed.scope);
      return null;
    }

    console.log('🎊 バリデーション成功！結果を返します');
    return parsed;

  } catch (error: any) {
    // 404エラーの場合は代替モデルで再試行
    if (is404Error(error)) {
      console.warn(`⚠️ モデル ${modelName} が見つかりません (404エラー)`);

      // まだ代替モデルを試していない場合のみ再試行
      if (!cachedModelName) {
        console.log('🔄 代替モデルを探して再試行します...');
        const alternativeModel = await findAlternativeModel(ai, modelName);

        if (alternativeModel) {
          console.log(`🔁 代替モデル ${alternativeModel} で再試行中...`);
          // 代替モデルをキャッシュに保存
          cachedModelName = alternativeModel;

          // 再帰呼び出しで再試行（一度だけ）
          return await analyzeWithGemini(text);
        } else {
          console.error('❌ 利用可能な代替モデルが見つかりませんでした。ルールベースにフォールバックします。');
          return null;
        }
      } else {
        console.error('❌ 代替モデルでも404エラーが発生しました。ルールベースにフォールバックします。');
        return null;
      }
    }

    // 404以外のエラーはそのままルールベースにフォールバック
    console.error('❌ Gemini API エラー:', error);
    return null;
  }
}

/**
 * カテゴリの妥当性チェック
 */
function isValidCategory(category: string): category is Category {
  return ['work', 'idea', 'life', 'emotion', 'mind', 'system', 'other'].includes(category);
}

/**
 * Scopeの妥当性チェック
 */
function isValidScope(scope: string): scope is Scope {
  return ['today', 'this_week', 'someday'].includes(scope);
}

/**
 * Gemini APIが利用可能かチェック
 */
export function isGeminiAvailable(): boolean {
  const apiKey = getApiKey();
  return !!apiKey && apiKey !== '';
}
