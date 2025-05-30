import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import './PaymentHistory.css';

function PaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toISOString().slice(0, 7); // YYYY-MM 형식
  });
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const querySnapshot = await getDocs(userQuery);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          const isUserAdmin = userData.isAdmin === true || userData.role === 'admin' || userData.userId === 'admin';
          
          if (!isUserAdmin) {
            navigate('/');
            return;
          }
        } else {
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
        return;
      }
    };

    checkAdmin();
    fetchPayments();
  }, [navigate, selectedMonth]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      console.log('Fetching payments for month:', selectedMonth);
      
      // 모든 결제 데이터를 먼저 가져와서 확인
      const q = query(
        collection(db, 'payments'),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const paymentList = [];
      let total = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Payment data:', data); // 각 결제 데이터 로깅
        
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp;
        const paymentDate = new Date(timestamp);
        const selectedDate = new Date(selectedMonth);
        
        // 선택한 월과 같은지 확인
        if (paymentDate.getFullYear() === selectedDate.getFullYear() && 
            paymentDate.getMonth() === selectedDate.getMonth()) {
          paymentList.push({
            id: doc.id,
            ...data,
            timestamp: timestamp
          });
          total += data.amount || 0;
        }
      });

      console.log('Filtered payments:', paymentList);
      setPayments(paymentList);
      setTotalAmount(total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '날짜 정보 없음';
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">결제 내역을 불러오는 중...</div>;
  }

  return (
    <div className="payment-history-container">
      <h2>결제 내역</h2>
      
      <div className="month-selector">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="month-input"
        />
        <div className="total-amount">
          총 결제 금액: {totalAmount.toLocaleString()}원
        </div>
      </div>

      <div className="payment-list">
        {payments.length === 0 ? (
          <div className="no-payments">해당 월의 결제 내역이 없습니다.</div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>결제일시</th>
                <th>결제자</th>
                <th>결제구분</th>
                <th>금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.timestamp)}</td>
                  <td>{payment.userName || '이름 없음'}</td>
                  <td>{payment.paymentType || '금액 입력'}</td>
                  <td>{(payment.amount || 0).toLocaleString()}원</td>
                  <td>{payment.status || '완료'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PaymentHistory; 