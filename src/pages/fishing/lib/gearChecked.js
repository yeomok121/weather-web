// 준비물 체크 표시: 이 브라우저에 계정별로 저장하고, 같은 화면의 준비물 탭과 오른쪽 작은 체크리스트가 함께 봅니다.
export const GEAR_CHECKED_KEY = 'fishing:gear-checked:v1';
export const GEAR_CHECKED_EVENT = 'fishing-gear-checked';

export const gearCheckedKey = (loggedInUser) => {
  const owner = loggedInUser?.memberId ?? loggedInUser?.id;
  return owner == null ? GEAR_CHECKED_KEY : `${GEAR_CHECKED_KEY}:member:${owner}`;
};

export function readChecked(key, storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
  } catch { return []; }
}

export function writeChecked(key, ids, storage = globalThis.localStorage) {
  try { storage?.setItem(key, JSON.stringify(ids)); } catch { /* 저장이 막혀도 화면은 동작 */ }
  globalThis.dispatchEvent?.(new CustomEvent(GEAR_CHECKED_EVENT, { detail: key }));
}

export const toggleChecked = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
