import React, { useEffect, useRef, useState } from 'react';
import { FiLock, FiX } from 'react-icons/fi';
import { requestJson } from '../lib/apiClient';
import { newPasswordError, newPasswordHint } from './passwordPolicy';
import './SignUpModal.css';

export default function RecoveryDialog({ account, onClose, onUseCurrentPassword, onRecovered }) {
  const dialog = useRef(null);
  const token = account?.accessToken;
  const [available, setAvailable] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [identity, setIdentity] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const modal = dialog.current;
    modal.showModal();
    return () => modal.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    requestJson('/api/auth/recovery/status', { signal }).then(async status => {
      if (status.available && token) {
        const data = await requestJson('/api/auth/recovery/email', { signal, headers: { Authorization: `Bearer ${token}` } });
        if (!signal.aborted) setRegisteredEmail(data.email || '');
      }
      if (!signal.aborted) setAvailable(status.available);
    }).catch(error => {
      if (!signal.aborted) { setAvailable(false); setError(error.message); }
    });
    return () => controller.abort();
  }, [token]);

  const send = (path, body) => requestJson(`/api/auth/recovery/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    const target = identity.trim();
    if (codeSent && !token) {
      const validation = newPasswordError(target, password);
      if (validation || password !== confirmation) {
        setError(validation || '새 비밀번호가 일치하지 않습니다.');
        return;
      }
    }
    setBusy(true);
    try {
      if (!codeSent) {
        const result = await (token
          ? send('email', { email: target, current_password: currentPassword })
          : send('request', { username: target }));
        setCurrentPassword('');
        setCodeSent(true);
        setNotice(result.message);
      } else if (token) {
        const data = await send('email/verify', { code: code.trim() });
        setRegisteredEmail(data.email);
        setCodeSent(false);
        setIdentity('');
        setCode('');
        setNotice('복구 이메일이 확인되었습니다.');
      } else {
        const data = await send('reset', { username: target, code: code.trim(), new_password: password });
        onRecovered(data.message);
        onClose();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialog} className="signup-dialog recovery-dialog" aria-labelledby="recovery-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <header className="signup-heading">
        <span className="signup-symbol"><FiLock aria-hidden="true" /></span>
        <div><h2 id="recovery-title">{token ? '복구 이메일 관리' : '비밀번호 찾기'}</h2></div>
        <button className="signup-close" type="button" aria-label="닫기" disabled={busy} onClick={onClose}><FiX aria-hidden="true" /></button>
      </header>
      {available === null && <p className="recovery-message" role="status">복구 기능을 확인하고 있어요.</p>}
      {available === false && !error && <p className="recovery-message" role="status">이메일 계정 복구를 준비 중입니다.</p>}
      {available && <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          {token && registeredEmail && <p className="recovery-message"><strong>확인된 이메일</strong><span>{registeredEmail}</span></p>}
          <label className="signup-field">{token ? '복구 이메일 주소' : '아이디'}
            <input required readOnly={codeSent} type={token ? 'email' : 'text'}
              autoComplete={token ? 'email' : 'username'} value={identity} onChange={event => setIdentity(event.target.value)} />
          </label>
          {token && !codeSent && <label className="signup-field">현재 비밀번호
            <input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
          </label>}
          {codeSent && <label className="signup-field">이메일 확인 코드
            <input required autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} />
          </label>}
          {codeSent && !token && <>
            <label className="signup-field">새 비밀번호
              <input required type="password" autoComplete="new-password" aria-describedby="recovery-password-hint" value={password} onChange={event => setPassword(event.target.value)} />
              <p id="recovery-password-hint">{newPasswordHint}</p>
            </label>
            <label className="signup-field">새 비밀번호 확인
              <input required type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </label>
          </>}
          <button className="signup-submit" type="submit">{busy ? '처리 중…' : codeSent ? (token ? '이메일 확인' : '비밀번호 재설정') : '코드 보내기'}</button>
          {codeSent && <button type="button" onClick={() => { setCodeSent(false); setCode(''); setNotice(''); setError(''); }}>다시 요청하기</button>}
        </fieldset>
      </form>}
      {notice && <p className="recovery-message" role="status">{notice}</p>}
      {error && <p role="alert" className="signup-error">{error}</p>}
      {!token && <button className="recovery-password-option" type="button" disabled={busy} onClick={onUseCurrentPassword}>현재 비밀번호로 변경하기</button>}
    </dialog>
  );
}
