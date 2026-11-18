// 낚시 페이지: 서버 요청 (백엔드 app/routers/fishing.py)
import { requestJson } from '../../shared/lib/apiClient';

// 서버 해역 목록(/api/fishing/areas)을 못 받을 때 쓰는 기본 목록. 해역 추가는 백엔드 app/fishing/areas.py에서 합니다.
export const FALLBACK_AREAS = [
  { id: 'chuja', place: '추자도 해상', region: '12B10201', region_name: '남해서부서쪽먼바다', lat: 33.96194, lon: 126.44527, tide_system: 8 },
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
  if (area.pointId) return requestJson(`/api/fishing/summary?${new URLSearchParams({ point: area.pointId })}`, { signal, timeoutMs: 90000 });
  // area(해역 id)와 함께 예전 방식 값(place·region·lat·lon)도 보내 서버 버전과 관계없이 같은 해역을 조회합니다.
  const query = new URLSearchParams({ area: area.id, place: area.place, region: area.region || '', lat: String(area.lat), lon: String(area.lon) });
  return requestJson(`/api/fishing/summary?${query}`, { signal, timeoutMs: 90000 });
}

// 바다낚시지수 낚시 포인트 전체 (서버 app/fishing/zones.py에서 바다 구역과 연결)
const isPoint = (item) => item && typeof item.id === 'string' && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon));

export async function fetchFishingPoints({ signal } = {}) {
  const rows = await requestJson('/api/fishing/points', { signal, timeoutMs: 90000 });
  const points = Array.isArray(rows) ? rows.filter(isPoint) : [];
  if (!points.length) throw new Error('낚시 포인트 목록이 비어 있습니다.');
  return points;
}

const authHeaders = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

export function fetchMyFishingPoints(token, { signal } = {}) {
  return requestJson('/api/users/me/fishing-points', { signal, timeoutMs: 20000, headers: authHeaders(token) });
}

export function saveMyFishingPoints(token, points) {
  return requestJson('/api/users/me/fishing-points', { method: 'PUT', timeoutMs: 20000, headers: authHeaders(token), body: JSON.stringify({ points }) });
}

// 포인트 하나의 바다낚시지수 자세히 (지수 설명 창)
export function fetchPointIndex(pointId, { signal } = {}) {
  return requestJson(`/api/fishing/points/${encodeURIComponent(pointId)}/index`, { signal, timeoutMs: 90000 });
}
