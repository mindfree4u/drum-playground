import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Introduction.css';

function IntroduceUpload({ isAdmin }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [Introduces, setIntroduces] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIntroduces();
  }, []);

  const fetchIntroduces = async () => {
    try {
      const IntroducesRef = collection(db, 'Introduces');
      const q = query(IntroducesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const IntroduceList = [];
      querySnapshot.forEach((doc) => {
        IntroduceList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setIntroduces(IntroduceList);
    } catch (error) {
      console.error('Error fetching Introduces:', error);
      setError('영상을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const extractIntroduceId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 관리자 권한 확인
    if (!isAdmin) {
      setError('관리자만 영상을 업로드할 수 있습니다.');
      return;
    }

    if (!youtubeUrl) {
      setError('유튜브 URL을 입력해주세요.');
      return;
    }

    const IntroduceId = extractIntroduceId(youtubeUrl);
    if (!IntroduceId) {
      setError('올바른 유튜브 URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : { userId: '관리자' };
      
      const IntroduceData = {
        userId: auth.currentUser.uid,
        userName: userData.userName || userData.userId || '관리자',
        youtubeUrl,
        IntroduceId,
        title: title || '제목 없음',
        description: description || '',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'Introduces'), IntroduceData);
      
      setYoutubeUrl('');
      setTitle('');
      setDescription('');
      
      fetchIntroduces();
    } catch (error) {
      console.error('Error uploading Introduce:', error);
      setError('영상 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (IntroduceId) => {
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 관리자 권한 확인
    if (!isAdmin) {
      setError('관리자만 영상을 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm('이 영상을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'Introduces', IntroduceId));
      fetchIntroduces();
    } catch (error) {
      console.error('Error deleting Introduce:', error);
      setError('영상 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="Introduce-upload-container">
      <h2>놀이터 프로그램</h2>
      {isAdmin && (
        <form onSubmit={handleSubmit} className="Introduce-upload-form">
          <div className="form-group">
            <label htmlFor="youtubeUrl">유튜브 URL</label>
            <input
              type="text"
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="유튜브 영상 URL을 입력하세요"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="title">제목 (선택사항)</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="영상 제목을 입력하세요"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">설명 (선택사항)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="영상에 대한 설명을 입력하세요"
              className="form-control"
              rows="3"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
        </form>
      )}
      
      <div className="Introduces-list">
        <h3>프로그램 소개</h3>
        {Introduces.length === 0 ? (
          <p className="no-Introduces">프로그램이 등록되지 않았습니다.</p>
        ) : (
          <div className="Introduce-grid">
            {Introduces.map((Introduce) => (
              <div key={Introduce.id} className="Introduce-card">
                <div className="Introduce-embed">
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${Introduce.IntroduceId}`}
                    title={Introduce.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="Introduce-info">
                  <h4>{Introduce.title}</h4>
                  <p className="Introduce-description">{Introduce.description}</p>
                  <p className="Introduce-meta">
                    업로드: {Introduce.userName} | 
                    {Introduce.createdAt && new Date(Introduce.createdAt.toDate()).toLocaleDateString()}
                  </p>
                  {isAdmin && (
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(Introduce.id)}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IntroduceUpload; 