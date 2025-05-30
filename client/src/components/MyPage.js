import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './MyPage.css';

function MyPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name || '');
          setPhone(userData.phone || '');
          setEmail(userData.email || '');
          setUserId(userData.userId || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('사용자 정보를 불러오는데 실패했습니다.');
      }
    };

    fetchUserData();
  }, [auth, navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Firebase Auth 프로필 업데이트
      await updateProfile(user, {
        displayName: name
      });

      // Firestore 사용자 정보 업데이트
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        phone,
        updatedAt: new Date().toISOString()
      });

      setSuccess('개인정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating user data:', error);
      setError('개인정보 수정에 실패했습니다.');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // 비밀번호 업데이트
      await updatePassword(user, newPassword);

      setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('현재 비밀번호가 일치하지 않습니다.');
      } else {
        setPasswordError('비밀번호 변경에 실패했습니다.');
      }
    }
  };

  return (
    <div className="my-page-container">
      <h2>My Page</h2>
      
      <form onSubmit={handleProfileUpdate} className="my-page-form">
        <h3>개인정보 수정</h3>
        <div className="form-group">
          <label htmlFor="userId">아이디</label>
          <input
            type="text"
            id="userId"
            value={userId}
            disabled
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            disabled
          />
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
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit">개인정보 수정하기</button>
      </form>

      <form onSubmit={handlePasswordUpdate} className="my-page-form">
        <h3>비밀번호 변경</h3>
        <div className="form-group">
          <label htmlFor="currentPassword">현재 비밀번호</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">새 비밀번호</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmNewPassword">새 비밀번호 확인</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>
        {passwordError && <div className="error-message">{passwordError}</div>}
        {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
        <button type="submit">비밀번호 변경하기</button>
      </form>
    </div>
  );
}

export default MyPage; 