// 낚시 페이지: 고른 포인트가 없을 때만 브라우저에 현재 위치를 한 번 묻습니다. (가장 가까운 포인트를 기본으로)
// 위치는 서버로 보내지 않고 이 화면에서 거리 계산에만 씁니다.
// phase: 'off'(묻지 않음) · 'locating'(확인 중) · 'found' · 'unavailable'(거절·미지원·시간 초과)
import { useEffect, useState } from 'react';

const OPTIONS = { enableHighAccuracy: false, timeout: 8000, maximumAge: 30 * 60 * 1000 };

export function useMyLocation(enabled) {
  const [state, setState] = useState(() => ({
    phase: !enabled ? 'off' : typeof navigator !== 'undefined' && navigator.geolocation ? 'locating' : 'unavailable',
    coords: null,
  }));

  useEffect(() => {
    if (state.phase !== 'locating') return undefined;
    let active = true;
    // 권한 창에 답하지 않고 두는 경우도 있어서 timeout과 별도로 10초 뒤에는 기본 포인트로 넘어갑니다.
    const giveUp = setTimeout(() => { if (active) setState({ phase: 'unavailable', coords: null }); }, 10000);
    navigator.geolocation.getCurrentPosition(
      (position) => { if (active) setState({ phase: 'found', coords: { lat: position.coords.latitude, lon: position.coords.longitude } }); },
      () => { if (active) setState({ phase: 'unavailable', coords: null }); },
      OPTIONS,
    );
    return () => { active = false; clearTimeout(giveUp); };
  }, [state.phase]);

  return state;
}
