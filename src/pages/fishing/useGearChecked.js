// 준비물 체크 상태 (lib/gearChecked.js): 한쪽에서 체크하면 다른 쪽도 바로 바뀝니다. 다른 탭·창에서 바꿔도 따라옵니다.
import { useMemo, useSyncExternalStore } from 'react';
import { GEAR_CHECKED_EVENT, readChecked, toggleChecked, writeChecked } from './lib/gearChecked';

const subscribe = (onChange) => {
  window.addEventListener(GEAR_CHECKED_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => { window.removeEventListener(GEAR_CHECKED_EVENT, onChange); window.removeEventListener('storage', onChange); };
};

export function useGearChecked(key) {
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(readChecked(key)), () => '[]');
  const ids = useMemo(() => JSON.parse(raw), [raw]);
  const checked = useMemo(() => new Set(ids), [ids]);
  return {
    checked,
    toggle: (id) => writeChecked(key, toggleChecked(readChecked(key), id)),
    reset: () => writeChecked(key, []),
  };
}
