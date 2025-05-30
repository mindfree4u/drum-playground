import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Editor, EditorState, convertFromRaw, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import './PostDetail.css';

// 시스템 폰트 정의
const systemFonts = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  '맑은 고딕', '나눔고딕', '돋움', '굴림', '바탕'
].map(font => ({
  label: font,
  style: `FONT_FAMILY_${font.replace(/\s+/g, '_').toUpperCase()}`
}));

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

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [editorState, setEditorState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customStyleMap, setCustomStyleMap] = useState({
    ...systemFonts.reduce((map, font) => ({
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

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, 'posts', id);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          const createdAt = postData.createdAt?.toDate 
            ? postData.createdAt.toDate().toLocaleString('ko-KR')
            : postData.createdAt || '날짜 정보 없음';
            
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
          setPost({
            ...postData,
            id: postDoc.id,
            createdAt
          });
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="post-detail-loading">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="post-detail-error">
        게시글을 찾을 수 없습니다.
        <button onClick={() => navigate('/board')} className="back-button">
          게시판으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <h2>{post.title}</h2>
        <div className="post-detail-info">
          <span>작성자: {post.authorName || '익명'}</span>
          <span>작성일: {post.createdAt}</span>
        </div>
      </div>
      <div className="post-detail-content">
        {editorState && (
          <Editor
            editorState={editorState}
            onChange={setEditorState}
            readOnly={true}
            customStyleMap={customStyleMap}
            blockStyleFn={getBlockStyle}
          />
        )}
      </div>
      <div className="post-detail-actions">
        <button onClick={() => navigate('/board')} className="back-button">
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PostDetail; 