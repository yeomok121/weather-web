import React, { useRef, useState } from 'react';
import { requestJson } from '../lib/apiClient';
import { writeStoredJson } from '../lib/browserStorage';

function SignUpModal({ onClose, onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idCheck, setIdCheck] = useState({ status: 'idle', username: '' });
  const checkSequence = useRef(0);

  const checkUsername = async () => {
    const username = id.trim();
    if (username.length < 4 || username.length > 80) {
      setIdCheck({ status: 'invalid', username }); return;
    }
    const sequence = ++checkSequence.current;
    setIdCheck({ status: 'checking', username });
    try {
      const data = await requestJson(`/api/auth/username-availability?username=${encodeURIComponent(username)}`, { timeoutMs: 20000 });
      if (sequence === checkSequence.current) setIdCheck({ status: data.available ? 'available' : 'taken', username: data.username });
    } catch {
      if (sequence === checkSequence.current) setIdCheck({ status: 'error', username });
    }
  };

  const handleSignUp = async () => {
    const username = id.trim();
    if (!username || !pw || !pwConfirm || !name.trim()) {
      alert('모든 정보를 빠짐없이 입력해 주세요.');
      return;
    }
    if (username.length < 4 || username.length > 80 || pw.length < 4) {
      alert('아이디와 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    if (idCheck.status !== 'available' || idCheck.username !== username) {
      setError('아이디 중복 확인을 먼저 진행해 주세요.'); return;
    }
    if (pw.normalize('NFKC').toLowerCase().includes(username.normalize('NFKC').toLowerCase())) {
      setError('비밀번호에 아이디를 포함할 수 없습니다.'); return;
    }
    if (pw !== pwConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setError('');
    let accountCreated = false;
    try {
      await requestJson('/api/signup', {
        method: 'POST', timeoutMs: 20000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw, name: name.trim() }),
      });
      accountCreated = true;

      // 새 유저 전용 관심 지역에 '부천시'를 기본으로 설정 (기존 기능 유지)
      const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
      writeStoredJson(`favorites_${username}`, defaultFav);

      // Sign in immediately so the new account can use cross-device favorites at once.
      const loginData = await requestJson('/api/login', {
        method: 'POST', timeoutMs: 20000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw }),
      });
      onLogin({ id: loginData.username, name: loginData.name, accessToken: loginData.access_token });
      alert(`${name}님, 환영합니다! 회원가입과 로그인이 완료되었습니다.`);
      onClose();
    } catch (e) {
      if (!accountCreated && e.status === 409) setIdCheck({ status: 'taken', username });
      setError(accountCreated ? '회원가입은 완료됐습니다. 자동 로그인에 실패했으니 창을 닫고 로그인해 주세요.' : `${e.message} 응답이 끊겼다면 로그인으로 가입 여부를 먼저 확인해 주세요.`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px', marginBottom: '15px',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    backgroundColor: '#f1f5f9', color: '#333', boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div role="dialog" aria-modal="true" aria-label="회원가입" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '15px', width: 'min(400px, calc(100vw - 32px))', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>회원가입</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <input type="text" aria-label="아이디" autoComplete="username" maxLength={80} placeholder="아이디 (4~80자)" value={id} onChange={(e) => { checkSequence.current += 1; setId(e.target.value); setIdCheck({ status: 'idle', username: '' }); setError(''); }} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
          <button type="button" disabled={loading || idCheck.status === 'checking'} onClick={checkUsername} style={{ padding: '12px', whiteSpace: 'nowrap', border: '1px solid #94a3b8', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>{idCheck.status === 'checking' ? '확인 중...' : '중복 확인'}</button>
        </div>
        {idCheck.status !== 'idle' && <p role="status" style={{ margin: '-8px 0 12px', fontSize: '13px', color: idCheck.status === 'available' ? '#166534' : '#b91c1c' }}>{({ checking: '아이디를 확인하고 있습니다.', available: '사용할 수 있는 아이디입니다.', taken: '이미 사용 중인 아이디입니다.', invalid: '아이디는 4~80자로 입력해 주세요.', error: '중복 확인에 실패했습니다. 다시 시도해 주세요.' })[idCheck.status]}</p>}
        <input type="password" placeholder="비밀번호 (4자 이상)" value={pw} onChange={(e) => setPw(e.target.value)} style={inputStyle} />
        <p style={{ margin: '-8px 0 12px', fontSize: '12px', color: '#475569' }}>비밀번호에는 아이디를 포함할 수 없습니다.</p>
        <input type="password" placeholder="비밀번호 확인" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        {error && <p role="alert" style={{ color: '#b91c1c', fontSize: '14px', lineHeight: 1.6 }}>{error}</p>}

        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#a0aec0' : '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px' }}
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </div>
    </div>
  );
}

export default SignUpModal;
