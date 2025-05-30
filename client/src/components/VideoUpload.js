import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './VideoUpload.css';

function VideoUpload({ isAdmin }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const videosRef = collection(db, 'videos');
      const q = query(videosRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const videoList = [];
      querySnapshot.forEach((doc) => {
        videoList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setVideos(videoList);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('영상을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const extractVideoId = (url) => {
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

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError('올바른 유튜브 URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : { userId: '관리자' };
      
      const videoData = {
        userId: auth.currentUser.uid,
        userName: userData.userName || userData.userId || '관리자',
        youtubeUrl,
        videoId,
        title: title || '제목 없음',
        description: description || '',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'videos'), videoData);
      
      setYoutubeUrl('');
      setTitle('');
      setDescription('');
      
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('영상 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
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
      await deleteDoc(doc(db, 'videos', videoId));
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('영상 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="video-upload-container">
      <h2>놀이터 영상</h2>
      {isAdmin && (
        <form onSubmit={handleSubmit} className="video-upload-form">
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
      
      <div className="videos-list">
        <h3>업로드된 영상</h3>
        {videos.length === 0 ? (
          <p className="no-videos">업로드된 영상이 없습니다.</p>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <div key={video.id} className="video-card">
                <div className="video-embed">
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="video-info">
                  <h4>{video.title}</h4>
                  <p className="video-description">{video.description}</p>
                  <p className="video-meta">
                    업로드: {video.userName} | 
                    {video.createdAt && new Date(video.createdAt.toDate()).toLocaleDateString()}
                  </p>
                  {isAdmin && (
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(video.id)}
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

export default VideoUpload; 