// SABO OS 2.0 自動分類ロジック
// Gemini API優先、ルールベースはフォールバック
//
// NOTE: summary の設計方針
// - v1.0 では summary をローカルのロジックで生成している
// - 将来は Gemini API に置き換える想定
// - UI 側は「summary をタイトルとして使う」設計なので、API 切り替え時も変更不要
// - Gemini には「1行の短い要約」を生成させ、それを summary として保存するだけでOK

import type { Category, Scope, SaboItem } from '../types';
import { analyzeWithGemini, isGeminiAvailable } from './geminiService';

/**
 * 入力テキストから完全なSaboItemを生成（Gemini優先）
 */
export async function createSaboItem(rawText: string): Promise<Omit<SaboItem, 'id'>> {
  console.log('🔍 createSaboItem 開始:', rawText);

  // Gemini APIが利用可能な場合は優先的に使用
  const geminiAvailable = isGeminiAvailable();
  console.log('🤖 Gemini API 利用可能?', geminiAvailable);

  if (geminiAvailable) {
    try {
      console.log('📡 Gemini API 呼び出し中...');
      const aiResult = await analyzeWithGemini(rawText);
      console.log('✅ Gemini API レスポンス:', aiResult);

      if (aiResult) {
        console.log('🎉 AI処理成功！カテゴリ:', aiResult.category, 'サマリー:', aiResult.summary);
        return {
          rawText,
          createdAt: new Date().toISOString(),
          category: aiResult.category,
          status: 'todo',
          summary: aiResult.summary,
          scope: aiResult.scope,
          detail: aiResult.detail,
          tags: aiResult.tags,
          aiProcessed: true,
        };
      } else {
        console.warn('⚠️ AI結果がnull。ルールベースにフォールバック');
      }
    } catch (error) {
      console.error('❌ Gemini API処理エラー。ルールベースにフォールバックします。', error);
    }
  }

  // Gemini APIが使えない場合、またはエラー時はルールベース分類
  console.log('📝 ルールベース分類を使用');
  return createSaboItemRuleBased(rawText);
}

/**
 * ルールベースでSaboItemを生成（フォールバック用）
 */
function createSaboItemRuleBased(rawText: string): Omit<SaboItem, 'id'> {
  const category = classifyCategory(rawText);
  const scope = classifyScope(rawText);
  const summary = generateSummary(rawText, category);

  return {
    rawText,
    createdAt: new Date().toISOString(),
    category,
    status: 'todo',
    summary,
    scope,
    aiProcessed: false,
  };
}

/**
 * テキストからカテゴリを自動判定（ルールベース）
 */
function classifyCategory(text: string): Category {
  const lowerText = text.toLowerCase();

  // work系
  if (
    lowerText.includes('ブログ') ||
    lowerText.includes('せどり') ||
    lowerText.includes('経理') ||
    lowerText.includes('編集') ||
    lowerText.includes('作業') ||
    lowerText.includes('仕事') ||
    lowerText.includes('開発')
  ) {
    return 'work';
  }

  // idea系
  if (
    lowerText.includes('ひらめいた') ||
    lowerText.includes('アイデア') ||
    lowerText.includes('思いついた') ||
    lowerText.includes('考えた') ||
    lowerText.includes('いいかも') ||
    lowerText.includes('作りたい') ||
    lowerText.includes('構想')
  ) {
    return 'idea';
  }

  // emotion系
  if (
    lowerText.includes('疲れた') ||
    lowerText.includes('しんどい') ||
    lowerText.includes('嬉しい') ||
    lowerText.includes('だるい') ||
    lowerText.includes('ムカつく') ||
    lowerText.includes('悲しい') ||
    lowerText.includes('楽しい') ||
    lowerText.includes('パンク') ||
    lowerText.includes('落ち込')
  ) {
    return 'emotion';
  }

  // life系
  if (
    lowerText.includes('買い物') ||
    lowerText.includes('掃除') ||
    lowerText.includes('ご飯') ||
    lowerText.includes('風呂') ||
    lowerText.includes('洗濯') ||
    lowerText.includes('料理') ||
    lowerText.includes('体調') ||
    lowerText.includes('家事')
  ) {
    return 'life';
  }

  // mind系
  if (
    lowerText.includes('気づき') ||
    lowerText.includes('書きたい') ||
    lowerText.includes('学び') ||
    lowerText.includes('振り返') ||
    lowerText.includes('スピ') ||
    lowerText.includes('内省')
  ) {
    return 'mind';
  }

  // system系
  if (
    lowerText.includes('os') ||
    lowerText.includes('仕様') ||
    lowerText.includes('設計') ||
    lowerText.includes('要件定義') ||
    lowerText.includes('プロンプト') ||
    lowerText.includes('システム') ||
    lowerText.includes('影分身') ||
    lowerText.includes('タスク整理')
  ) {
    return 'system';
  }

  return 'other';
}

/**
 * テキストから時間範囲（scope）を自動判定（ルールベース）
 */
function classifyScope(text: string): Scope {
  const lowerText = text.toLowerCase();

  // 今日系
  if (
    lowerText.includes('今日') ||
    lowerText.includes('いま') ||
    lowerText.includes('すぐ') ||
    lowerText.includes('急') ||
    lowerText.includes('明日まで')
  ) {
    return 'today';
  }

  // 今週系
  if (
    lowerText.includes('今週') ||
    lowerText.includes('週末') ||
    lowerText.includes('来週')
  ) {
    return 'this_week';
  }

  return 'someday';
}

/**
 * テキストからサマリーを生成（ルールベース）
 */
function generateSummary(text: string, category: Category): string {
  let summary = text.trim();

  // 長すぎる場合は短縮
  if (summary.length > 50) {
    summary = summary.substring(0, 47) + '...';
  }

  // カテゴリに応じた語尾変換
  if (category === 'work' || category === 'idea') {
    summary = summary
      .replace(/したい$/,  '')
      .replace(/やりたい$/, '')
      .replace(/やらなきゃ$/, '')
      .replace(/しないと$/, '');
  }

  if (category === 'idea') {
    if (!summary.includes('アイデア') && !summary.includes('構想')) {
      summary = summary + ' のアイデア';
    }
  }

  return summary || text;
}
