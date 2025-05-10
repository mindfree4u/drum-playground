// client/src/components/Login.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db, functions } from '../firebase';
import { getDocs, query, collection, where } from 'firebase/firestore';
import './Login.css';
import { httpsCallable } from 'firebase/functions';

function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFindId, setShowFindId] = useState(false);
  const [showFindPassword, setShowFindPassword] = useState(false);
  const [findName, setFindName] = useState('');
  const [findEmail, setFindEmail] = useState('');
  const [findId, setFindId] = useState('');
  const [findResult, setFindResult] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, find the user's email using their userId
      const q = query(collection(db, 'users'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('존재하지 않는 아이디입니다.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;

      // Now sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 로그인 성공 후 저장된 리다이렉트 경로 확인
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectPath;
      } else {
        window.location.href = '/main';
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindId = async (e) => {
    e.preventDefault();
    setError('');
    setFindResult('');
    setLoading(true);

    try {
      const q = query(
        collection(db, 'users'),
        where('name', '==', findName),
        where('email', '==', findEmail)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('일치하는 회원정보가 없습니다.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Send email with ID using Firebase Functions
      const sendIdEmail = httpsCallable(functions, 'sendIdEmail');
      const result = await sendIdEmail({
        email: findEmail,
        userId: userData.userId
      });
      
      if (result.data.success) {
        setFindResult('아이디가 이메일로 전송되었습니다.');
        setFindName('');
        setFindEmail('');
        setTimeout(() => {
          setShowFindId(false);
          setFindResult('');
        }, 2000);
      } else {
        setError('이메일 전송 중 오류가 발생했습니다.');
      }
      
    } catch (error) {
      console.error('Error finding ID:', error);
      setError('아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindPassword = async (e) => {
    e.preventDefault();
    setError('');
    setFindResult('');
    setLoading(true);

    try {
      const q = query(
        collection(db, 'users'),
        where('userId', '==', findId),
        where('email', '==', findEmail)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('일치하는 회원정보가 없습니다.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Send email with masked password using Firebase Functions
      const sendPasswordEmail = httpsCallable(functions, 'sendPasswordEmail');
      console.log('Sending password find request:', { email: findEmail });
      
      const result = await sendPasswordEmail({
        email: findEmail,
        userId: userData.userId
      });
      
      console.log('Password find response:', result.data);
      
      if (result.data.success) {
        setFindResult('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
        setFindId('');
        setFindEmail('');
        setTimeout(() => {
          setShowFindPassword(false);
          setFindResult('');
        }, 2000);
      } else {
        setError(result.data.message || '이메일 전송 중 오류가 발생했습니다.');
      }
      
    } catch (error) {
      console.error('Error finding password:', error);
      setError(error.message || '비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFindForm = () => {
    setShowFindId(false);
    setShowFindPassword(false);
    setFindName('');
    setFindEmail('');
    setFindId('');
    setError('');
    setFindResult('');
  };

  return (
    <div className="login-container">
      <h2>드럼놀이터 예약 시스템</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="userId">아이디</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {findResult && <div className="success-message">{findResult}</div>}
        <button type="submit" disabled={loading}>
          {loading ? '처리중...' : '로그인'}
        </button>
        <div className="auth-links">
          <Link to="/signup" className="signup-link">회원가입</Link>
          <button 
            type="button" 
            className="find-link" 
            onClick={() => {
              setShowFindId(true);
              setShowFindPassword(false);
            }}
          >
            아이디 찾기
          </button>
          <button 
            type="button" 
            className="find-link" 
            onClick={() => {
              setShowFindPassword(true);
              setShowFindId(false);
            }}
          >
            비밀번호 찾기
          </button>
        </div>
      </form>

      {showFindId && (
        <form onSubmit={handleFindId} className="find-form">
          <h3>아이디 찾기</h3>
          <button type="button" className="close-button" onClick={handleCloseFindForm}>×</button>
          <div className="form-group">
            <label htmlFor="findName">이름</label>
            <input
              type="text"
              id="findName"
              value={findName}
              onChange={(e) => setFindName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="findEmail">이메일</label>
            <input
              type="email"
              id="findEmail"
              value={findEmail}
              onChange={(e) => setFindEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? '처리중...' : '아이디 찾기'}
          </button>
        </form>
      )}

      {showFindPassword && (
        <form onSubmit={handleFindPassword} className="find-form">
          <h3>비밀번호 찾기</h3>
          <button type="button" className="close-button" onClick={handleCloseFindForm}>×</button>
          <div className="form-group">
            <label htmlFor="findId">아이디</label>
            <input
              type="text"
              id="findId"
              value={findId}
              onChange={(e) => setFindId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="findEmail">이메일</label>
            <input
              type="email"
              id="findEmail"
              value={findEmail}
              onChange={(e) => setFindEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? '처리중...' : '비밀번호 찾기'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Login;