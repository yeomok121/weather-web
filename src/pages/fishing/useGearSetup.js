// 낚시 페이지: 계정별 '내 준비물' 세팅
// 로그인하면 계정에서 받아오고(어느 기기든 같은 세팅), 빨리 보이도록 이 브라우저에도 사본을 둡니다.
// 저장은 서버가 받아 준 뒤에만 화면에 반영합니다. (실패하면 편집 창을 그대로 둡니다)
import { useEffect, useRef, useState } from 'react';
import { readStoredJson, writeStoredJson } from '../../shared/lib/browserStorage';
import { fetchMyFishingGear, saveMyFishingGear } from './fishingApi';
import { EMPTY_GEAR_SETUP, cleanGearSetup } from './lib/gear';

const cacheKey = (userId) => `fishing:gear-setup:${userId}`;

export function useGearSetup({ loggedInUser, showToast }) {
  const userId = loggedInUser?.id || '';
  const token = loggedInUser?.accessToken || '';
  const key = cacheKey(userId);
  const [saved, setSaved] = useState({});
  const toastRef = useRef(showToast);
  useEffect(() => { toastRef.current = showToast; });

  const setup = !token ? EMPTY_GEAR_SETUP : saved[key] ?? cleanGearSetup(readStoredJson(key, null));

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    fetchMyFishingGear(token, { signal: controller.signal }).then((body) => {
      if (controller.signal.aborted) return;
      const account = cleanGearSetup(body);
      writeStoredJson(key, account);
      setSaved((previous) => ({ ...previous, [key]: account }));
    }).catch(() => {
      if (!controller.signal.aborted) toastRef.current?.('내 준비물을 계정에서 불러오지 못했어요. 이 브라우저에 있던 목록을 보여줍니다.');
    });
    return () => controller.abort();
  }, [token, key]);

  const save = async (next) => {
    if (!token) return false;
    try {
      const body = await saveMyFishingGear(token, cleanGearSetup(next));
      const account = cleanGearSetup(body);
      writeStoredJson(key, account);
      setSaved((previous) => ({ ...previous, [key]: account }));
      showToast?.('내 준비물을 계정에 저장했어요. 다른 기기에서 로그인해도 볼 수 있어요.');
      return true;
    } catch (error) {
      showToast?.(error?.message && /[가-힣]/.test(error.message) ? error.message : '내 준비물을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
      return false;
    }
  };

  return { setup, save, isLoggedIn: Boolean(token) };
}
