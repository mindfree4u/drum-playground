import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import './QnABoard.css';

function QnABoard({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [editingReply, setEditingReply] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'write', 'detail'

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      const q = query(collection(db, 'qna'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postList = [];
      
      console.log('Found', querySnapshot.size, 'posts');
      
      for (const doc of querySnapshot.docs) {
        const post = {
          id: doc.id,
          ...doc.data()
        };
        
        // 답변 가져오기
        const repliesQuery = query(
          collection(db, 'qnaReplies'),
          where('postId', '==', doc.id)
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        post.replies = repliesSnapshot.docs.map(replyDoc => ({
          id: replyDoc.id,
          ...replyDoc.data()
        }));
        
        // JavaScript에서 정렬 수행
        post.replies.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
        
        postList.push(post);
      }
      
      console.log('Successfully processed all posts');
      setPosts(postList);
      setError(''); // Clear any existing errors
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(`게시물을 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedFile(null);
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!title || !content) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let fileUrl = null;
      if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          setError('파일 크기는 5MB를 초과할 수 없습니다.');
          setLoading(false);
          return;
        }

        const timestamp = Date.now();
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '');
        const storageRef = ref(storage, `qna-attachments/${timestamp}_${cleanFileName}`);
        await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(storageRef);
      }

      const postData = {
        title,
        content,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        createdAt: new Date(),
        fileUrl,
        fileName: selectedFile ? selectedFile.name : null
      };

      const docRef = await addDoc(collection(db, 'qna'), postData);
      resetForm();
      await fetchPosts();
      setView('list');
    } catch (error) {
      console.error('Error creating post:', error);
      setError(`게시물 작성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (postId) => {
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!replyContent.trim()) {
      setError('답변 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const replyData = {
        postId,
        content: replyContent,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || '익명',
        createdAt: new Date(),
        isAdmin: isAdmin
      };

      await addDoc(collection(db, 'qnaReplies'), replyData);
      setReplyContent('');
      
      // 즉시 게시물 새로고침
      const updatedPosts = await fetchPostWithReplies(postId);
      if (updatedPosts) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? updatedPosts : post
          )
        );
        setSelectedPost(updatedPosts);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      setError('답변 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostWithReplies = async (postId) => {
    try {
      const postDoc = doc(db, 'qna', postId);
      const postSnapshot = await getDocs(query(collection(db, 'qna'), where('__name__', '==', postId)));
      
      if (!postSnapshot.empty) {
        const post = {
          id: postSnapshot.docs[0].id,
          ...postSnapshot.docs[0].data()
        };

        const repliesQuery = query(
          collection(db, 'qnaReplies'),
          where('postId', '==', postId)
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        post.replies = repliesSnapshot.docs.map(replyDoc => ({
          id: replyDoc.id,
          ...replyDoc.data()
        }));
        
        // JavaScript에서 정렬 수행
        post.replies.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
        
        return post;
      }
      return null;
    } catch (error) {
      console.error('Error fetching post with replies:', error);
      return null;
    }
  };

  const handleReplyEdit = async (replyId, newContent) => {
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!newContent.trim()) {
      setError('답변 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const replyRef = doc(db, 'qnaReplies', replyId);
      await updateDoc(replyRef, {
        content: newContent,
        updatedAt: new Date()
      });

      // 즉시 게시물 새로고침
      if (selectedPost) {
        const updatedPost = await fetchPostWithReplies(selectedPost.id);
        if (updatedPost) {
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === selectedPost.id ? updatedPost : post
            )
          );
          setSelectedPost(updatedPost);
        }
      }
      setEditingReply(null);
    } catch (error) {
      console.error('Error updating reply:', error);
      setError('답변 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyDelete = async (replyId) => {
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!window.confirm('이 답변을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deleteDoc(doc(db, 'qnaReplies', replyId));

      // 즉시 게시물 새로고침
      if (selectedPost) {
        const updatedPost = await fetchPostWithReplies(selectedPost.id);
        if (updatedPost) {
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === selectedPost.id ? updatedPost : post
            )
          );
          setSelectedPost(updatedPost);
        }
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      setError('답변 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId, fileUrl) => {
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!window.confirm('이 게시물을 삭제하시겠습니까?')) {
      return;
    }

    try {
      if (fileUrl) {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      }

      const repliesQuery = query(
        collection(db, 'qnaReplies'),
        where('postId', '==', postId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      const deleteReplies = repliesSnapshot.docs.map(replyDoc => 
        deleteDoc(doc(db, 'qnaReplies', replyDoc.id))
      );
      await Promise.all(deleteReplies);

      await deleteDoc(doc(db, 'qna', postId));
      await fetchPosts();
      setView('list');
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('게시물 삭제 중 오류가 발생했습니다.');
    }
  };

  const renderListView = () => (
    <div className="qna-list-view">
      <div className="qna-header">
        <h2>문의/답변 게시판</h2>
        <button 
          className="write-button"
          onClick={() => setView('write')}
        >
          글쓰기
        </button>
      </div>
      
      <table className="qna-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>답변상태</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <tr 
              key={post.id} 
              onClick={() => {
                setSelectedPost(post);
                setView('detail');
              }}
              className="post-row"
            >
              <td>{posts.length - index}</td>
              <td>{post.title}</td>
              <td>{post.userName}</td>
              <td>{new Date(post.createdAt.toDate()).toLocaleDateString()}</td>
              <td>{post.replies?.length > 0 ? '답변완료' : '답변대기'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWriteView = () => (
    <div className="write-view">
      <h2>질문 작성</h2>
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-control"
            rows="5"
            required
          />
        </div>
        
//        <div className="form-group">
//          <input
//            type="file"
//            onChange={handleFileChange}
//            className="form-control"
//            id="file-input"
//          />
//          <small className="file-info">최대 파일 크기: 5MB</small>
//        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="button-group">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '작성 중...' : '작성하기'}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => {
              resetForm();
              setView('list');
            }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );

  const renderDetailView = () => {
    if (!selectedPost) return null;
    
    return (
      <div className="detail-view">
        <div className="detail-header">
          <h2>{selectedPost.title}</h2>
          <div className="post-meta">
            작성자 : {selectedPost.userName} {'| '}
            {new Date(selectedPost.createdAt.toDate()).toLocaleDateString()}
            {' '}
            {new Date(selectedPost.createdAt.toDate()).toLocaleTimeString()}
            {(auth.currentUser?.uid === selectedPost.userId || isAdmin) && (
              <button
                onClick={() => handleDelete(selectedPost.id, selectedPost.fileUrl)}
                className="delete-button"
              >
                삭제
              </button>
            )}
          </div>
        </div>

        <div className="post-content">
          <p>{selectedPost.content}</p>
          {selectedPost.fileUrl && (
            <div className="attachment">
              <a href={selectedPost.fileUrl} target="_blank" rel="noopener noreferrer">
                📎 {selectedPost.fileName}
              </a>
            </div>
          )}
        </div>

        <div className="replies-section">
          <h3>답변 목록</h3>
          {selectedPost.replies && selectedPost.replies.map((reply) => (
            <div key={reply.id} className="reply-card">
              <div className="reply-meta">
                {reply.userName}
                {/*reply.isAdmin && <span className="admin-badge">관리자</span>} */}
                {' | '}   
                {new Date(reply.createdAt.toDate()).toLocaleDateString()}
                {' '}
                {new Date(reply.createdAt.toDate()).toLocaleTimeString()}
                {/* reply.updatedAt && <span className="updated-badge">수정됨</span> */}
                {(auth.currentUser?.uid === reply.userId || isAdmin) && (
                  <div className="reply-actions">
                    <button
                      onClick={() => {
                        setEditingReply(reply.id);
                        setReplyContent(reply.content);
                      }}
                      className="edit-button"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleReplyDelete(reply.id)}
                      className="delete-button-reply"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {editingReply === reply.id ? (
                <div className="edit-reply-form">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="form-control"
                  />
                  <div className="button-group">
                    <button
                      onClick={() => handleReplyEdit(reply.id, replyContent)}
                      className="submit-button"
                      disabled={loading}
                    >
                      {loading ? '수정 중...' : '수정 완료'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingReply(null);
                        setReplyContent('');
                      }}
                      className="cancel-button"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p>{reply.content}</p>
              )}
            </div>
          ))}
        </div>

        {isAdmin&& auth.currentUser && editingReply === null && (
          <div className="reply-form">
            <h4>{isAdmin ? '답변 작성' : '답변 작성'}</h4>
            <textarea
              placeholder="답변 내용을 입력하세요"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="form-control"
            />
            <button
              onClick={() => handleReplySubmit(selectedPost.id)}
              className="reply-button"
              disabled={loading}
            >
              {loading ? '작성 중...' : '답변 작성'}
            </button>
          </div>
        )}

        <button 
          className="back-button"
          onClick={() => {
            setView('list');
            setSelectedPost(null);
            setReplyContent('');
            setEditingReply(null);
          }}
        >
          목록으로
        </button>
      </div>
    );
  };

  return (
    <div className="qna-container">
      {view === 'list' && renderListView()}
      {view === 'write' && renderWriteView()}
      {view === 'detail' && renderDetailView()}
    </div>
  );
}

export default QnABoard; 