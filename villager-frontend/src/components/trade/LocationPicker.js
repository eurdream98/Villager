import { useEffect, useRef, useState } from 'react';
import { loadKakaoMapSdk, reverseGeocode } from '../../lib/kakaoMap';
import './LocationPicker.css';

const DEFAULT_CENTER = { lat: 37.5012, lng: 127.0396 };

function LocationPicker({ value, onChange, readOnly = false, compact = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  const applyPosition = async (lat, lng) => {
    if (readOnly) return;
    setGeocoding(true);
    setError(null);
    try {
      const { address, neighborhood } = await reverseGeocode(lat, lng);
      onChange?.({ latitude: lat, longitude: lng, address, neighborhood });
    } catch (err) {
      onChange?.({
        latitude: lat,
        longitude: lng,
        address: value?.address ?? '',
        neighborhood: value?.neighborhood ?? '',
      });
      setError(err.message || '주소 변환에 실패했습니다.');
    } finally {
      setGeocoding(false);
    }
  };

  const moveMarker = (kakao, lat, lng) => {
    const pos = new kakao.maps.LatLng(lat, lng);
    markerRef.current?.setPosition(pos);
    mapInstanceRef.current?.setCenter(pos);
  };

  useEffect(() => {
    let cancelled = false;

    loadKakaoMapSdk()
      .then((kakao) => {
        if (cancelled || !mapRef.current) return;

        const lat = value?.latitude ?? DEFAULT_CENTER.lat;
        const lng = value?.longitude ?? DEFAULT_CENTER.lng;
        const center = new kakao.maps.LatLng(lat, lng);

        const map = new kakao.maps.Map(mapRef.current, {
          center,
          level: compact ? 4 : 3,
          draggable: !readOnly,
          scrollwheel: !readOnly,
          disableDoubleClick: readOnly,
          disableDoubleClickZoom: readOnly,
        });
        const marker = new kakao.maps.Marker({ position: center, map });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        if (!readOnly) {
          kakao.maps.event.addListener(map, 'click', (e) => {
            const clickLat = e.latLng.getLat();
            const clickLng = e.latLng.getLng();
            moveMarker(kakao, clickLat, clickLng);
            applyPosition(clickLat, clickLng);
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || '지도를 불러오지 못했습니다.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, compact]);

  const handleMyLocation = () => {
    if (readOnly) return;
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        loadKakaoMapSdk().then((kakao) => {
          moveMarker(kakao, lat, lng);
          applyPosition(lat, lng);
        });
      },
      () => setError('현재 위치를 가져오지 못했습니다. 권한을 확인해 주세요.'),
    );
  };

  const rootClass = [
    'location-picker',
    compact ? 'location-picker--compact' : '',
    readOnly ? 'location-picker--readonly' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {!readOnly && (
        <div className="location-picker__toolbar">
          <button type="button" className="location-picker__btn" onClick={handleMyLocation}>
            내 위치
          </button>
          <span className="location-picker__hint">지도를 탭해서 위치를 정하세요</span>
        </div>
      )}

      <div className="location-picker__map-wrap">
        {loading && <p className="location-picker__overlay">지도 불러오는 중…</p>}
        <div ref={mapRef} className="location-picker__map" aria-label="거래 위치 지도" />
      </div>

      {!readOnly && geocoding && <p className="location-picker__status">주소 확인 중…</p>}
      {value?.address && (
        <p className="location-picker__address">{value.address}</p>
      )}
      {error && (
        <p className="location-picker__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default LocationPicker;
