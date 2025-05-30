import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { SketchPicker } from 'react-color';
import 'draft-js/dist/Draft.css';
import './Board.css';

// 사용 가능한 폰트 및 색상 정의
const FONTS = [
  {label: '기본', style: 'default'},
  {label: '나눔고딕', style: 'nanumgothic'},
  {label: '맑은고딕', style: 'malgun'},
  {label: '돋움', style: 'dotum'},
  {label: '굴림', style: 'gulim'}
];

const COLORS = [
  {label: '검정', style: 'black'},
  {label: '빨강', style: 'red'},
  {label: '파랑', style: 'blue'},
  {label: '초록', style: 'green'},
  {label: '회색', style: 'gray'}
];

// 폰트 크기 정의
const FONT_SIZES = [
  {label: '10px', style: 'SIZE_10'},
  {label: '12px', style: 'SIZE_12'},
  {label: '14px', style: 'SIZE_14'},
  {label: '16px', style: 'SIZE_16'},
  {label: '18px', style: 'SIZE_18'},
  {label: '24px', style: 'SIZE_24'},
  {label: '30px', style: 'SIZE_30'},
  {label: '36px', style: 'SIZE_36'},
];

const ALIGNMENTS = [
  {label: '☰', style: 'left', title: '왼쪽 정렬'},
  {label: '☷', style: 'center', title: '가운데 정렬'},
  {label: '☴', style: 'right', title: '오른쪽 정렬'}
];

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'left':
      return 'align-left';
    case 'center':
      return 'align-center';
    case 'right':
      return 'align-right';
    default:
      return null;
  }
}

function Board({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [systemFonts, setSystemFonts] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [customStyleMap, setCustomStyleMap] = useState({
    ...FONTS.reduce((map, font) => ({
      ...map,
      [font.style]: { fontFamily: font.label }
    }), {}),
    SIZE_10: { fontSize: '10px' },
    SIZE_12: { fontSize: '12px' },
    SIZE_14: { fontSize: '14px' },
    SIZE_16: { fontSize: '16px' },
    SIZE_18: { fontSize: '18px' },
    SIZE_24: { fontSize: '24px' },
    SIZE_30: { fontSize: '30px' },
    SIZE_36: { fontSize: '36px' },
  });
  const editorRef = useRef(null);
  const colorPickerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchPosts();
    loadSystemFonts();

    // 색상 선택기 외부 클릭 감지
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAdminStatus = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // setIsAdmin(userData.userId === 'admin'); // 이 줄 제거
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
    setLoading(false);
  };

  const loadSystemFonts = async () => {
    try {
      // 여기서는 예시 폰트 목록을 사용합니다.
      // 실제로는 font-list 패키지를 사용하여 시스템 폰트를 가져와야 합니다.
      const fonts = [
        'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
        '맑은 고딕', '나눔고딕', '돋움', '굴림', '바탕'
      ];
      setSystemFonts(fonts.map(font => ({
        label: font,
        style: `FONT_FAMILY_${font.replace(/\s+/g, '_').toUpperCase()}`
      })));
    } catch (error) {
      console.error('Error loading system fonts:', error);
    }
  };

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const onStyleClick = (style) => {
    if (style.startsWith('SIZE_')) {
      setEditorState(RichUtils.toggleInlineStyle(editorState, style));
    } else if (style.startsWith('FONT_FAMILY_')) {
      setEditorState(RichUtils.toggleInlineStyle(editorState, style));
    } else {
      setEditorState(RichUtils.toggleInlineStyle(editorState, style));
    }
  };

  const onAlignmentClick = (alignment) => {
    const selection = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(selection.getStartKey());
    const blockType = currentBlock.getType();
    
    // 같은 정렬을 다시 클릭하면 기본(왼쪽) 정렬로 돌아감
    const newAlignment = blockType === alignment ? 'unstyled' : alignment;
    const newState = RichUtils.toggleBlockType(editorState, newAlignment);
    setEditorState(newState);
  };

  // 색상 스타일 동적 추가
  const addColorStyles = (content) => {
    const newStyleMap = { ...customStyleMap };
    let hasNewStyles = false;

    if (typeof content === 'object' && content.blocks) {
      content.blocks.forEach(block => {
        if (block.inlineStyleRanges) {
          block.inlineStyleRanges.forEach(range => {
            if (range.style && range.style.startsWith('COLOR_')) {
              const colorHex = range.style.replace('COLOR_', '');
              const colorStyle = { color: `#${colorHex}` };
              if (!newStyleMap[range.style] || 
                  newStyleMap[range.style].color !== colorStyle.color) {
                newStyleMap[range.style] = colorStyle;
                hasNewStyles = true;
              }
            }
          });
        }
      });
    }

    if (hasNewStyles) {
      setCustomStyleMap(newStyleMap);
    }
  };

  // 색상 변경 처리
  const onColorChange = (color) => {
    const newStyle = `COLOR_${color.hex.replace('#', '')}`;
    setSelectedColor(color.hex);
    
    // 새로운 색상 스타일을 customStyleMap에 추가
    const newStyleMap = {
      ...customStyleMap,
      [newStyle]: { color: color.hex }
    };
    setCustomStyleMap(newStyleMap);
    
    // 스타일 적용
    setEditorState(RichUtils.toggleInlineStyle(editorState, newStyle));
  };

  const blockStyleFn = (contentBlock) => {
    const type = contentBlock.getType();
    if (type.startsWith('text-align-')) {
      return type;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!isAdmin) {
      setError('관리자만 게시글을 작성할 수 있습니다.');
      return;
    }

    const contentState = editorState.getCurrentContent();
    if (!title.trim() || !contentState.hasText()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : { userId: '관리자' };
      
      const rawContent = convertToRaw(contentState);
      
      const postData = {
        title,
        content: rawContent, // Raw 형태로 저장
        authorId: auth.currentUser.uid,
        authorName: userData.userName || userData.userId || '관리자',
        updatedAt: Timestamp.now()
      };

      if (editingPostId) {
        await updateDoc(doc(db, 'posts', editingPostId), {
          ...postData,
          lastModified: Timestamp.now()
        });
      } else {
        postData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'posts'), postData);
      }
      
      setTitle('');
      setEditorState(EditorState.createEmpty());
      setEditingPostId(null);
      
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      setError(editingPostId ? '게시글 수정 중 오류가 발생했습니다.' : '게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (postId) => {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const postData = postDoc.data();
        setTitle(postData.title);
        
        let contentState;
        let contentJSON;

        if (typeof postData.content === 'string') {
          try {
            contentJSON = JSON.parse(postData.content);
            contentState = convertFromRaw(contentJSON);
          } catch (e) {
            contentState = ContentState.createFromText(postData.content);
            contentJSON = null;
          }
        } else {
          contentJSON = postData.content;
          contentState = convertFromRaw(postData.content);
        }

        if (contentJSON) {
          addColorStyles(contentJSON);
        }
        
        setEditorState(EditorState.createWithContent(contentState));
        setEditingPostId(postId);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setEditorState(EditorState.createEmpty());
    setError('');
    setEditingPostId(null);
  };

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const postList = [];
      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        // 저장된 content가 문자열인 경우 JSON으로 파싱
        if (typeof postData.content === 'string') {
          try {
            postData.content = JSON.parse(postData.content);
          } catch (e) {
            // JSON 파싱에 실패한 경우 일반 텍스트로 처리
            postData.content = {
              blocks: [
                {
                  text: postData.content,
                  type: 'unstyled',
                  depth: 0,
                  inlineStyleRanges: [],
                  entityRanges: [],
                  data: {},
                },
              ],
              entityMap: {},
            };
          }
        }
        postList.push({
          id: doc.id,
          ...postData
        });
      });
      
      setPosts(postList);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (postId) => {
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!isAdmin) {
      setError('관리자만 게시글을 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', postId));
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Firestore Timestamp 객체인 경우
    if (date.toDate && typeof date.toDate === 'function') {
      const d = date.toDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    // 일반 Date 객체인 경우
    if (date instanceof Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // ISO 문자열인 경우
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    // 기타 경우
    return '날짜 정보 없음';
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="board-container">
      <h2>게시판</h2>
      
      {isAdmin && (
        <div className="post-form-container">
          <h3>{editingPostId ? '게시글 수정' : '새 게시글 작성'}</h3>
          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
              <label htmlFor="title">제목</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">내용</label>
              <div className="editor-container">
                <div className="editor-toolbar">
                  <select 
                    onChange={(e) => onStyleClick(e.target.value)}
                    value=""
                    className="toolbar-select"
                  >
                    <option value="" disabled>폰트</option>
                    {systemFonts.map(font => (
                      <option key={font.style} value={font.style}>
                        {font.label}
                      </option>
                    ))}
                  </select>

                  <select 
                    onChange={(e) => onStyleClick(e.target.value)}
                    value=""
                    className="toolbar-select"
                  >
                    <option value="" disabled>크기</option>
                    {FONT_SIZES.map(size => (
                      <option key={size.style} value={size.style}>
                        {size.label}
                      </option>
                    ))}
                  </select>

                  <div className="toolbar-divider"></div>

                  <div className="color-picker-container" ref={colorPickerRef}>
                    <button
                      type="button"
                      className="color-button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      style={{ backgroundColor: selectedColor }}
                    >
                      <span className="color-indicator"></span>
                    </button>
                    {showColorPicker && (
                      <div className="color-picker-popup">
                        <SketchPicker
                          color={selectedColor}
                          onChange={onColorChange}
                        />
                      </div>
                    )}
                  </div>

                  <div className="toolbar-divider"></div>

                  <div className="toolbar-button-group">
                    <button type="button" onClick={() => onStyleClick('BOLD')}>
                      <strong>B</strong>
                    </button>
                    <button type="button" onClick={() => onStyleClick('ITALIC')}>
                      <em>I</em>
                    </button>
                    <button type="button" onClick={() => onStyleClick('UNDERLINE')}>
                      <u>U</u>
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  <div className="toolbar-button-group">
                    {ALIGNMENTS.map(align => (
                      <button
                        key={align.style}
                        type="button"
                        onClick={() => onAlignmentClick(align.style)}
                        title={align.title}
                        className={`align-button ${
                          editorState
                            .getCurrentContent()
                            .getBlockForKey(editorState.getSelection().getStartKey())
                            .getType() === align.style
                            ? 'active'
                            : ''
                        }`}
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="editor-content">
                  <Editor
                    editorState={editorState}
                    onChange={setEditorState}
                    handleKeyCommand={handleKeyCommand}
                    customStyleMap={customStyleMap}
                    blockStyleFn={getBlockStyle}
                    placeholder="게시글 내용을 입력하세요"
                  />
                </div>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? '저장 중...' : (editingPostId ? '수정' : '등록')}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancel}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="posts-list">
        <h3>게시글 목록</h3>
        {posts.length === 0 ? (
          <p className="no-posts">작성된 게시글이 없습니다.</p>
        ) : (
          <div className="posts-table">
            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  {isAdmin && <th>관리</th>}
                </tr>
              </thead>
              <tbody>
                {posts.map((post, index) => (
                  <tr key={post.id}>
                    <td>{posts.length - index}</td>
                    <td>
                      <span 
                        className="post-title"
                        onClick={() => navigate(`/board/post/${post.id}`)}
                      >
                        {post.title}
                      </span>
                    </td>
                    <td>{post.authorName}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    {isAdmin && (
                      <td className="action-buttons">
                        <button 
                          className="edit-button"
                          onClick={() => handleEdit(post.id)}
                        >
                          수정
                        </button>
                        <button 
                          className="board-delete-button"
                          onClick={() => handleDelete(post.id)}
                        >
                          삭제
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Board; 