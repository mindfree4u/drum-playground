import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './PushNotification.css';

const PushNotification = () => {
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        phone: doc.data().phone,
        fcmToken: doc.data().fcmToken,
      }));
      setMembers(list);
    };
    fetchMembers();
  }, []);

  // 모든 회원에게 푸시 알림 전송
  const handleSend = async () => {
    if (!message.trim()) {
      alert('보낼 메시지를 입력하세요.');
      return;
    }
    setSending(true);
    const tokens = members.filter(m => m.fcmToken).map(m => m.fcmToken);
    if (tokens.length === 0) {
      alert('푸시 알림을 받을 회원이 없습니다.');
      setSending(false);
      return;
    }
    try {
      await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, message }),
      });
      alert('푸시 알림 전송 완료!');
      setMessage('');
    } catch (e) {
      alert('푸시 알림 전송 실패');
    }
    setSending(false);
  };

  return (
    <div className="push-notification-container">
      <h2>Push 알림 보내기</h2>
      <div className="message-section">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="보낼 메시지를 입력하세요"
          rows={5}
        />
      </div>
      <button className="send-btn" onClick={handleSend} disabled={sending}>
        {sending ? '전송 중...' : '푸시 알림 보내기'}
      </button>
      <div className="member-list-section">
        <div style={{ margin: '16px 0 8px 0', fontWeight: 500 }}>회원 목록 (푸시 가능 여부)</div>
        <ul className="member-list">
          {members.map(member => (
            <li key={member.id} className={member.fcmToken ? '' : 'no-fcm'}>
              {member.name || member.email || member.phone || member.id}
              {member.fcmToken ? (
                <span style={{ color: '#03c75a', marginLeft: 8 }}>[푸시 가능]</span>
              ) : (
                <span style={{ color: '#aaa', marginLeft: 8 }}>[토큰 없음]</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PushNotification; 