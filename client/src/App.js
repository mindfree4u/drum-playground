// client/src/App.js

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import Login from './components/Login';
import Signup from './components/Signup';
import MainPage from './components/MainPage';
import Introduction from './components/Introduction';
import ReservationForm from './components/ReservationForm';
import VideoUpload from './components/VideoUpload';
import PlaygroundPhotos from './components/PlaygroundPhotos';
import Board from './components/Board';
import QnABoard from './components/QnABoard';
import PostDetail from './components/PostDetail';
import MyPage from './components/MyPage';
import Footer from './components/Footer';
import Location from './components/Location';
import MainMenu from './components/MainMenu';
import MemberInfo from './pages/MemberInfo';
import Profile from './pages/Profile';
import MyReservations from './pages/MyReservations';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentSettings from './pages/PaymentSettings';
import PaymentHistory from './pages/PaymentHistory';
import ResetPassword from './components/ResetPassword';
import SendKakao from './pages/SendKakao';
import ReservationStats from './pages/ReservationStats';
//import PushNotification from './pages/PushNotification';
import { 
  isKakaoTalkInApp, 
  optimizeForKakaoInApp, 
  debugKakaoInApp,
  showKakaoInAppNotice 
} from './utils/kakaoInAppUtils';
import './App.css';

const PaymentPage = lazy(() => import('./pages/PaymentPage'));

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isKakaoInApp, setIsKakaoInApp] = useState(false);
  const auth = getAuth();

  // 카카오톡 인앱 브라우저 감지 및 최적화
  useEffect(() => {
    const kakaoInApp = isKakaoTalkInApp();
    setIsKakaoInApp(kakaoInApp);
    
    if (kakaoInApp) {
      console.log('🔍 카카오톡 인앱 브라우저에서 실행 중');
      
      // 디버그 정보 출력
      debugKakaoInApp();
      
      // 카카오톡 인앱 브라우저 최적화 적용
      optimizeForKakaoInApp();
      
      // 사용자에게 알림 표시 (선택사항)
      // showKakaoInAppNotice('카카오톡에서 실행 중입니다. 일부 기능이 제한될 수 있습니다.', 'info');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed.');
      console.log('User UID:', user?.uid);
      setUser(user);
      
      if (user) {
        try {
          // 먼저 email로 userId 찾기
          const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(userQuery);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('User role:', userData.role);
            console.log('User ID:', userData.userId);
            
            // role이 'admin'인 경우 관리자로 설정
            const isUserAdmin = userData.isAdmin === true || userData.role === 'admin' || userData.userId === 'admin';
            console.log('Is admin check result:', isUserAdmin);
            setIsAdmin(isUserAdmin);
          } else {
            console.log('No user document found for email:', user.email);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        console.log('No user logged in');
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className={`app ${isKakaoInApp ? 'kakao-inapp' : ''}`}>
        {/* 카카오톡 인앱 브라우저 알림 (필요시) */}
        {isKakaoInApp && (
          <div className="kakao-inapp-notice" style={{
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(135deg, #FEE500, #FFCD00)',
            color: '#3C1E1E',
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            borderBottom: '1px solid #E6D200'
          }}>
            📱 카카오톡에서 실행 중 | 더 나은 경험을 위해 브라우저에서 열어보세요
          </div>
        )}
        
        <MainMenu isAdmin={isAdmin} />
        <div className="content-wrapper">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reservation" element={user ? <ReservationForm isAdmin={isAdmin} /> : <Navigate to="/login" />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/introduction" element={<Introduction isAdmin={isAdmin} />} />
            <Route path="/video-upload" element={<VideoUpload isAdmin={isAdmin} />} />
            <Route path="/playground-photos" element={<PlaygroundPhotos isAdmin={isAdmin} />} />
            <Route path="/board" element={<Board isAdmin={isAdmin} />} />
            <Route path="/qna" element={<QnABoard isAdmin={isAdmin} />} />
            <Route path="/board/post/:id" element={<PostDetail />} />
            <Route path="/my-page" element={<MyPage />} />
            <Route path="/location" element={<Location />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/my-reservations" element={user ? <MyReservations /> : <Navigate to="/login" />} />
            <Route path="/member-info" element={user && isAdmin ? <MemberInfo /> : <Navigate to="/" />} />
            <Route path="/payment-settings" element={user && isAdmin ? <PaymentSettings /> : <Navigate to="/" />} />
            <Route path="/payment" element={user ? (
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentPage />
              </Suspense>
            ) : <Navigate to="/login" />} />
            <Route path="/payment/success" element={user ? <PaymentSuccess /> : <Navigate to="/login" />} />
            <Route path="/admin/payment-history" element={user && isAdmin ? <PaymentHistory /> : <Navigate to="/" />} />
            <Route path="/admin/send-kakao" element={user && isAdmin ? <SendKakao /> : <Navigate to="/" />} />
            <Route path="/admin/reservation-stats" element={user && isAdmin ? <ReservationStats /> : <Navigate to="/" />} />
            {/* <Route path="/admin/push-notification" element={<PushNotification />} /> */}
            <Route path="/" element={<Navigate to="/main" replace />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;