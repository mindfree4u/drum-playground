import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AuthNav.css';

function AuthNav() {
  const location = useLocation();

  return (
    <nav className="auth-nav">
      <div className="container">
        <Link className="navbar-brand" to="/login">
          드럼 연습실 예약 시스템
        </Link>
        <div className="auth-links">
          <Link
            to="/login"
            className={`auth-link ${location.pathname === '/login' ? 'active' : ''}`}
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className={`auth-link ${location.pathname === '/signup' ? 'active' : ''}`}
          >
            회원가입
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default AuthNav; 