import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './SendKakao.css';

const SendKakao = () => {
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
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
      }));
      setMembers(list);
    };
    fetchMembers();
  }, []);

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(members.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || selectedIds.length === 0) {
      alert('메시지와 수신자를 모두 선택하세요.');
      return;
    }
    setSending(true);
    // 실제 카카오톡 API 연동은 별도 구현 필요
    setTimeout(() => {
      alert(`(시뮬레이션) ${selectedIds.length}명에게 카톡 발송 완료!`);
      setSending(false);
      setMessage('');
      setSelectedIds([]);
    }, 1000);
  };

  return (
    <div className="send-kakao-container">
      <h2>카톡 보내기(시험중, 메세지 전송 안됨)</h2>
      <div className="member-list-section">
        <label>
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={selectedIds.length === members.length && members.length > 0}
          /> 전체선택
        </label>
        <ul className="member-list">
          {members.map(member => (
            <li key={member.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(member.id)}
                  onChange={() => handleSelect(member.id)}
                />
                {member.name || member.email || member.phone || member.id}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="message-section">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="보낼 메시지를 입력하세요"
          rows={5}
        />
      </div>
      <button className="send-btn" onClick={handleSend} disabled={sending}>
        {sending ? '전송 중...' : '카톡 보내기'}
      </button>
    </div>
  );
};

export default SendKakao;