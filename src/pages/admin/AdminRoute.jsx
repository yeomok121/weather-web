// 관리자 페이지 ( /admin )
// 들어올 때 관리자 권한을 확인합니다.
//   로그인한 상태면 계정 토큰으로, 아니면 관리자 비밀번호로 확인합니다.
import { useEffect, useEffectEvent, useState } from 'react';
import { API } from '../../shared/lib/config';
import AdminPage from './AdminPage';

export default function AdminRoute({ loggedInUser, onExit }) {
  const [session, setSession] = useState(null); // { password, token, role }
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const denyAccess = useEffectEvent(message => { alert(message); onExit(); });
  const token = loggedInUser?.accessToken;
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/verify`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (controller.signal.aborted) return;
        if (res.status === 403) { denyAccess('관리자 권한이 없는 계정입니다.'); return; }
        if (!res.ok) { denyAccess('로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.'); return; }
        const data = await res.json();
        if (!controller.signal.aborted) setSession({ password: '', token, role: data.role });
      } catch { if (!controller.signal.aborted) denyAccess('관리자 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    })();
    return () => controller.abort();
  }, [token]);

  const handleAdminAuth = async () => {
    try {
      const res = await fetch(`${API}/api/admin/verify`, { method: 'POST', headers: { 'x-admin-password': adminPasswordInput } });
      if (!res.ok) { alert('비밀번호가 틀렸습니다. 접근 권한이 없습니다.'); setAdminPasswordInput(''); return; }
      const data = await res.json();
      setSession({ password: adminPasswordInput, token: '', role: data.role || 'superadmin' });
      setAdminPasswordInput('');
    } catch { alert('서버에 연결할 수 없습니다.'); }
  };

  if (session && (session.password ? !token : session.token === token)) {
    return <AdminPage adminPassword={session.password} adminToken={session.password ? '' : session.token} adminRole={session.role} onClose={() => { setSession(null); onExit(); }} />;
  }
  if (token) return <p role="status" className="weather-status-shell">관리자 권한을 확인하고 있습니다...</p>;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', width: '320px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>🔒 관리자 인증</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666' }}>관리자 권한 확인을 위해 비밀번호를 입력해 주세요.</p>
        <input type="password" placeholder="비밀번호 입력" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()} style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onExit} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
          <button onClick={handleAdminAuth} style={{ flex: 1, padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>확인</button>
        </div>
      </div>
    </div>
  );
}
