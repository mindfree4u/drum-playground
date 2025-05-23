import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './SendKakao.css';

const KAKAO_APP_KEY = "26d8640fa64f99a40fc037fb0e5bb873";

const SendKakao = () => {
  const [members, setMembers] = useState([]); // firebase users
  const [selectedMemberIds, setSelectedMemberIds] = useState([]); // 선택된 회원 id
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [kakaoFriends, setKakaoFriends] = useState([]);
  const [matchResult, setMatchResult] = useState({}); // {회원id: 카카오친구uuid}

  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_APP_KEY);
    }
    setIsKakaoReady(true);
  }, []);

  // 카카오 로그인
  const handleKakaoLogin = () => {
    if (!window.Kakao) return alert('Kakao SDK 로드 실패');
    window.Kakao.Auth.login({
      scope: 'friends,talk_message',
      success: function(authObj) {
        setIsLoggedIn(true);
        fetchKakaoFriends();
      },
      fail: function(err) {
        alert('카카오 로그인 실패: ' + JSON.stringify(err));
      }
    });
  };

  // 카카오 친구 목록 불러오기
  const fetchKakaoFriends = () => {
    window.Kakao.API.request({
      url: '/v1/api/talk/friends',
      success: function(res) {
        setKakaoFriends(res.elements);
      },
      fail: function(error) {
        alert('카카오 친구 목록 불러오기 실패: ' + JSON.stringify(error));
      }
    });
  };

  // 파이어베이스 회원 불러오기
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

  // 회원 선택
  const handleSelectMember = (id) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllMembers = (e) => {
    if (e.target.checked) {
      setSelectedMemberIds(members.map(m => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  // 회원-카카오친구 매칭 (닉네임 기준)
  useEffect(() => {
    if (!kakaoFriends.length || !members.length) {
      setMatchResult({});
      return;
    }
    const result = {};
    members.forEach(member => {
      const friend = kakaoFriends.find(f => f.profile_nickname === member.name);
      if (friend) {
        result[member.id] = friend.uuid;
      }
    });
    setMatchResult(result);
  }, [kakaoFriends, members]);

  // 메시지 전송
  const handleSend = async () => {
    if (!message.trim() || selectedMemberIds.length === 0) {
      alert('메시지와 수신자를 모두 선택하세요.');
      return;
    }
    // 선택된 회원 중 카카오 친구와 매칭된 uuid만 추출
    const matchedUuids = selectedMemberIds.map(id => matchResult[id]).filter(Boolean);
    const unmatchedMembers = selectedMemberIds.filter(id => !matchResult[id]);
    if (matchedUuids.length === 0) {
      alert('선택한 회원 중 카카오 친구와 닉네임이 일치하는 사람이 없습니다.\n(회원 이름과 카카오 친구 닉네임이 같아야 전송됩니다)');
      return;
    }
    if (unmatchedMembers.length > 0) {
      const names = members.filter(m => unmatchedMembers.includes(m.id)).map(m => m.name).join(', ');
      alert(`다음 회원은 카카오 친구와 닉네임이 일치하지 않아 메시지를 보낼 수 없습니다: ${names}`);
    }
    setSending(true);
    window.Kakao.API.request({
      url: '/v1/api/talk/friends/message/send',
      data: {
        receiver_uuids: JSON.stringify(matchedUuids),
        template_object: {
          object_type: 'text',
          text: message,
          link: {
            web_url: window.location.origin,
            mobile_web_url: window.location.origin,
          },
        },
      },
      success: function(res) {
        alert(`카톡 발송 완료!`);
        setSending(false);
        setMessage('');
        setSelectedMemberIds([]);
      },
      fail: function(error) {
        alert('카톡 발송 실패: ' + JSON.stringify(error));
        setSending(false);
      }
    });
  };

  return (
    <div className="send-kakao-container">
      <h2>카카오톡 메시지 보내기</h2>
      {!isLoggedIn ? (
        <button className="send-btn" onClick={handleKakaoLogin} disabled={!isKakaoReady}>
          카카오 로그인
        </button>
      ) : (
        <>
          <div className="member-list-section">
            <label>
              <input
                type="checkbox"
                onChange={handleSelectAllMembers}
                checked={selectedMemberIds.length === members.length && members.length > 0}
              /> 전체선택
            </label>
            <ul className="member-list">
              {members.map(member => (
                <li key={member.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => handleSelectMember(member.id)}
                    />
                    {member.name || member.email || member.phone || member.id}
                    {matchResult[member.id] ? (
                      <span style={{ color: '#03c75a', marginLeft: 8 }}>[카카오 친구 있음]</span>
                    ) : (
                      <span style={{ color: '#aaa', marginLeft: 8 }}>[카카오 친구 없음]</span>
                    )}
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
        </>
      )}
    </div>
  );
};

export default SendKakao;