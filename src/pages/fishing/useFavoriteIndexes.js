// 낚시 페이지: 즐겨찾는 포인트들의 바다낚시지수를 한 번씩 받아 둡니다. (같은 화면에서는 다시 받지 않음)
// 아직 받는 중인 포인트는 결과에 없고, 화면에서는 '불러오는 중'으로 보입니다.
import { useEffect, useRef, useState } from 'react';
import { fetchPointIndex } from './fishingApi';

export function useFavoriteIndexes(names = []) {
  const [byName, setByName] = useState({});
  const requested = useRef(new Set());
  const key = names.join('|');

  useEffect(() => {
    const controller = new AbortController();
    const done = requested.current; // 이 화면에서 이미 요청한 포인트 (같은 Set을 계속 씀)
    const pending = new Set();
    for (const name of key ? key.split('|') : []) {
      if (done.has(name)) continue;
      done.add(name);
      pending.add(name);
      fetchPointIndex(name, { signal: controller.signal })
        .then((index) => { pending.delete(name); setByName((current) => ({ ...current, [name]: { status: 'ready', index } })); })
        .catch((error) => {
          pending.delete(name);
          if (controller.signal.aborted) return;
          setByName((current) => ({ ...current, [name]: { status: error?.status === 404 ? 'missing' : 'failed' } }));
        });
    }
    // 목록이 바뀌거나 화면을 떠나면 받는 중인 요청을 취소하고, 다음에 다시 받을 수 있게 표시를 지웁니다.
    return () => { controller.abort(); for (const name of pending) done.delete(name); };
  }, [key]);

  return byName;
}
