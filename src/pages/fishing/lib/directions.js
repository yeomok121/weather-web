// 낚시 페이지: 출항지까지 길찾기 링크 (카카오맵·네이버지도 웹 주소, API 키 없이 새 창으로 엽니다)
// 출발지는 각 지도에서 '내 위치'로 정합니다. 낚시 포인트는 바다 위인 경우가 많아 목적지는 출항지로 잡습니다.

// 이름에 쉼표·빗금이 있으면 주소 구분자와 섞이므로 빼고 씁니다.
const cleanName = (name) => String(name || '목적지').replace(/[,/]/g, ' ').replace(/\s+/g, ' ').trim() || '목적지';
const coord = (value) => Number(value).toFixed(6);

// 카카오맵: https://map.kakao.com/link/to/이름,위도,경도 (위도가 먼저)
export function kakaoDirectionsUrl({ name, lat, lon }) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(cleanName(name))},${coord(lat)},${coord(lon)}`;
}

// 네이버지도: https://map.naver.com/p/directions/-/경도,위도,이름,,/-/car (출발지 '-' = 비워 둠, 경도가 먼저)
export function naverDirectionsUrl({ name, lat, lon }) {
  return `https://map.naver.com/p/directions/-/${coord(lon)},${coord(lat)},${encodeURIComponent(cleanName(name))},,/-/car`;
}
