import React, { useState, useEffect } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './Introduction.css';

const Introduction = ({ isAdmin }) => {
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const auth = getAuth();
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    console.log('Introduction - isAdmin:', isAdmin);
    console.log('Introduction - Current user:', auth.currentUser);
    fetchPhotos();
    checkUserRole();
  }, [isAdmin]);

  const checkUserRole = async () => {
    if (!auth.currentUser) return;

    try {
      // users 컬렉션에서 현재 사용자의 문서 찾기
      const q = query(collection(db, 'users'), where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('User data from Firestore:', userData);
        console.log('User role:', userData.role);
        console.log('Is admin:', userData.isAdmin);
        setUserRole(userData);
      } else {
        console.log('No user document found');
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
    }
  };

  const fetchPhotos = async () => {
    try {
      const q = query(collection(db, 'introductionPhotos'), orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      const photoList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(photoList);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      setError('파일과 제목을 모두 입력해주세요.');
      return;
    }

    // 사용자 권한 재확인
    await checkUserRole();
    console.log('Current user role data:', userRole);

    if (!userRole || (!userRole.isAdmin && userRole.role !== 'admin')) {
      setError('관리자 권한이 없습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB를 초과할 수 없습니다.');
        setLoading(false);
        return;
      }

      if (!selectedFile.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '');
      
      // Storage 참조 생성
      const storageRef = ref(storage, `introduction-photos/${timestamp}_${cleanFileName}`);
      console.log('Storage path:', `introduction-photos/${timestamp}_${cleanFileName}`);

      // 파일 업로드
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Firestore에 데이터 저장
      await addDoc(collection(db, 'introductionPhotos'), {
        title,
        description,
        imageUrl: downloadURL,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        fileName: `${timestamp}_${cleanFileName}`
      });

      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchPhotos();
      setError('');
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId, imageUrl) => {
    if (!window.confirm('정말로 이 사진을 삭제하시겠습니까?')) return;

    try {
      // Delete from Storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'introductionPhotos', photoId));
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  return (
    <div className="introduction-container">
      <h2>프로그램 소개</h2>
      
      {isAdmin && (
        <div className="upload-section">
          <h3>새 프로그램 추가</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <input
                type="text"
                placeholder="프로그램 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="프로그램 설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                ref={fileInputRef}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? '업로드 중...' : '업로드'}
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
      )}

      <div className="photos-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="photo-card">
            <img src={photo.imageUrl} alt={photo.title} />
            <div className="photo-info">
              <h3>{photo.title}</h3>
              {photo.description && <p>{photo.description}</p>}
{/*              <p className="photo-meta">
                등록일: {new Date(photo.timestamp).toLocaleDateString()}
              </p>
              */}
              {isAdmin && (
                <button
                  className="delete-button"
                  onClick={() => handleDelete(photo.id, photo.imageUrl)}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Introduction; 