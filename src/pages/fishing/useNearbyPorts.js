// 낚시 페이지: 선택한 포인트 근처 낚싯배 출항지 불러오기 (낚싯배 탭을 처음 열 때부터)
import { useEffect, useState } from 'react';
import { fetchNearbyPorts } from './fishingApi';

export function useNearbyPorts(lat, lon, enabled) {
  const ready = enabled && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));
  const key = ready ? `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}` : null;
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!key) return undefined;
    const controller = new AbortController();
    const [keyLat, keyLon] = key.split(',').map(Number);
    fetchNearbyPorts(keyLat, keyLon, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: '' }))
      .catch((error) => { if (!controller.signal.aborted) setResult({ key, data: null, error: error?.message || '출항지 정보를 불러오지 못했습니다.' }); });
    return () => controller.abort();
  }, [key, retry]);

  const current = result.key === key ? result : null;
  return {
    data: current?.data || null,
    error: current?.error || '',
    loading: Boolean(key) && !current,
    reload: () => { setResult({ key: null, data: null, error: '' }); setRetry((count) => count + 1); },
  };
}
