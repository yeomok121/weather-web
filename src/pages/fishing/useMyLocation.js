// 낚시 페이지: 고른 포인트가 없을 때만 브라우저에 현재 위치를 한 번 묻습니다. (가장 가까운 포인트를 기본으로)
// 위치는 서버로 보내지 않고 이 화면에서 거리 계산에만 씁니다.
// phase
//   'off'         묻지 않음 (이미 고른 포인트가 있음)
//   'locating'    이미 허용된 위치를 받는 중 → 바다 정보를 잠깐 기다림 (최대 10초)
//   'asking'      사용자가 아직 허용 창에 답하지 않음 → 기다리지 않고 기본 포인트를 먼저 보여 줌
//   'found'       위치를 받음 → 가장 가까운 포인트로 (답이 늦게 와도 바꿔 줌)
//   'unavailable' 거절·미지원·시간 초과
import { useEffect, useState } from 'react';

const OPTIONS = { enableHighAccuracy: false, timeout: 8000, maximumAge: 30 * 60 * 1000 };
const hasGeolocation = () => typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

export function useMyLocation(enabled) {
  const [start] = useState(() => Boolean(enabled) && hasGeolocation());
  const [state, setState] = useState(() => ({ phase: !enabled ? 'off' : hasGeolocation() ? 'locating' : 'unavailable', coords: null }));

  useEffect(() => {
    if (!start) return undefined;
    let active = true;
    const fromLocating = (next) => setState((prev) => (active && prev.phase === 'locating' ? next : prev));
    // 아직 허용 여부를 묻는 중이면 기다리지 않습니다. (Permissions API가 없는 브라우저는 10초까지 기다림)
    navigator.permissions?.query?.({ name: 'geolocation' })
      .then((status) => { if (status.state === 'prompt') fromLocating({ phase: 'asking', coords: null }); })
      .catch(() => {});
    const giveUp = setTimeout(() => fromLocating({ phase: 'unavailable', coords: null }), 10000);
    navigator.geolocation.getCurrentPosition(
      (position) => { if (active) setState({ phase: 'found', coords: { lat: position.coords.latitude, lon: position.coords.longitude } }); },
      () => { if (active) setState((prev) => (prev.phase === 'found' ? prev : { phase: 'unavailable', coords: null })); },
      OPTIONS,
    );
    return () => { active = false; clearTimeout(giveUp); };
  }, [start]);

  return state;
}
