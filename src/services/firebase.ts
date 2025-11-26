// SABO OS 1.2 Firebase 設定

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAHZ6i2cqWDw0diPHDs3pvRWlGjm1e0TXY",
  authDomain: "sabo-os.firebaseapp.com",
  projectId: "sabo-os",
  storageBucket: "sabo-os.firebasestorage.app",
  messagingSenderId: "64814474460",
  appId: "1:64814474460:web:b66f37f8d8bc45dd138019"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// 認証
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);
