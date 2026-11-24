import React, { useEffect, useRef, useState } from 'react';
import { requestJson } from '../lib/apiClient';
import { writeStoredJson } from '../lib/browserStorage';
import { FiUserPlus, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import './SignUpModal.css';
import { newPasswordError, newPasswordHint } from './passwordPolicy';

const usernameHint = '영문과 숫자를 모두 포함한 4~20자 (예: weather25)';
const validUsername = value => /^[A-Za-z0-9]{4,20}$/.test(value) && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
const idMessages = {
  checking: '아이디를 확인하고 있습니다.',
  available: '사용할 수 있는 아이디입니다.',
  taken: '이미 사용 중인 아이디입니다.',
  invalid: usernameHint,
  error: '중복 확인에 실패했습니다. 다시 시도해 주세요.',
};

function SignUpModal({ onClose, onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idCheck, setIdCheck] = useState({ status: 'idle', username: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  const checkSequence = useRef(0);

  const checkUsername = async () => {
    const username = id.trim();
    if (!validUsername(username)) {
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

  const handleSignUp = async event => {
    event.preventDefault();
    if (loading) return;
    const username = id.trim();
    if (!username || !pw || !pwConfirm || !name.trim()) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }
    if (!validUsername(username)) {
      setError(usernameHint);
      return;
    }
    const passwordError = newPasswordError(username, pw);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (idCheck.status !== 'available' || idCheck.username !== username) {
      setError('아이디 중복 확인을 먼저 진행해 주세요.'); return;
    }
    if (pw !== pwConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
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
      onLogin({ id: loginData.username, memberId: loginData.user_id, name: loginData.name, accessToken: loginData.access_token });
      onClose();
    } catch (e) {
      if (!accountCreated && e.status === 409) setIdCheck({ status: 'taken', username });
      setError(accountCreated ? '회원가입은 완료됐습니다. 자동 로그인에 실패했으니 창을 닫고 로그인해 주세요.' : `${e.message} 응답이 끊겼다면 로그인으로 가입 여부를 먼저 확인해 주세요.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="signup-dialog" aria-labelledby="signup-title"
      onCancel={event => { event.preventDefault(); if (!loading) onClose(); }}>
      <header className="signup-heading">
        <span className="signup-symbol"><FiUserPlus aria-hidden="true" /></span>
        <div><h2 id="signup-title">회원가입</h2><p>관심 지역과 일정을 계정에 저장할 수 있어요.</p></div>
        <button type="button" className="signup-close" aria-label="회원가입 닫기" disabled={loading} onClick={onClose}><FiX aria-hidden="true" /></button>
      </header>
      <form onSubmit={handleSignUp} aria-busy={loading}>
        <fieldset disabled={loading}>
          <div className="signup-field">
            <label htmlFor="signup-id">아이디</label>
            <div className="signup-input-row">
              <input id="signup-id" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
                aria-describedby="signup-id-hint signup-id-status" aria-invalid={idCheck.status === 'invalid' || idCheck.status === 'taken'}
                maxLength={20} value={id} onChange={event => {
                  checkSequence.current += 1;
                  setId(event.target.value);
                  setIdCheck({ status: 'idle', username: '' });
                  setError('');
                }} />
              <button type="button" onClick={checkUsername} disabled={idCheck.status === 'checking'}>중복 확인</button>
            </div>
            <p id="signup-id-hint">{usernameHint}</p>
            <p id="signup-id-status" role="status" data-status={idCheck.status}>{idMessages[idCheck.status]}</p>
          </div>
          <div className="signup-field">
            <label htmlFor="signup-password">비밀번호</label>
            <div className="signup-input-row">
              <input id="signup-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password"
                aria-describedby="signup-password-hint" value={pw} onChange={event => setPw(event.target.value)} />
              <button type="button" aria-label="비밀번호 표시" aria-pressed={showPasswords} onClick={() => setShowPasswords(value => !value)}>
                {showPasswords ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
            <p id="signup-password-hint">{newPasswordHint}</p>
          </div>
          <label className="signup-field">비밀번호 확인
            <input type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={pwConfirm} onChange={event => setPwConfirm(event.target.value)} />
          </label>
          <label className="signup-field">이름
            <input type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} />
          </label>
          {error && <p className="signup-error" role="alert">{error}</p>}
          <button type="submit" className="signup-submit">{loading ? '가입 중…' : '가입하기'}</button>
        </fieldset>
      </form>
    </dialog>
  );
}

export default SignUpModal;
