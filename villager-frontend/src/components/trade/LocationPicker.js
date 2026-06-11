import { useEffect, useRef, useState } from 'react';
import { loadKakaoMapSdk, reverseGeocode } from '../../lib/kakaoMap';
import AddressSearchModal from './AddressSearchModal';
import LocationPickerModal from './LocationPickerModal';
import './LocationPicker.css';

const DEFAULT_CENTER = { lat: 37.5012, lng: 127.0396 };

function LocationPicker({
  value,
  onChange,
  readOnly = false,
  compact = false,
  useModal = false,
  showZoomControl = false,
  mapClassName = '',
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(!useModal);
  const [error, setError] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

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

  const applyLocation = (item) => {
    if (readOnly) return;
    setError(null);
    const next = {
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address,
      neighborhood: value?.neighborhood ?? '',
    };
    if (!useModal && mapInstanceRef.current) {
      loadKakaoMapSdk().then((kakao) => {
        moveMarker(kakao, item.latitude, item.longitude);
      });
    }
    onChange?.(next);
  };

  useEffect(() => {
    if (useModal) {
      setLoading(false);
      return undefined;
    }

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

        if (showZoomControl) {
          map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
        }

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
        requestAnimationFrame(() => {
          map.relayout();
          map.setCenter(center);
        });
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
  }, [readOnly, compact, useModal, showZoomControl]);

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
        if (useModal) {
          applyPosition(lat, lng);
          return;
        }
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
    useModal ? 'location-picker--trigger' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const mapClass = ['location-picker__map', mapClassName].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      {!readOnly && (
        <>
          <input
            type="text"
            className="location-picker__address-input"
            readOnly
            value={value?.address || ''}
            placeholder="주소를 검색하거나 지도에서 위치를 찍어 주세요"
            aria-label="선택된 거래 위치 주소"
          />
          <div className="location-picker__toolbar">
            <button
              type="button"
              className="location-picker__btn"
              onClick={() => setSearchOpen(true)}
            >
              주소·장소 검색
            </button>
            {useModal ? (
              <button
                type="button"
                className="location-picker__btn location-picker__btn--primary"
                onClick={() => setMapModalOpen(true)}
              >
                지도에서 정하기
              </button>
            ) : (
              <button type="button" className="location-picker__btn" onClick={handleMyLocation}>
                내 위치
              </button>
            )}
            <span className="location-picker__hint">
              {useModal
                ? '검색하거나 지도 팝업에서 위치를 정하세요'
                : '검색하거나 지도를 탭해서 위치를 정하세요'}
            </span>
          </div>
          <AddressSearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelect={applyLocation}
          />
          {useModal && (
            <LocationPickerModal
              open={mapModalOpen}
              value={value}
              onClose={() => setMapModalOpen(false)}
              onConfirm={(loc) => {
                onChange?.(loc);
                setMapModalOpen(false);
              }}
            />
          )}
        </>
      )}

      {!useModal && (
        <div className="location-picker__map-wrap">
          {loading && <p className="location-picker__overlay">지도 불러오는 중…</p>}
          <div ref={mapRef} className={mapClass} aria-label="거래 위치 지도" />
        </div>
      )}

      {!readOnly && geocoding && <p className="location-picker__status">주소 확인 중…</p>}
      {readOnly && value?.address && (
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
