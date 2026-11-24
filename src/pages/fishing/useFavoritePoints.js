// 낚시 즐겨찾기는 로그인 전 브라우저에, 로그인 후 계정에 저장합니다.
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { readStoredJson, writeStoredJson } from '../../shared/lib/browserStorage';
import { fetchMyFishingPoints, changeMyFishingPoints } from './fishingApi';
import { MAX_FAVORITE_POINTS } from './lib/favorites';

const GUEST_KEY = 'fishing:favorite-points:guest';
const storageKey = userId => userId ? `fishing:favorite-points:${userId}` : GUEST_KEY;
const pendingKey = userId => `fishing:favorite-points:pending:${userId}`;
const readNames = key => {
  const value = readStoredJson(key, []);
  return Array.isArray(value) ? value.filter(name => typeof name === 'string') : [];
};

export function useFavoritePoints({ loggedInUser, showToast }) {
  const userId = loggedInUser?.id || '';
  const token = loggedInUser?.accessToken || '';
  const key = storageKey(userId);
  const [saved, setSaved] = useState({});
  const [revision, setRevision] = useState(0);
  const syncRun = useRef(null);
  const favorites = saved[key] ?? readNames(key);
  const notify = useEffectEvent(message => showToast?.(message));

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    const { signal } = controller;
    syncRun.current = controller;

    async function sync() {
      try {
        const guest = readNames(GUEST_KEY);
        const changes = readStoredJson(pendingKey(userId), {}) || {};
        const additions = Object.keys(changes).filter(name => changes[name] === true);
        const removals = Object.keys(changes).filter(name => changes[name] === false);
        const add = [...new Set([...additions, ...guest.filter(name => changes[name] !== false)])].slice(0, 20);
        const remove = removals.slice(0, 10);
        const body = add.length || remove.length
          ? await changeMyFishingPoints(token, { add, remove }, { signal })
          : await fetchMyFishingPoints(token, { signal });
        if (signal.aborted) return;
        const merged = Array.isArray(body?.points) ? body.points : [];
        const remaining = Object.fromEntries(Object.entries(changes).filter(([name, selected]) =>
          selected ? !merged.includes(name) : !remove.includes(name)));
        const overflow = guest.filter(name => !merged.includes(name) && !remove.includes(name));
        writeStoredJson(pendingKey(userId), remaining);
        writeStoredJson(GUEST_KEY, overflow);
        writeStoredJson(key, merged);
        setSaved(previous => ({ ...previous, [key]: merged }));
        if (overflow.length || Object.keys(remaining).length) {
          notify('계정에 담지 못한 포인트는 이 브라우저에 남겨뒀어요.');
        }
      } catch {
        if (!signal.aborted) notify('계정 동기화에 실패했어요. 변경은 이 브라우저에 남아 있으며 다음에 다시 시도합니다.');
      } finally {
        if (syncRun.current === controller) syncRun.current = null;
      }
    }

    sync();
    return () => {
      controller.abort();
      if (syncRun.current === controller) syncRun.current = null;
    };
  }, [token, userId, key, revision]);

  const toggle = name => {
    if (token && syncRun.current) {
      showToast?.('즐겨찾기를 동기화하고 있어요. 잠시 후 다시 눌러주세요.');
      return;
    }
    const selected = !favorites.includes(name);
    const next = selected ? [...favorites, name] : favorites.filter(item => item !== name);
    if (next.length > MAX_FAVORITE_POINTS) {
      showToast?.(`즐겨찾는 포인트는 최대 ${MAX_FAVORITE_POINTS}곳까지 저장할 수 있어요.`);
      return;
    }
    writeStoredJson(key, next);
    setSaved(previous => ({ ...previous, [key]: next }));
    if (token) {
      const pending = pendingKey(userId);
      writeStoredJson(pending, { ...readStoredJson(pending, {}), [name]: selected });
      setRevision(value => value + 1);
    }
  };

  return { favorites, toggle, isFavorite: name => favorites.includes(name) };
}
