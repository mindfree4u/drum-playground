import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getMessaging, getToken } from "firebase/messaging";
import { getFirestore as getFirestoreFirestore, doc, updateDoc } from "firebase/firestore";
import { getDatabase as getDatabaseFirebase, ref, update as rtdbUpdate } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB9wQ0GKE_hF3y_-7qPkJfyibsmAVq7pDM",
  authDomain: "drum-playground.firebaseapp.com",
  projectId: "drum-playground",
  storageBucket: "drum-playground.firebasestorage.app",
  messagingSenderId: "262246327304",
  databaseURL: "https://drum-playground-default-rtdb.asia-southeast1.firebasedatabase.app/",
  appId: "1:262246327304:web:a1850c57d79bc81f721dbd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app); // Realtime Database
export const storage = getStorage(app);
export const functions = getFunctions(app);

// 결제 알림 이메일 전송 함수
export const sendPaymentNotification = httpsCallable(functions, 'sendPaymentNotification');

export async function saveFcmTokenToDatabase() {
  const messaging = getMessaging();
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return;

  try {
    const fcmToken = await getToken(messaging, { vapidKey: "BDoAxIjH3R0sFzc2iKESU4ynGlN26tX24Jt84Duc8u3mX-1NQuAnA1OlDom47agDlLdzoRR0VPMR7xUq1oR8gY4" });
    if (fcmToken) {
      // 1. Realtime Database에 저장
      const rtdb = getDatabaseFirebase();
      await rtdbUpdate(ref(rtdb, `users/${user.uid}`), { fcmToken });

      // 2. Firestore에도 저장
      const firestore = getFirestoreFirestore();
      await updateDoc(doc(firestore, "users", user.uid), { fcmToken });
    }
  } catch (err) {
    console.error("FCM 토큰 저장 실패:", err);
  }
}

const messaging = getMessaging();
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    getToken(messaging, { vapidKey: "BDoAxIjH3R0sFzc2iKESU4ynGlN26tX24Jt84Duc8u3mX-1NQuAnA1OlDom47agDlLdzoRR0VPMR7xUq1oR8gY4" }).then(token => {
      // token을 서버/DB에 저장
    });
  }
}); 