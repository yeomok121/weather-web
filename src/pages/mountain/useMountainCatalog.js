// 산악 페이지: 기본 산 목록(mountains.js) + 서버(/api/mountain/list)에서 받은 추가 산 목록
import { useEffect, useState } from 'react';
import { requestJson } from '../../shared/lib/apiClient';
import { MOUNTAINS_LIST } from './mountains';

export function useMountainCatalog() {
  const [mountainsList, setMountainsList] = useState(MOUNTAINS_LIST);
  const [mountainCatalogState, setMountainCatalogState] = useState('loading');
  const [mountainCatalogAttempt, setMountainCatalogAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    requestJson('/api/mountain/list', { signal: controller.signal, timeoutMs: 90000 }).then(rows => {
      if (!Array.isArray(rows)) throw new Error('목록을 확인할 수 없습니다');
      const known = new Map(MOUNTAINS_LIST.map(item => [item.name, item]));
      const extra = rows.filter(row => row?.name && !known.has(row.name) && Number.isFinite(Number(row.elevation)))
        .slice(0, 30).map(row => ({ name: row.name, elevation: Number(row.elevation), region: row.region, peak: row.peak || '', course_available: false }));
      setMountainsList([...MOUNTAINS_LIST, ...extra]);
      setMountainCatalogState(extra.length >= 30 ? 'ready' : 'limited');
    }).catch(() => { if (!controller.signal.aborted) setMountainCatalogState('limited'); });
    return () => controller.abort();
  }, [mountainCatalogAttempt]);

  const retryMountainCatalog = () => { setMountainCatalogState('loading'); setMountainCatalogAttempt(value => value + 1); };
  return { mountainsList, mountainCatalogState, retryMountainCatalog };
}
