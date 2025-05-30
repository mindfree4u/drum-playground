import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminMenu.css';

function AdminMenu() {
  const navigate = useNavigate();

  return (
    <div className="admin-menu-container">
      <h2>관리자 메뉴</h2>
      <div className="menu-grid">
        <div className="menu-item" onClick={() => navigate('/admin/reservations')}>
          <h3>예약 관리</h3>
          <p>예약 내역 확인 및 관리</p>
        </div>
        <div className="menu-item" onClick={() => navigate('/admin/users')}>
          <h3>회원 관리</h3>
          <p>회원 정보 확인 및 관리</p>
        </div>
        <div className="menu-item" onClick={() => navigate('/admin/settings')}>
          <h3>시설 관리</h3>
          <p>시설 정보 및 설정 관리</p>
        </div>
        <div className="menu-item" onClick={() => navigate('/admin/payment-history')}>
          <h3>결제 내역</h3>
          <p>월별 결제 이력 확인</p>
        </div>
      </div>
    </div>
  );
}

export default AdminMenu; 