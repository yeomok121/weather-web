// 공통: 관심 지역 목록(최대 5곳). 로그인 전에는 이 브라우저에, 로그인 후에는 계정에 저장합니다.
import { useEffect, useEffectEvent, useState } from 'react';
import { requestJson } from '../lib/apiClient';

// onLocationReady(location): 관심 지역 목록을 처음 보여줄 때 첫 번째 지역으로 호출됩니다.
// (App.jsx가 이 지역 또는 주소의 산으로 날씨를 불러옵니다.)
export function useFavorites({ loggedInUser, setLoggedInUser, showToast, onLocationReady }) {
  const [favorites, setFavorites] = useState([]);

  const initializeFavorites = useEffectEvent((isCancelled) => {
    const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
    const getStoredList = (key) => {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(stored) ? stored : [];
      } catch {
        return [];
      }
    };
    if (loggedInUser) {
      const userKey = `favorites_${loggedInUser.id}`;
      const pendingKey = `favorites_pending_${loggedInUser.id}`;
      const localAccountFavorites = getStoredList(userKey);
      const guestFavorites = getStoredList('guestFavorites');
      const hasPendingSync = localStorage.getItem(pendingKey) !== null;
      const pendingFavorites = getStoredList(pendingKey);
      const showFallback = (items) => {
        if (isCancelled()) return;
        const visible = items.length ? items : defaultFav;
        setFavorites(visible);
        onLocationReady(visible[0]);
      };
      showFallback(hasPendingSync ? pendingFavorites : (localAccountFavorites.length ? localAccountFavorites : guestFavorites));
      const syncFavorites = async () => {
        try {
          const serverFavorites = await requestJson('/api/users/me/favorites', {
            headers: { Authorization: `Bearer ${loggedInUser.accessToken}` },
          });
          const serverList = serverFavorites.map(item => ({ ...item, lat: Number(item.lat), lon: Number(item.lon) }));
          const baseFavorites = hasPendingSync ? pendingFavorites : (serverList.length ? serverList : localAccountFavorites);
          const guestOnlyFavorites = guestFavorites.filter(guest => !baseFavorites.some(saved => saved.name === guest.name));
          const allFavorites = [...baseFavorites, ...guestOnlyFavorites];
          const mergedFavorites = allFavorites.slice(0, 5);
          const remainingGuestFavorites = allFavorites.slice(5);
          const needsUpload = hasPendingSync || guestFavorites.length > 0 || serverList.length !== mergedFavorites.length || (!serverList.length && localAccountFavorites.length > 0);
          if (needsUpload) {
            await requestJson('/api/users/me/favorites', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loggedInUser.accessToken}` },
              body: JSON.stringify({ favorites: mergedFavorites }),
            });
          }
          if (isCancelled()) return;
          localStorage.setItem(userKey, JSON.stringify(mergedFavorites));
          localStorage.removeItem(pendingKey);
          if (remainingGuestFavorites.length) localStorage.setItem('guestFavorites', JSON.stringify(remainingGuestFavorites));
          else localStorage.removeItem('guestFavorites');
          setFavorites(mergedFavorites.length ? mergedFavorites : defaultFav);
          // Keep the weather the user is viewing while account sync completes.
          if (remainingGuestFavorites.length) showToast('계정에는 관심 지역 5곳을 저장했고, 나머지는 이 브라우저에 남겨뒀어요.');
          else if (guestFavorites.length) showToast('이 기기의 관심 지역을 계정에 저장했어요.');
        } catch (error) {
          if (isCancelled()) return;
          if (error.status === 401) {
            const recoverable = hasPendingSync ? pendingFavorites : (localAccountFavorites.length ? localAccountFavorites : guestFavorites);
            if (recoverable.length && !guestFavorites.length) localStorage.setItem('guestFavorites', JSON.stringify(recoverable));
            localStorage.removeItem('loggedInUser');
            setLoggedInUser(null);
            showToast('로그인 정보가 만료되어 관심 지역을 이 브라우저에 보관했어요. 다시 로그인해주세요.');
            return;
          }
          showToast('계정 동기화에 실패해 이 브라우저의 관심 지역을 표시합니다.');
        }
      };
      syncFavorites();
    } else {
      const guestFavorites = getStoredList('guestFavorites');
      setFavorites(guestFavorites);
      const initialLocation = guestFavorites[0] || defaultFav[0];
      onLocationReady(initialLocation);
    }
  });
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) initializeFavorites(() => cancelled); });
    return () => { cancelled = true; };
  }, [loggedInUser?.id, loggedInUser?.accessToken]);

  const saveFavorites = async (newFavs) => {
    setFavorites(newFavs);
    const user = loggedInUser;
    localStorage.setItem(user ? `favorites_${user.id}` : 'guestFavorites', JSON.stringify(newFavs));
    if (!user?.accessToken) return true;
    const pendingKey = `favorites_pending_${user.id}`;
    try {
      await requestJson('/api/users/me/favorites', { method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.accessToken}` },
        body: JSON.stringify({ favorites: newFavs }),
      });
      localStorage.removeItem(pendingKey);
      return true;
    } catch (error) {
      localStorage.setItem(pendingKey, JSON.stringify(newFavs));
      if (error.status === 401) {
        localStorage.setItem('guestFavorites', JSON.stringify(newFavs));
        localStorage.removeItem('loggedInUser'); setLoggedInUser(null);
        showToast('로그인 정보가 만료되었습니다. 변경 내용은 이 브라우저에 보관했어요.');
      }
      return false;
    }
  };

  return { favorites, saveFavorites };
}
