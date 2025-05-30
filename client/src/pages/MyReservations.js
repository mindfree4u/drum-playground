import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './MyReservations.css';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        // 사용자 문서에서 관리자 상태 확인
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin === true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        // 현재 월의 첫날과 마지막 날 계산
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // 관리자인 경우 모든 예약을 가져오고, 일반 사용자인 경우 자신의 예약만 가져옴
        let q;
        if (isAdmin) {
          q = query(collection(db, 'reservations'));
        } else {
          q = query(
            collection(db, 'reservations'),
            where('userId', '==', user.uid)
          );
        }

        const querySnapshot = await getDocs(q);
        const reservationsList = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(reservation => {
            // 클라이언트 측에서 날짜 필터링
            const reservationDate = reservation.date.toDate ? reservation.date.toDate() : new Date(reservation.date);
            return reservationDate >= firstDay && reservationDate <= lastDay;
          })
          .sort((a, b) => {
            // 날짜순으로 정렬
            const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
            return dateA - dateB;
          });

        // 데이터 구조 확인을 위한 콘솔 로그
        console.log('Reservations data:', reservationsList);
        if (reservationsList.length > 0) {
          console.log('First reservation:', reservationsList[0]);
        }

        setReservations(reservationsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('예약 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentMonth, navigate, isAdmin]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (timeSlot) => {
    if (!timeSlot) return '';
    
    // timeSlot이 문자열인 경우 (예: "14:30")
    if (typeof timeSlot === 'string') {
      return timeSlot;
    }
    
    // timeSlot이 객체인 경우 (예: {hours: 14, minutes: 30})
    if (timeSlot.hours !== undefined && timeSlot.minutes !== undefined) {
      return `${String(timeSlot.hours).padStart(2, '0')}:${String(timeSlot.minutes).padStart(2, '0')}`;
    }
    
    // timeSlot이 다른 형식인 경우
    console.log('Unexpected timeSlot format:', timeSlot);
    return '';
  };

  const getDayClass = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    
    if (day.getTime() === today.getTime()) {
      return 'today';
    }
    
    return '';
  };

  const getReservationForDay = (date) => {
    return reservations.find(reservation => {
      const reservationDate = reservation.date.toDate ? reservation.date.toDate() : new Date(reservation.date);
      return (
        reservationDate.getDate() === date.getDate() &&
        reservationDate.getMonth() === date.getMonth() &&
        reservationDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getReservationClass = (type) => {
    if (!type) return '';
    return type === '레슨' ? 'lesson-reservation' : 'practice-reservation';
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 날짜들
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift(prevDate);
    }
    
    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // 다음 달의 날짜들
    const remainingDays = 42 - days.length; // 6주 달력을 위해 42일로 맞춤
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    
    return (
      <div className="calendar">
        <div className="calendar-header">
          <button onClick={handlePrevMonth} className="month-nav-button">&lt;</button>
          <h2>{year}년 {month + 1}월</h2>
          <button onClick={handleNextMonth} className="month-nav-button">&gt;</button>
        </div>
        <div className="weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="days">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const reservation = getReservationForDay(date);
            const dayClass = getDayClass(date);
            const reservationClass = reservation ? getReservationClass(reservation.type) : '';
            
            // 예약 시간 정보 확인
            const timeDisplay = reservation ? formatTime(reservation.timeSlot) : '';
            // 룸 정보 확인
            const roomDisplay = reservation && reservation.room ? `[${reservation.room}]` : '';
            
            return (
              <div 
                key={index} 
                className={`day ${isCurrentMonth ? 'current-month' : 'other-month'} ${dayClass} ${reservation ? 'has-reservation' : ''} ${reservationClass}`}
              >
                <span className="day-number">{date.getDate()}</span>
                {reservation && (
                  <div className="reservation-info">
                    <div className="reservation-type">
                      {reservation.type}{timeDisplay ? `(${timeDisplay})` : ''} {roomDisplay}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-reservations-container">
      <h1>예약현황</h1>
      {renderCalendar()}
      
      <div className="reservations-list">
        <h2>예약 목록</h2>
        {reservations.length === 0 ? (
          <p className="no-reservations">이번 달 예약이 없습니다.</p>
        ) : (
          <table className="reservations-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>시간</th>
                <th>장소</th>
                <th>유형</th>
                {/* <th>상태</th> */}
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{formatDate(reservation.date)}</td>
                  <td>{formatTime(reservation.timeSlot)}</td>
                  <td>{reservation.room || '기본룸'}</td>
                  <td>{reservation.type}</td>
                  {/* <td>{reservation.status || '확정'}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyReservations; 