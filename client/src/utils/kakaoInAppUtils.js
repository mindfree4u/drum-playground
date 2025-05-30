// client/src/utils/kakaoInAppUtils.js
// 카카오톡 인앱 브라우저 관련 유틸리티 함수들

/**
 * 카카오톡 인앱 브라우저인지 감지
 * @returns {boolean} 카카오톡 인앱 브라우저 여부
 */
export const isKakaoTalkInApp = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /KAKAOTALK/i.test(userAgent);
  };
  
  /**
   * 모바일 디바이스인지 감지
   * @returns {boolean} 모바일 디바이스 여부
   */
  export const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  };
  
  /**
   * iOS 디바이스인지 감지
   * @returns {boolean} iOS 디바이스 여부
   */
  export const isIOSDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  };
  
  /**
   * 안드로이드 디바이스인지 감지
   * @returns {boolean} 안드로이드 디바이스 여부
   */
  export const isAndroidDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /Android/i.test(userAgent);
  };
  
  /**
   * 카카오톡 인앱 브라우저 최적화 설정 적용
   */
  export const optimizeForKakaoInApp = () => {
    if (!isKakaoTalkInApp()) return;
  
    console.log('🔧 카카오톡 인앱 브라우저 최적화 적용 중...');
  
    // 1. 뷰포트 메타 태그 동적 조정
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  
    // 2. 터치 이벤트 최적화
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
    document.addEventListener('touchend', function() {}, { passive: true });
  
    // 3. 스크롤 최적화
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.overflowScrolling = 'touch';
  
    // 4. 탭 하이라이트 제거
    document.body.style.webkitTapHighlightColor = 'transparent';
  
    // 5. 사용자 선택 방지 (필요한 경우)
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
  
    // 6. 콜아웃 방지
    document.body.style.webkitTouchCallout = 'none';
  
    // 7. 입력 필드 줌 방지 (iOS)
    if (isIOSDevice()) {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (input.style.fontSize === '' || parseInt(input.style.fontSize) < 16) {
          input.style.fontSize = '16px';
        }
      });
    }
  
    console.log('✅ 카카오톡 인앱 브라우저 최적화 완료');
  };
  
  /**
   * 카카오톡 인앱 브라우저에서 외부 브라우저로 열기 유도
   * @param {string} url - 열고자 하는 URL (기본값: 현재 페이지)
   */
  export const openInExternalBrowser = (url = window.location.href) => {
    if (!isKakaoTalkInApp()) {
      console.log('카카오톡 인앱 브라우저가 아닙니다.');
      return;
    }
  
    // 카카오톡 인앱에서 외부 브라우저로 열기
    const isIOS = isIOSDevice();
    const isAndroid = isAndroidDevice();
  
    if (isIOS) {
      // iOS에서는 사파리로 열기
      window.location.href = `x-web-search://?${url}`;
      // 대안: 사용자에게 Safari로 열기 안내
      setTimeout(() => {
        alert('더 나은 경험을 위해 Safari 브라우저에서 열어주세요.\n\n우측 상단 메뉴 → Safari에서 열기');
      }, 100);
    } else if (isAndroid) {
      // 안드로이드에서는 기본 브라우저로 열기
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      // 대안: 사용자에게 Chrome으로 열기 안내
      setTimeout(() => {
        alert('더 나은 경험을 위해 Chrome 브라우저에서 열어주세요.\n\n우측 상단 메뉴 → Chrome에서 열기');
      }, 100);
    }
  };
  
  /**
   * 카카오톡 인앱 브라우저 알림 표시
   * @param {string} message - 표시할 메시지
   * @param {string} type - 알림 타입 ('info', 'warning', 'error')
   */
  export const showKakaoInAppNotice = (message, type = 'info') => {
    if (!isKakaoTalkInApp()) return;
  
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: ${type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      padding: 10px;
      text-align: center;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    notice.textContent = message;
  
    document.body.appendChild(notice);
  
    // 5초 후 자동 제거
    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  };
  
  /**
   * 카카오톡 인앱 브라우저 환경 정보 수집
   * @returns {object} 환경 정보 객체
   */
  export const getKakaoInAppInfo = () => {
    return {
      isKakaoInApp: isKakaoTalkInApp(),
      isMobile: isMobileDevice(),
      isIOS: isIOSDevice(),
      isAndroid: isAndroidDevice(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  };
  
  /**
   * 카카오톡 인앱 브라우저 디버그 정보 출력
   */
  export const debugKakaoInApp = () => {
    const info = getKakaoInAppInfo();
    console.group('🔍 카카오톡 인앱 브라우저 디버그 정보');
    console.log('카카오톡 인앱:', info.isKakaoInApp);
    console.log('모바일 디바이스:', info.isMobile);
    console.log('iOS:', info.isIOS);
    console.log('안드로이드:', info.isAndroid);
    console.log('User Agent:', info.userAgent);
    console.log('뷰포트:', info.viewport);
    console.log('스크린:', info.screen);
    console.groupEnd();
    
    return info;
  }; 