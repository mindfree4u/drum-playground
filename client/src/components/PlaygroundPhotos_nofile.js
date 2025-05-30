import React, { useState, useEffect } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './PlaygroundPhotos.css';

const PlaygroundPhotos = ({ isAdmin }) => {
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth();
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const q = query(collection(db, 'playgroundPhotos'), orderBy('timestamp', 'desc'));
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

    setLoading(true);
    setError('');

    try {
      // 파일 크기 체크 (5MB 제한)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB를 초과할 수 없습니다.');
        setLoading(false);
        return;
      }

      // 파일 타입 체크
      if (!selectedFile.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        setLoading(false);
        return;
      }

      // 파일 이름에서 특수문자 제거 및 타임스탬프 추가
      const timestamp = Date.now();
      const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '');
      const storageRef = ref(storage, `playground-photos/${timestamp}_${cleanFileName}`);

      // 메타데이터 설정
      const metadata = {
        contentType: selectedFile.type,
        customMetadata: {
          'uploadedBy': auth.currentUser.uid,
          'title': title
        }
      };

      // 파일 업로드
      await uploadBytes(storageRef, selectedFile, metadata);
      const downloadURL = await getDownloadURL(storageRef);

      // Firestore에 데이터 저장
      await addDoc(collection(db, 'playgroundPhotos'), {
        title,
        description,
        imageUrl: downloadURL,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        fileName: cleanFileName
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
      await deleteDoc(doc(db, 'playgroundPhotos', photoId));
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  return (
    <div className="playground-photos-container">
      <h2>놀이터 사진 갤러리</h2>
      
      {isAdmin && (
        <div className="upload-section">
          <h3>새 사진 업로드</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <input
                type="text"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="설명 (선택사항)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              <p className="photo-meta">
                업로드: {new Date(photo.timestamp).toLocaleDateString()}
              </p>
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

export default PlaygroundPhotos; 