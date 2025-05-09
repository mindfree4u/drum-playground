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
import './App.css';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme/theme';
import 'dayjs/locale/ko';

const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const NonMemberReservation = lazy(() => import('./components/NonMemberReservation'));

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed.');
      console.log('User UID:', user?.uid);
      setUser(user);
      
      if (user) {
        try {
          const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(userQuery);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('User role:', userData.role);
            console.log('User ID:', userData.userId);
            
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
<<<<<<< HEAD
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
        <Router>
          <div className="app-container">
            <MainMenu isAdmin={isAdmin} />
            <div className="content-wrapper">
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
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
                <Route path="/non-member-reservation" element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <NonMemberReservation />
                  </Suspense>
                } />
                <Route path="/" element={<Navigate to="/main" replace />} />
              </Routes>
              <Footer />
            </div>
          </div>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
=======
    <Router>
      <div className="app">
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
            <Route path="/" element={<Navigate to="/main" replace />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </Router>
>>>>>>> 50a60e87b4fdfd723d924c1f96a2f55e633c4d2b
  );
}

export default App;