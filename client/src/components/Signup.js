// client/src/components/Signup.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDocs, query, collection, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import './Signup.css';

function Signup() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isIdAvailable, setIsIdAvailable] = useState(true);
  const [isEmailAvailable, setIsEmailAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const checkUserIdExists = async (id) => {
    if (!id) {
      setIsIdAvailable(true);
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('userId', '==', id));
      const querySnapshot = await getDocs(q);
      setIsIdAvailable(querySnapshot.empty);
    } catch (error) {
      console.error('Error checking user ID:', error);
      setIsIdAvailable(false);
    }
  };

  const checkEmailExists = async (email) => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setIsEmailAvailable(true);
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      setIsEmailAvailable(querySnapshot.empty);
    } catch (error) {
      console.error('Error checking email:', error);
      setIsEmailAvailable(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUserIdExists(userId);
    }, 500);

    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkEmailExists(email);
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 기본 유효성 검사
    if (!isIdAvailable) {
      setError('이미 사용 중인 아이디입니다.');
      setLoading(false);
      return;
    }

    if (!isEmailAvailable) {
      setError('이미 사용 중인 이메일입니다.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (!name) {
      setError('이름을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!phone) {
      setError('전화번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('올바른 이메일 형식이 아닙니다.');
      }

      // 비밀번호 길이 검증
      if (password.length < 6) {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      }

      // userId 형식 검증 (영문, 숫자, 언더스코어만 허용)
      const userIdRegex = /^[a-zA-Z0-9_]+$/;
      if (!userIdRegex.test(userId)) {
        throw new Error('아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
      }

      // 전화번호 형식 검증
      const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      }

      // 이메일로 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        email,
        name,
        phone,
        userId,
        role: 'guest',
        isAdmin: userId === 'admin',
        createdAt: Timestamp.now()
      });

      // 사용자 프로필 업데이트
      await updateProfile(user, {
        displayName: name
      });

      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호가 너무 약합니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('올바른 이메일 형식이 아닙니다.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-group">
          <label htmlFor="userId">아이디</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className={userId && !isIdAvailable ? 'error-input' : ''}
          />
          {userId && !isIdAvailable && (
            <div className="error-message">이미 사용 중인 아이디입니다.</div>
          )}
          {userId && isIdAvailable && userId.length > 0 && (
            <div className="success-message">사용 가능한 아이디입니다.</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={email && !isEmailAvailable ? 'error-input' : ''}
          />
          {email && !isEmailAvailable && (
            <div className="error-message">이미 사용 중인 이메일입니다.</div>
          )}
          {email && isEmailAvailable && email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) && (
            <div className="success-message">사용 가능한 이메일입니다.</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">전화번호</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => {
              // 자동으로 하이픈 추가
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 11) {
                let formattedValue = value;
                if (value.length > 3 && value.length <= 7) {
                  formattedValue = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
                } else if (value.length > 7) {
                  formattedValue = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
                }
                setPhone(formattedValue);
              }
            }}
            placeholder="010-0000-0000"
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
            minLength={6}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button 
          type="submit" 
          disabled={!isIdAvailable || !isEmailAvailable || loading}
        >
          {loading ? '처리중...' : '회원가입'}
        </button>
        <Link to="/login" className="login-link">로그인</Link>
      </form>
    </div>
  );
}

export default Signup;