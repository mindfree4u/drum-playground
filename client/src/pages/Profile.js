import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

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
          const data = userDoc.data();
          setUserData(data);
          setPhone(data.phone || '');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), {
        phone: phone
      });

      setSuccess('전화번호가 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error('Error updating phone:', err);
      setError('전화번호 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // 비밀번호 업데이트
      await updatePassword(user, newPassword);

      setSuccess('비밀번호가 성공적으로 업데이트되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/wrong-password') {
        setError('현재 비밀번호가 올바르지 않습니다.');
      } else {
        setError('비밀번호 업데이트 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Firestore에서 사용자 문서 삭제
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Firebase Authentication에서 사용자 삭제
      await deleteUser(user);

      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('계정 삭제 중 오류가 발생했습니다. 다시 로그인한 후 시도해주세요.');
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="profile-container">
      <h1>개인정보 수정</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="profile-section">
        <h2>기본 정보</h2>
        <div className="info-item">
          <label>이메일:</label>
          <span>{userData?.email}</span>
        </div>
        <div className="info-item">
          <label>이  름:</label>
          <span>{userData?.name || '-'}</span>
        </div>
        <div className="info-item">
          <label>가입일:</label>
          <span>{userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : '-'}</span>
        </div>
      </div>
      
      <div className="profile-section">
        <h2>전화번호 수정</h2>
        <form onSubmit={handlePhoneUpdate}>
          <div className="form-group">
            <label htmlFor="phone">전화번호:</label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 010-1234-5678"
            />
          </div>
          <button type="submit" className="update-button">전화번호 업데이트</button>
        </form>
      </div>
      
      <div className="profile-section">
        <h2>비밀번호 수정</h2>
        <form onSubmit={handlePasswordUpdate}>
          <div className="form-group">
            <label htmlFor="currentPassword">현재 비밀번호:</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">새 비밀번호:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">새 비밀번호 확인:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="update-button">비밀번호 업데이트</button>
        </form>
      </div>
      
      <div className="profile-section">
        <h2>계정 삭제</h2>
        <p>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
        <button onClick={handleDeleteAccount} className="delete-button">계정 삭제</button>
      </div>
    </div>
  );
};

export default Profile; 