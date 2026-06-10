const SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';

let loadPromise = null;

export function getKakaoMapJsKey() {
  return (process.env.REACT_APP_KAKAO_MAP_JS_KEY || '').trim();
}

/** 카카오맵 SDK 한 번만 로드 */
export function loadKakaoMapSdk() {
  const key = getKakaoMapJsKey();
  if (!key) {
    return Promise.reject(new Error('REACT_APP_KAKAO_MAP_JS_KEY 가 설정되지 않았습니다.'));
  }

  if (window.kakao?.maps?.LatLng) {
    return Promise.resolve(window.kakao);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${SDK_URL}?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        if (!window.kakao?.maps) {
          reject(new Error('카카오맵 SDK를 불러오지 못했습니다.'));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao));
      };
      script.onerror = () => reject(new Error('카카오맵 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

/** 좌표 → 주소 (역지오코딩) */
export function reverseGeocode(latitude, longitude) {
  return loadKakaoMapSdk().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          if (status !== kakao.maps.services.Status.OK || !result?.[0]) {
            reject(new Error('주소를 찾지 못했습니다.'));
            return;
          }
          const row = result[0];
          const road = row.road_address?.address_name;
          const jibun = row.address?.address_name;
          resolve({
            address: road || jibun || '',
            neighborhood: row.address?.region_3depth_name || '',
          });
        });
      }),
  );
}