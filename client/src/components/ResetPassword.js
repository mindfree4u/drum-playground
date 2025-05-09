import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, confirmPasswordReset } from 'firebase/auth';
import './Login.css';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // URL에서 oobCode 파라미터 확인
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setError('유효하지 않은 비밀번호 재설정 링크입니다.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const oobCode = searchParams.get('oobCode');
      await confirmPasswordReset(auth, oobCode, newPassword);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('비밀번호 재설정 중 오류가 발생했습니다. 링크가 만료되었을 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>비밀번호 재설정</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="newPassword">새 비밀번호</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">새 비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? '처리중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword; 