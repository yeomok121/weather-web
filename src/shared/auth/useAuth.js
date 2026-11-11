// 공통: 로그인 상태, 로그인·로그아웃, 내 정보 수정, 회원 탈퇴
import { useEffect, useState } from 'react';
import { API } from '../lib/config';
import { requestJson } from '../lib/apiClient';
import { readStoredJson, writeStoredJson } from '../lib/browserStorage';

export function useAuth(showToast) {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(0);

  useEffect(() => {
    const savedUser = readStoredJson('loggedInUser', null);
    if (typeof savedUser?.accessToken === 'string' && typeof savedUser?.id === 'string') setLoggedInUser(savedUser);
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
  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
    showToast('로그아웃 되었습니다.');
  };

  const handleUpdateUser = async ({ name, currentPassword, newPassword }) => {
    try {
      const res = await fetch(`${API}/api/users/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser.id, current_password: currentPassword, name, new_password: newPassword || null }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || '정보 수정에 실패했습니다.'); return false; }
      const updated = { ...loggedInUser, name: data.name };
      localStorage.setItem('loggedInUser', JSON.stringify(updated));
      setLoggedInUser(updated);
      if (newPassword) { localStorage.removeItem('loggedInUser'); setLoggedInUser(null); showToast('비밀번호가 변경되어 다시 로그인해 주세요.'); }
      else showToast('내 정보가 성공적으로 수정되었습니다.');
      return true;
    } catch {
      alert('서버에 연결할 수 없습니다.'); return false;
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
