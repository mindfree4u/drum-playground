import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const VAPID_KEY = "BDoAxIjH3R0sFzc2iKESU4ynGlN26tX24Jt84Duc8u3mX-1NQuAnA1OlDom47agDlLdzoRR0VPMR7xUq1oR8gY4";

// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB9wQ0GKE_hF3y_-7qPkJfyibsmAVq7pDM",
  authDomain: "drum-playground.firebaseapp.com",
  projectId: "drum-playground",
  storageBucket: "drum-playground.firebasestorage.app",
  messagingSenderId: "262246327304",
  databaseURL: "https://drum-playground-default-rtdb.asia-southeast1.firebasedatabase.app/",
  appId: "1:262246327304:web:a1850c57d79bc81f721dbd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

async function requestAndSaveFcmToken(user) {
  try {
    const messaging = getMessaging();
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token && user) {
        await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
      }
    }
  } catch (err) {
    console.error('FCM 토큰 저장 실패:', err);
  }
}

// 로그인/회원가입 성공 후
requestAndSaveFcmToken(userCredential.user);