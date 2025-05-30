import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query, limit, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { convertFromRaw, EditorState } from 'draft-js';
import ddfLogo from '../assets/ddf-logo.png';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './MainPage.css';

function MainPage() {
  const [boardPosts, setBoardPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoLimit, setVideoLimit] = useState(window.innerWidth > 768 ? 6 : 4);
  const [adminPhone, setAdminPhone] = useState('');
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    fetchPosts();
    fetchVideos();
    fetchAdminPhone();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [videoLimit]);

  // Admin 전화번호 가져오기
  const fetchAdminPhone = async () => {
    try {
      // 먼저 사용자 컬렉션에서 userId가 'admin'인 사용자 찾기
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // admin 유저를 찾았을 때
        const adminData = querySnapshot.docs[0].data();

        if (adminData.phone) {
          setAdminPhone(adminData.phone);
        } else {
          console.log('Admin phone not found');
        }
      } else {
        console.log('Admin user not found');
      }
    } catch (error) {
      console.error('Error fetching admin phone:', error);
    }
  };

  // Draft.js content를 일반 텍스트로 변환하는 함수
  const getPlainText = (content) => {
    try {
      if (typeof content === 'string') {
        const contentJSON = JSON.parse(content);
        const contentState = convertFromRaw(contentJSON);
        return contentState.getPlainText();
      } else if (content && content.blocks) {
        const contentState = convertFromRaw(content);
        return contentState.getPlainText();
      }
      return '';
    } catch (e) {
      console.error('Error parsing content:', e);
      return typeof content === 'string' ? content : '';
    }
  };

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(3));
      const querySnapshot = await getDocs(q);
      
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = '';
        
        if (data.createdAt) {
          try {
            if (typeof data.createdAt.toDate === 'function') {
              formattedDate = data.createdAt.toDate().toLocaleDateString('ko-KR');
            } 
            else if (data.createdAt instanceof Date) {
              formattedDate = data.createdAt.toLocaleDateString('ko-KR');
            }
            else if (typeof data.createdAt === 'string') {
              formattedDate = new Date(data.createdAt).toLocaleDateString('ko-KR');
            }
          } catch (error) {
            console.error('Date formatting error:', error);
            formattedDate = '';
          }
        }

        // content를 일반 텍스트로 변환
        const plainContent = getPlainText(data.content);
        // 내용을 100자로 제한
        const truncatedContent = plainContent.length > 100 
          ? plainContent.substring(0, 100) + '...' 
          : plainContent;

        return {
          id: doc.id,
          title: data.title || '',
          content: truncatedContent,
          author: data.userName || '익명',
          date: formattedDate
        };
      });
      
      setBoardPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const videosRef = collection(db, 'videos');
      const q = query(videosRef, orderBy('createdAt', 'desc'), limit(videoLimit));
      const querySnapshot = await getDocs(q);
      
      const videoList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = '';
        
        if (data.createdAt) {
          try {
            if (typeof data.createdAt.toDate === 'function') {
              formattedDate = data.createdAt.toDate().toLocaleDateString('ko-KR');
            } 
            else if (data.createdAt instanceof Date) {
              formattedDate = data.createdAt.toLocaleDateString('ko-KR');
            }
            else if (typeof data.createdAt === 'string') {
              formattedDate = new Date(data.createdAt).toLocaleDateString('ko-KR');
            }
          } catch (error) {
            console.error('Date formatting error:', error);
            formattedDate = '';
          }
        }

        return {
          id: doc.id,
          title: data.title || '',
          videoId: data.videoId || '',
          author: data.userName || '익명',
          date: formattedDate
        };
      });
      
      setVideos(videoList);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/board/post/${postId}`);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video-upload`);
  };

  return (
    <div className="main-page">
      <h1 className="welcome-title">DDF 드럼 놀이터</h1>
      <div className="intro-section">
        <div className="logo-container">
          <img src={ddfLogo} alt="DDF Logo" className="ddf-logo" />
          <div className="logo-text">
            <p>{/* 드럼 놀이터 */}</p>
            <p>모든 연령 드럼 레슨, 체험</p>
            <p>피아노/작곡, 연습실대여</p>
            {isMobile && (
              <div className="contact-icons">
                <a href={adminPhone ? `tel:${adminPhone}` : '#'} className="contact-icon">
                  <i className="fas fa-phone"></i> <br /> 전화
                </a>
                <Link to="/reservation" className="contact-icon">
                  <i className="far fa-calendar-alt"></i> <br /> 예약
                </Link>
                <Link to="/qna" className="contact-icon">
                  <i className="far fa-question-circle"></i> <br /> 문의
                </Link>
              </div>
            )}
          </div>
        </div>
       
        <div className="intro-text">
        <div class="drum-playground-intro">
            <h2>🥁 드럼의 즐거움, "드럼놀이터"에서 함께 만들어요! 🥁</h2>
            <p><strong>춤추는 비트, 가슴 뛰는 리듬!</strong> "드럼놀이터"는 여러분의 음악적 열정을 마음껏 펼칠 수 있는 레슨 및 연습 공간으로{' '} 
            <strong>초보자부터 숙련자까지</strong>, <strong>어린이부터 성인까지</strong>, <strong>개개인의 수준과 목표에 맞춘 집중 코칭</strong>을 제공합니다.</p>
</div>        </div>
      </div>

      <div className="board-section">
        <div className="board-title">
          게시판
          <Link to="/board">더보기 &gt;</Link>
        </div>
        <div className="board-grid">
          {boardPosts.map(post => (
            <div key={post.id} className="board-item" onClick={() => handlePostClick(post.id)}>
              <div className="board-item-content">
                <div className="board-item-title">{post.title}</div>
                <div className="board-item-text">{post.content}</div>
                <div className="board-item-info">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="video-section">
        <div className="video-title">
          놀이터 영상
          <Link to="/video-upload">더보기 &gt;</Link>
        </div>
        <div className="video-grid">
          {videos.map(video => (
            <div key={video.id} className="video-item" onClick={() => handleVideoClick(video.id)}>
              <div className="video-thumbnail">
                <img 
                  src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                  alt={video.title}
                />
              </div>
              <div className="video-item-content">
                <div className="video-item-title">{video.title}</div>
                <div className="video-item-info">
                  <span>{video.author}</span>
                  <span>{video.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MainPage;