// src/utils/saveFcmToken.js (예시로 파일 분리)
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getDatabase, ref, update as rtdbUpdate } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { db } from '../firebase';

const VAPID_KEY = "BDoAxIjH3R0sFzc2iKESU4ynGlN26tX24Jt84Duc8u3mX-1NQuAnA1OlDom47agDlLdzoRR0VPMR7xUq1oR8gY4";

export async function saveFcmTokenToDatabase() {
  const messaging = getMessaging();
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return; // 로그인된 유저가 없으면 중단

  try {
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (fcmToken) {
      // 1. Realtime Database에 저장
      const rtdb = getDatabase();
      await rtdbUpdate(ref(rtdb, `users/${user.uid}`), { fcmToken });

      // 2. Firestore에도 저장 (문서가 없으면 생성)
      await setDoc(doc(db, 'users', user.uid), { fcmToken }, { merge: true });
    }
  } catch (err) {
    console.error("FCM 토큰 저장 실패:", err);
  }
}

export async function requestAndSaveFcmToken(user) {
  try {
    const messaging = getMessaging();
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (fcmToken && user) {
        // Firestore에 저장 (예시)
        await setDoc(doc(db, 'users', user.uid), { fcmToken }, { merge: true });
        // 필요하다면 Realtime Database에도 저장
      }
      return fcmToken;
    }
  } catch (err) {
    console.error('FCM 토큰 발급/저장 실패:', err);
  }
  return null;
}

const messaging = getMessaging();
onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
  // 필요하다면 사용자에게 알림 표시
});