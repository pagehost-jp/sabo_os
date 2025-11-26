// SABO OS 1.2 Firestore データサービス

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { SaboItem } from '../types';

/**
 * ユーザーのデータをFirestoreに保存
 */
export async function saveUserData(userId: string, items: SaboItem[]): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      items,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Firestore保存エラー:', error);
    throw error;
  }
}

/**
 * ユーザーのデータをFirestoreから取得
 */
export async function getUserData(userId: string): Promise<SaboItem[]> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.items || [];
    }
    return [];
  } catch (error) {
    console.error('Firestore取得エラー:', error);
    throw error;
  }
}

/**
 * ユーザーデータの変更を監視（リアルタイム同期）
 */
export function watchUserData(
  userId: string,
  callback: (items: SaboItem[]) => void
): () => void {
  const userDocRef = doc(db, 'users', userId);

  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.items || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Firestoreリアルタイム監視エラー:', error);
  });
}

/**
 * 最終更新時刻を取得
 */
export async function getLastUpdatedAt(userId: string): Promise<Date | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const timestamp = data.updatedAt as Timestamp;
      return timestamp ? timestamp.toDate() : null;
    }
    return null;
  } catch (error) {
    console.error('最終更新時刻取得エラー:', error);
    return null;
  }
}
