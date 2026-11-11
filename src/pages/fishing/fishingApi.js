// 낚시 페이지: 서버 요청 (백엔드 app/routers/fishing.py)
import { requestJson } from '../../shared/lib/apiClient';

// 서버 해역 목록(/api/fishing/areas)을 못 받을 때 쓰는 기본 목록. 해역 추가는 백엔드 app/fishing/areas.py에서 합니다.
export const FALLBACK_AREAS = [
  { id: 'chuja', place: '추자도 해상', region: '12D00000', region_name: '제주도 전해상', lat: 33.96194, lon: 126.44527, tide_system: 8 },
  { id: 'west', place: '태안 앞바다', region: '12A20100', region_name: '서해중부앞바다', lat: 36.7, lon: 126.1, tide_system: 7 },
  { id: 'southeast', place: '부산 앞바다', region: '12B20100', region_name: '남해동부앞바다', lat: 35.1, lon: 129.2, tide_system: 8 },
];

const isArea = (item) => item && typeof item.id === 'string' && typeof item.place === 'string'
  && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon));

export async function fetchFishingAreas({ signal } = {}) {
  const rows = await requestJson('/api/fishing/areas', { signal, timeoutMs: 20000 });
  const areas = Array.isArray(rows) ? rows.filter(isArea) : [];
  if (!areas.length) throw new Error('해역 목록이 비어 있습니다.');
  return areas;
}

export function fetchFishingSummary(area, { signal } = {}) {
  // area(해역 id)와 함께 예전 방식 값(place·region·lat·lon)도 보내 서버 버전과 관계없이 같은 해역을 조회합니다.
  const query = new URLSearchParams({ area: area.id, place: area.place, region: area.region || '', lat: String(area.lat), lon: String(area.lon) });
  return requestJson(`/api/fishing/summary?${query}`, { signal, timeoutMs: 90000 });
}
