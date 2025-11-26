// SABO OS 2.0 APIキー管理サービス

const API_KEY_STORAGE_KEY = 'sabo_os_gemini_api_key';

/**
 * APIキーを保存
 */
export function saveApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

/**
 * APIキーを取得
 */
export function getApiKey(): string | null {
  // まずlocalStorageから取得
  const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (storedKey) {
    return storedKey;
  }

  // localStorageになければ環境変数から取得
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  return envKey || null;
}

/**
 * APIキーを削除
 */
export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * APIキーが設定されているかチェック
 */
export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.trim() !== '';
}
