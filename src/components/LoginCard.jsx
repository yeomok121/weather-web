import React, { useState } from 'react';
import { FiUser, FiLock, FiLogOut, FiSettings, FiTrash2 } from 'react-icons/fi';
import { API } from '../config';

function LoginCard({ onSignUpClick, onFindPasswordClick, loggedInUser, onLogin, onLogout, onUpdateUser, onDeleteAccount }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        await onLogin({ id: data.username, name: data.name, accessToken: data.access_token });
        setUsername('');
        setPassword('');
      } else {
        alert(data.detail || '로그인 실패');
      }
    } catch (err) {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editCurrentPassword.trim()) {
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }
    const success = await onUpdateUser({
      name: editName,
      currentPassword: editCurrentPassword,
      newPassword: editNewPassword
    });
    if (success) {
      setIsEditMode(false);
      setEditCurrentPassword('');
      setEditNewPassword('');
    }
  };

  const handleEditOpen = () => {
    setEditName(loggedInUser.name);
    setEditCurrentPassword('');
    setEditNewPassword('');
    setIsEditMode(true);
  };

  // 💡 기존의 background: '#ffffff' 제거, transparent 적용
  if (loggedInUser) {
    return (
      <div style={{ padding: '24px', boxSizing: 'border-box', height: '100%', background: 'transparent' }}>
        {!isEditMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>내 정보</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#3182ce', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                {loggedInUser.name.charAt(0)}
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{loggedInUser.name} 님</p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>환영합니다!</p>
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleEditOpen} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', color: '#334155', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                <FiSettings size={14} /> 정보 수정
              </button>
              <button onClick={onLogout} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: '8px', color: '#e53e3e', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                <FiLogOut size={14} /> 로그아웃
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>정보 수정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input type="text" placeholder="이름 변경" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.7)' }} />
              <input type="password" placeholder="현재 비밀번호 (필수)" value={editCurrentPassword} onChange={(e) => setEditCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.7)' }} />
              <input type="password" placeholder="새 비밀번호 (선택)" value={editNewPassword} onChange={(e) => setEditNewPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.7)' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button type="button" onClick={() => setIsEditMode(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>취소</button>
              <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>저장</button>
            </div>
            <button type="button" onClick={onDeleteAccount} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#e53e3e', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <FiTrash2 size={12} /> 회원 탈퇴
            </button>
          </form>
        )}
      </div>
    );
  }

  if (!showLoginForm) {
    return (
      <div style={{ padding: '24px', boxSizing: 'border-box', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', margin: '0 auto 12px', borderRadius: '14px', color: '#176b63', background: 'rgba(23,107,99,0.1)', fontSize: '20px' }}>⛰️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: '#1e293b', textAlign: 'center' }}>먼저 둘러보세요</h3>
        <p style={{ margin: '0 auto 16px', maxWidth: '250px', fontSize: '13px', lineHeight: '1.55', color: '#526176', textAlign: 'center' }}>
          날씨와 산행 정보는 가입 없이 확인할 수 있어요. 자주 보는 지역은 관심 목록으로 모아보세요.
        </p>
        <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
          <div style={{ padding: '9px 11px', borderRadius: '10px', background: 'rgba(255,255,255,0.48)', color: '#334155', fontSize: '12px' }}>📍 관심 지역 최대 5곳을 한눈에 비교</div>
          <div style={{ padding: '9px 11px', borderRadius: '10px', background: 'rgba(255,255,255,0.48)', color: '#334155', fontSize: '12px' }}>☁️ 로그인하면 관심 지역을 계정에 저장해 다른 기기에서도 불러오기</div>
        </div>
        <button type="button" onClick={onSignUpClick} style={{ width: '100%', padding: '11px', border: '0', borderRadius: '9px', color: '#fff', background: '#176b63', fontWeight: '750', fontSize: '13px', cursor: 'pointer' }}>무료 계정 만들기</button>
        <button type="button" onClick={() => setShowLoginForm(true)} style={{ display: 'block', margin: '11px auto 0', padding: '5px 10px', border: '0', background: 'transparent', color: '#315b99', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>이미 계정이 있어요 · 로그인</button>
        <p style={{ margin: '10px 0 0', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>비회원 저장은 현재 브라우저에 보관됩니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', boxSizing: 'border-box', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>로그인</h3>
        <button type="button" onClick={() => setShowLoginForm(false)} style={{ border: '0', background: 'transparent', color: '#315b99', fontSize: '12px', cursor: 'pointer' }}>둘러보기</button>
      </div>
      <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <FiUser style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="아이디" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.7)', outline: 'none' }} 
            required 
          />
        </div>
        <div style={{ position: 'relative' }}>
          <FiLock style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.7)', outline: 'none' }} 
            required 
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '4px', boxShadow: '0 2px 4px rgba(30,58,138,0.2)' }}>
          로그인
        </button>
      </form>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
        <span onClick={onFindPasswordClick} style={{ cursor: 'pointer', hover: { color: '#3182ce' } }}>비밀번호 찾기</span>
        <span>|</span>
        <span onClick={onSignUpClick} style={{ cursor: 'pointer', color: '#3182ce', fontWeight: 'bold' }}>무료 회원가입</span>
      </div>
    </div>
  );
}

export default LoginCard;
