// 낚시 페이지: 해역 목록과 선택한 해역의 바다 정보를 불러오는 상태
import { useCallback, useEffect, useRef, useState } from 'react';
import { FALLBACK_AREAS, fetchFishingAreas, fetchFishingPoints, fetchFishingSummary } from './fishingApi';

export function useFishingAreas() {
  const [areas, setAreas] = useState(FALLBACK_AREAS);
  useEffect(() => {
    const controller = new AbortController();
    fetchFishingAreas({ signal: controller.signal }).then(setAreas).catch(() => { /* 기본 목록으로 계속 사용 */ });
    return () => controller.abort();
  }, []);
  return areas;
}

// 낚시 포인트 목록. 서버가 목록을 못 주면(예전 서버·키 없음) status='failed' → 화면은 해역 3곳 선택으로 동작
export function useFishingPoints() {
  const [state, setState] = useState({ points: [], status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetchFishingPoints({ signal: controller.signal })
      .then((points) => setState({ points, status: 'ready' }))
      .catch(() => { if (!controller.signal.aborted) setState({ points: [], status: 'failed' }); });
    return () => controller.abort();
  }, []);
  return state;
}

// enabled=false 이면(예: 내 위치로 가까운 포인트를 찾는 중) 아직 불러오지 않고 기다립니다.
export function useFishingSummary(area, { enabled = true } = {}) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(null);
  const data = result?.areaId === area.id ? result.data : null;

  // 같은 해역·포인트면 다시 불러오지 않습니다. (포인트 목록이 늦게 와서 좌표가 채워져도 다시 요청하지 않음)
  const areaKey = area.pointId ? `point:${area.pointId}` : `${area.id}|${area.region}|${area.lat}|${area.lon}`;
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
    if (!enabled) return undefined;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) load(); });
    return () => { cancelled = true; requestRef.current?.abort(); requestRef.current = null; };
  }, [areaKey, load, enabled]);

  return { data, error, loading, reload: load };
}
