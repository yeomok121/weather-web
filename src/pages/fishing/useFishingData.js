// 낚시 페이지: 해역 목록과 선택한 해역의 바다 정보를 불러오는 상태
import { useCallback, useEffect, useRef, useState } from 'react';
import { FALLBACK_AREAS, fetchFishingAreas, fetchFishingSummary } from './fishingApi';

export function useFishingAreas() {
  const [areas, setAreas] = useState(FALLBACK_AREAS);
  useEffect(() => {
    const controller = new AbortController();
    fetchFishingAreas({ signal: controller.signal }).then(setAreas).catch(() => { /* 기본 목록으로 계속 사용 */ });
    return () => controller.abort();
  }, []);
  return areas;
}

export function useFishingSummary(area) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(null);
  const data = result?.areaId === area.id ? result.data : null;

  // 서버 해역 목록으로 바뀌어도 같은 해역이면 다시 불러오지 않도록 내용으로 비교합니다.
  const areaKey = `${area.id}|${area.region}|${area.lat}|${area.lon}`;
  const areaRef = useRef(area);
  useEffect(() => { areaRef.current = area; });

  const load = useCallback(async () => {
    const requestedArea = areaRef.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true); setError('');
    try {
      const body = await fetchFishingSummary(requestedArea, { signal: controller.signal });
      if (requestRef.current === controller) setResult({ areaId: requestedArea.id, data: body });
    } catch (e) {
      if (requestRef.current === controller) setError(e.timeout ? '응답이 지연되고 있습니다. 다시 시도해 주세요.' : (e.message || '서버에 연결할 수 없습니다.'));
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => { requestRef.current?.abort(); requestRef.current = null; };
  }, [areaKey, load]);

  return { data, error, loading, reload: load };
}
