// SABO OS 1.0 自動分類ロジック
// v1.0: ルールベース（将来LLM APIに置き換え可能な設計）

import { Category, Scope, SaboItem } from '../types';

/**
 * テキストからカテゴリを自動判定
 */
export function classifyCategory(text: string): Category {
  const lowerText = text.toLowerCase();

  // タスク系
  if (
    lowerText.includes('やりたい') ||
    lowerText.includes('したい') ||
    lowerText.includes('やらなきゃ') ||
    lowerText.includes('しないと') ||
    lowerText.includes('やる') ||
    lowerText.includes('つくる') ||
    lowerText.includes('作る')
  ) {
    return 'task';
  }

  // アイデア系
  if (
    lowerText.includes('ひらめいた') ||
    lowerText.includes('アイデア') ||
    lowerText.includes('思いついた') ||
    lowerText.includes('考えた') ||
    lowerText.includes('いいかも')
  ) {
    return 'idea';
  }

  // 感情系
  if (
    lowerText.includes('疲れた') ||
    lowerText.includes('しんどい') ||
    lowerText.includes('嬉しい') ||
    lowerText.includes('だるい') ||
    lowerText.includes('ムカつく') ||
    lowerText.includes('悲しい') ||
    lowerText.includes('楽しい')
  ) {
    return 'emotion';
  }

  // 日常系
  if (
    lowerText.includes('買い物') ||
    lowerText.includes('掃除') ||
    lowerText.includes('ご飯') ||
    lowerText.includes('風呂') ||
    lowerText.includes('洗濯') ||
    lowerText.includes('料理')
  ) {
    return 'life';
  }

  // システム系
  if (
    lowerText.includes('os') ||
    lowerText.includes('仕様') ||
    lowerText.includes('設計') ||
    lowerText.includes('要件定義') ||
    lowerText.includes('プロンプト') ||
    lowerText.includes('システム')
  ) {
    return 'system';
  }

  return 'other';
}

/**
 * テキストから時間範囲（scope）を自動判定
 */
export function classifyScope(text: string): Scope {
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
 * テキストからサマリーを生成
 * v1.0: 簡易的な変換
 */
export function generateSummary(text: string, category: Category): string {
  let summary = text.trim();

  // 長すぎる場合は短縮
  if (summary.length > 50) {
    summary = summary.substring(0, 47) + '...';
  }

  // カテゴリに応じた語尾変換
  if (category === 'task') {
    // 「〜したい」→「〜する」のような変換
    summary = summary
      .replace(/したい$/,  '')
      .replace(/やりたい$/, '')
      .replace(/やらなきゃ$/, '')
      .replace(/しないと$/, '');

    if (!summary.endsWith('する') && !summary.endsWith('作成') && !summary.endsWith('実装')) {
      // 語尾がない場合は補完しない（元の文章を尊重）
    }
  }

  if (category === 'idea') {
    if (!summary.includes('アイデア')) {
      summary = summary + ' のアイデア';
    }
  }

  return summary || text; // 空になったら元のテキストを返す
}

/**
 * 入力テキストから完全なSaboItemを生成
 */
export function createSaboItem(rawText: string): Omit<SaboItem, 'id'> {
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
  };
}
