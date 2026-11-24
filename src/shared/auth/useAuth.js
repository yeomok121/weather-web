// 공통: 로그인 상태, 로그인·로그아웃, 내 정보 수정, 회원 탈퇴
import { useEffect, useEffectEvent, useState } from 'react';
import { MEMBER_SESSION_EXPIRED, requestJson } from '../lib/apiClient';
import { readStoredJson, writeStoredJson } from '../lib/browserStorage';

export function useAuth(showToast) {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = readStoredJson('loggedInUser', null);
    return typeof saved?.accessToken === 'string' && typeof saved?.id === 'string' ? saved : null;
  });
  const [loginPrompt, setLoginPrompt] = useState(0);

  const clearSession = (token) => {
    if (readStoredJson('loggedInUser', null)?.accessToken === token) localStorage.removeItem('loggedInUser');
    setLoggedInUser(current => current?.accessToken === token ? null : current);
  };
  const onExpired = useEffectEvent((event) => {
    if (readStoredJson('loggedInUser', null)?.accessToken !== event.detail) return;
    clearSession(event.detail);
    showToast('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.');
  });
  useEffect(() => {
    const listener = event => onExpired(event);
    window.addEventListener(MEMBER_SESSION_EXPIRED, listener);
    return () => window.removeEventListener(MEMBER_SESSION_EXPIRED, listener);
  }, []);

  const handleLogin = (user) => {
    const guestFavorites = readStoredJson('guestFavorites', []).filter(item => item?.name);
    const accountKey = `favorites_${user.id}`;
    const accountFavorites = readStoredJson(accountKey, []).filter(item => item?.name);
    const mergedFavorites = [...accountFavorites, ...guestFavorites.filter(guest => !accountFavorites.some(saved => saved.name === guest.name))].slice(0, 5);
    if (mergedFavorites.length) writeStoredJson(accountKey, mergedFavorites);
    setLoggedInUser(user);
    writeStoredJson('loggedInUser', user);
    showToast('로그인되었습니다. 관심 지역을 계정과 동기화하고 있어요.');
  };
  const handleLogout = async () => {
    const token = loggedInUser?.accessToken;
    if (!token) return;
    try {
      await requestJson('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      clearSession(token);
      showToast('로그아웃 되었습니다.');
    } catch (error) {
      if (error.status !== 401) showToast('로그아웃을 완료하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
    }
  };

  const handleUpdateUser = async ({ name, currentPassword, newPassword }) => {
    const account = loggedInUser;
    try {
      const data = await requestJson('/api/users/update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: account.id, current_password: currentPassword, name, new_password: newPassword || null }),
      });
      if (newPassword) {
        clearSession(account.accessToken);
        showToast('비밀번호가 변경되어 다시 로그인해 주세요.');
      } else if (readStoredJson('loggedInUser', null)?.accessToken === account.accessToken) {
        const updated = { ...account, name: data.name };
        writeStoredJson('loggedInUser', updated);
        setLoggedInUser(updated);
        showToast('내 정보가 성공적으로 수정되었습니다.');
      }
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const handleDeleteAccount = async (password) => {
    if (!loggedInUser) throw new Error('로그인 상태를 확인해 주세요.');
    const account = loggedInUser;
    await requestJson('/api/users/delete', {
      method: 'POST', timeoutMs: 20000, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.id, password }),
    });
    try {
      localStorage.removeItem(`favorites_${account.id}`);
      localStorage.removeItem(`favorites_pending_${account.id}`);
      localStorage.removeItem(`hiking:last-party:${account.id}`);
      localStorage.removeItem(`fishing:favorite-points:${account.id}`);
      localStorage.removeItem(`fishing:favorite-points:pending:${account.id}`);
      localStorage.removeItem(`fishing:gear-setup:${account.id}`);
      localStorage.removeItem(`fishing:gear-checked:v1:member:${account.memberId ?? account.id}`);
      Object.keys(localStorage).filter(key => key.startsWith(`hiking:draft:${account.id}:`)).forEach(key => localStorage.removeItem(key));
      const saved = readStoredJson('loggedInUser', null);
      if (saved?.accessToken === account.accessToken) localStorage.removeItem('loggedInUser');
    } catch { /* Account deletion has already succeeded on the server. */ }
    setLoggedInUser(current => current?.accessToken === account.accessToken ? null : current);
    showToast('회원 탈퇴가 완료되었습니다.');
  };

  // 로그인 카드로 스크롤하며 로그인을 요청할 때 사용합니다.
  const promptLogin = () => setLoginPrompt(value => value + 1);

  return {
    loggedInUser, setLoggedInUser, loginPrompt, promptLogin,
    handleLogin, handleLogout, handleUpdateUser, handleDeleteAccount,
  };
}
