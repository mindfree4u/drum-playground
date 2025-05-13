import React, { useEffect, useRef, useState } from 'react';
import './Location.css';

// Declare global Naver maps objects to prevent ESLint no-undef errors
/* global naver */

const Location = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const address = "대전광역시 유성구 하기동 송림로53번길 6-17";

  // 정확한 좌표값 설정 (드럼 놀이터 위치)
  const DRUM_LOCATION = {
    lat: 36.3871952366413,
    lng: 127.324930752035
  };

  const handleFindWay = () => {
    const latitude = DRUM_LOCATION.lat;
    const longitude = DRUM_LOCATION.lng;
    const placeName = "드럼놀이터";
    const url = `https://map.naver.com/v5/entry/coordinates/127.324930752035, 36.3871952366413, 드럼놀이터?c=15.00,0,0,0,dh`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    const initializeMap = () => {
      try {
        const container = mapRef.current;
        const options = {
          center: new naver.maps.LatLng(DRUM_LOCATION.lat, DRUM_LOCATION.lng),
          zoom: 17,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
          }
        };

        const map = new naver.maps.Map(container, options);

        // 마커 생성
        markerRef.current = new naver.maps.Marker({
          position: options.center,
          map: map
        });

        // 정보창 생성
        const infoWindow = new naver.maps.InfoWindow({
          content: `
            <div style="padding:10px;min-width:200px;text-align:center;">
              <h4 style="margin:0 0 5px 0;font-size:14px;">드럼 놀이터</h4>
              <p style="margin:0;font-size:13px;">${address}</p>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: "white",
          borderRadius: "5px",
          anchorSize: new naver.maps.Size(0, 0)
        });

        // 마커 클릭 시 정보창 토글
        naver.maps.Event.addListener(markerRef.current, 'click', () => {
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, markerRef.current);
          }
        });

        // 초기에 정보창 표시
        infoWindow.open(map, markerRef.current);

        setMapLoaded(true);
      } catch (error) {
        console.error("지도 초기화 중 오류 발생:", error);
        setMapError("지도를 초기화하는 중 오류가 발생했습니다.");
      }
    };

    const loadNaverMap = () => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=dmxiknm0wt&submodules=geocoder";
      script.onload = () => {
        // API가 완전히 로드될 때까지 대기
        setTimeout(initializeMap, 300);
      };

      script.onerror = () => {
        setMapError('네이버 지도를 로드하는데 실패했습니다.');
      };

      document.head.appendChild(script);
    };

    if (window.naver && window.naver.maps) {
      initializeMap();
    } else {
      loadNaverMap();
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
        <div className="map" ref={mapRef} style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px' }}>
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