import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './MemberInfo.css';

// 회원 등급 정의
const MEMBER_ROLES = {
  ADMIN: 'admin',
  REGULAR: 'regular',
  GUEST: 'guest'
};

const ROLE_LABELS = {
  [MEMBER_ROLES.ADMIN]: '관리자',
  [MEMBER_ROLES.REGULAR]: '정회원',
  [MEMBER_ROLES.GUEST]: '비회원'
};

const MemberInfo = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc')); 
      const querySnapshot = await getDocs(q); 
/*      const querySnapshot = await getDocs(collection(db, 'users')); */
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: doc.data().isAdmin ? MEMBER_ROLES.ADMIN : 
              doc.data().role || MEMBER_ROLES.GUEST
      }));
      console.log('MemberInfo()==============: membersList', membersList);
      setMembers(membersList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('회원 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (updating) return;
    
    try {
      setUpdating(true);
      const userRef = doc(db, 'users', memberId);
      
      // 새로운 역할에 따라 isAdmin 값도 함께 업데이트
      await updateDoc(userRef, {
        role: newRole,
        isAdmin: newRole === MEMBER_ROLES.ADMIN
      });
      
      // 업데이트 후 회원 목록 새로고침
      await fetchMembers();
      
    } catch (err) {
      console.error('Error updating member role:', err);
      alert('회원 등급 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="member-info-container">
      <h1>회원 정보</h1>
      <div className="member-count">총 {members.length}명</div>
      <table className="member-table">
        <thead>
          <tr>
            <th>아이디</th>
            <th>이메일</th>
            <th>이름</th>
            <th>가입일</th>
            {/* <th>회원 등급</th> */}
            <th>등급 수정</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.userId}</td>
              <td>{member.email}</td>
              <td>{member.name || '-'}</td>
              <td>{member.createdAt ? new Date(member.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
              {/* <td className={`role-display ${member.role}`}>{ROLE_LABELS[member.role] || '비회원'}</td> */}
              <td>
                <select
                  className={`role-select ${member.role}`}
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={updating}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberInfo;