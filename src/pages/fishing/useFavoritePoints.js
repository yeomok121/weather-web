// 낚시 페이지: 즐겨찾는 낚시 포인트 (최대 10곳)
// 로그인 전에는 이 브라우저에, 로그인하면 계정에 저장합니다. 로그인할 때 브라우저 목록을 계정 목록 뒤에 합칩니다.
import { useEffect, useRef, useState } from 'react';
import { readStoredJson, writeStoredJson } from '../../shared/lib/browserStorage';
import { fetchMyFishingPoints, saveMyFishingPoints } from './fishingApi';
import { MAX_FAVORITE_POINTS, mergeFavoritePoints } from './lib/favorites';
const GUEST_KEY = 'fishing:favorite-points:guest';
const storageKey = (userId) => (userId ? `fishing:favorite-points:${userId}` : GUEST_KEY);
const readNames = (key) => readStoredJson(key, []).filter((name) => typeof name === 'string');

export function useFavoritePoints({ loggedInUser, showToast }) {
  const userId = loggedInUser?.id || '';
  const token = loggedInUser?.accessToken || '';
  const key = storageKey(userId);
  const [saved, setSaved] = useState({});
  const favorites = saved[key] ?? readNames(key);
  const toastRef = useRef(showToast);
  useEffect(() => { toastRef.current = showToast; });

  // 로그인하면 계정 목록을 받아 브라우저 목록과 합쳐 저장합니다.
  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    fetchMyFishingPoints(token, { signal: controller.signal }).then(async (body) => {
      const account = Array.isArray(body?.points) ? body.points.filter((name) => typeof name === 'string') : [];
      const guest = readNames(GUEST_KEY);
      const merged = mergeFavoritePoints(account, guest);
      if (merged.length !== account.length) await saveMyFishingPoints(token, merged);
      if (controller.signal.aborted) return;
      writeStoredJson(key, merged);
      if (guest.length) writeStoredJson(GUEST_KEY, []);
      setSaved((previous) => ({ ...previous, [key]: merged }));
      if (merged.length > account.length) toastRef.current?.('이 브라우저의 즐겨찾는 포인트를 계정에 저장했어요.');
    }).catch(() => {
      if (!controller.signal.aborted) toastRef.current?.('즐겨찾는 포인트를 계정에서 불러오지 못해 이 브라우저 목록을 표시합니다.');
    });
    return () => controller.abort();
  }, [token, key]);

  const toggle = (name) => {
    const next = favorites.includes(name) ? favorites.filter((item) => item !== name) : [...favorites, name];
    if (next.length > MAX_FAVORITE_POINTS) { showToast?.(`즐겨찾는 포인트는 최대 ${MAX_FAVORITE_POINTS}곳까지 저장할 수 있어요.`); return; }
    writeStoredJson(key, next);
    setSaved((previous) => ({ ...previous, [key]: next }));
    if (token) {
      saveMyFishingPoints(token, next).catch(() => showToast?.('이 브라우저에는 저장했지만 계정 저장에 실패했어요.'));
    }
  };

  return { favorites, toggle, isFavorite: (name) => favorites.includes(name) };
}
