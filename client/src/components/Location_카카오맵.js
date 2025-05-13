import React, { useEffect, useRef, useState } from 'react';
import './Location.css';

const Location = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const address = "대전광역시 유성구 하기동 송림로53번길 6-17";


  const handleFindWay = () => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        window.open(`https://map.kakao.com/link/to/${encodeURIComponent(address)},${coords.getLat()},${coords.getLng()}`);
      }
    });
  };

  useEffect(() => {
    const initializeMap = () => {
      try {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(36.354264, 127.366068),
          level: 3
        };
        
        const map = new window.kakao.maps.Map(container, options);
        
        markerRef.current = new window.kakao.maps.Marker({
          position: options.center
        });
        markerRef.current.setMap(map);
        
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            markerRef.current.setPosition(coords);
            map.setCenter(coords);
          }
        });

        setMapLoaded(true);
      } catch (error) {
        console.error("지도 초기화 중 오류 발생:", error);
        setMapError("지도를 초기화하는 중 오류가 발생했습니다.");
      }
    };

    const loadKakaoMap = () => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=26d8640fa64f99a40fc037fb0e5bb873&libraries=services&autoload=false`;
      
      script.onload = () => {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      };

      script.onerror = () => {
        setMapError('카카오맵을 로드하는데 실패했습니다.');
      };

      document.head.appendChild(script);
    };

    // 이미 카카오맵 API가 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      loadKakaoMap();
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [address]);

  return (
    <div className="location-container">
      <h2 className="location-title">찾아오시는 길</h2>
      <div className="location-content">
        <div className="map" ref={mapRef}>
          {!mapLoaded && <div className="map-loading">지도 로딩 중...</div>}
          {mapError && <div className="map-error">{mapError}</div>}
        </div>
        
        <div className="info-section">
          <div className="address-info">
            <p>
              <strong>주소:</strong> {address}
            </p>
            <p>
              <strong>전화:</strong> 010-4404-2584
            </p>
            <button className="find-way-btn" onClick={handleFindWay}>
              길찾기
            </button>
          </div>

          <div className="transport-section">
            <h3>대중교통</h3>
            <div className="transport-info">
              <h4>지하철</h4>
              <ul>
                <li>지족역 2번 출구에서 도보 10분</li>
              </ul>

              <h4>버스</h4>
              <ul>
                <li>송림마을4단지 정류장 하차</li>
                <li>지선버스: 116, 117, 121</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location; 