// client/src/components/MainMenu.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './MainMenu.css';

function MainMenu({ isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const menuRef = useRef(null);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const submenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    // 외부 클릭 이벤트 핸들러
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        setShowSubmenu(false);
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      // 이벤트 리스너 제거
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 시 모든 메뉴 상태 초기화
      setIsMenuOpen(false);
      setShowSubmenu(false);
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleReservationClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      // 현재 경로를 저장
      localStorage.setItem('redirectAfterLogin', '/reservation');
      console.log('Saved redirect path to localStorage:', '/reservation');
      navigate('/login');
    } else {
      navigate('/reservation');
    }
    setIsMenuOpen(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setShowSubmenu(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSubmenu = () => {
    setShowSubmenu(!showSubmenu);
  };

  // 관리자 메뉴 클릭 시 서브메뉴 닫기
  const handleAdminMenuClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setShowSubmenu(false);
  };

  // 현재 로그인한 사용자의 이름 가져오기
  const userName = auth.currentUser?.displayName || auth.currentUser?.email || '사용자';

  //console.log('MainMenu isAdmin:', isAdmin);
  //console.log('MainMenu isAdmin type:', typeof isAdmin);

  return (
    <nav className="navbar">
      <div className="container" ref={menuRef}>
        <Link to="/main" className="navbar-brand" onClick={() => setIsMenuOpen(false)}>
          드럼 놀이터
        </Link>
        
        <button className="navbar-toggler" onClick={toggleMenu}>
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link 
                to="/introduction" 
                className={`nav-link ${location.pathname === '/introduction' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/introduction')}
              >
                프로그램
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/reservation" 
                className={`nav-link ${location.pathname === '/reservation' ? 'active' : ''}`}
                onClick={handleReservationClick}
              >
                놀이터 예약
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/playground-photos" 
                className={`nav-link ${location.pathname === '/playground-photos' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/playground-photos')}
              >
                놀이터 사진
              </Link>
            </li>          
            <li className="nav-item">
              <Link 
                to="/video-upload" 
                className={`nav-link ${location.pathname === '/video-upload' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/video-upload')}
              >
                놀이터 영상
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/board" 
                className={`nav-link ${location.pathname === '/board' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/board')}
              >
                게시판
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/qna" 
                className={`nav-link ${location.pathname === '/qna' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/qna')}
              >
                문의/답변
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/location" 
                className={`nav-link ${location.pathname === '/location' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/location')}
              >
                오시는 길
              </Link>
            </li>
            {isAdmin && (
              <li className="admin-menu">
                <span>관리자 메뉴</span>
                <ul className="admin-dropdown">
                  <li><Link to="/member-info" onClick={() => handleAdminMenuClick('/member-info')}>회원관리</Link></li>
                  <li><Link to="/payment-settings" onClick={() => handleAdminMenuClick('/payment-settings')}>결제비용 설정</Link></li>
                  <li><Link to="/admin/payment-history" onClick={() => handleAdminMenuClick('/admin/payment-history')}>결제내역 보기</Link></li>
                  <li><Link to="/admin/reservation-stats" onClick={() => handleAdminMenuClick('/admin/ReservationStats')}>예약 통계</Link></li>
                  <li><Link to="/admin/send-kakao" onClick={() => handleAdminMenuClick('/admin/send-kakao')}>카톡 보내기</Link></li>
                </ul>
              </li>
            )}
          </ul>
          
          <div className="nav-user">
            {isLoggedIn ? (
              <>
                <div className="user-info" ref={submenuRef}>
                  <span className="user-name" onClick={toggleSubmenu}>
                    {userName}
                    <span className="dropdown-arrow">▼</span>
                  </span>
                  {showSubmenu && (
                    <div className="submenu">
                      <Link to="/profile" className="submenu-item" onClick={() => handleMenuClick('/profile')}>개인정보 수정</Link>
                      <Link to="/my-reservations" className="submenu-item" onClick={() => handleMenuClick('/my-reservations')}>예약현황</Link>
                      {/*
                      <Link to="/payment" className="submenu-item" onClick={() => handleMenuClick('/payment')}>결제하기</Link>
                      */} 

                      <button onClick={handleLogout} className="logout-button">
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={handleLogin} className="btn-login">
                로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MainMenu;