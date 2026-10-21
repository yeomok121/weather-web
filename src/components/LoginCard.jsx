import React, { useState } from 'react';

function LoginCard({ onSignUpClick, onFindPasswordClick, loggedInUser, onLogin, onLogout, onUpdateUser, onDeleteAccount }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  // 💡 내 정보 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPw, setEditPw] = useState('');
  const [editPwConfirm, setEditPwConfirm] = useState('');

  // 시간대별 환영 인사말
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return '상쾌한 아침이에요! 활기찬 하루 시작하세요 ☀️';
    if (hour >= 11 && hour < 17) return '오늘도 기분 좋은 오후 보내세요 🌤️';
    if (hour >= 17 && hour < 21) return '오늘 하루도 고생 많으셨어요! 편안한 저녁 되세요 🌇';
    return '포근하고 편안한 밤 보내세요 🌙';
  };

  const handleLogin = () => {
    if (!id || !pw) {
      alert('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const user = existingUsers.find(u => u.id === id && u.pw === pw);

    if (user) {
      onLogin(user);
      setId('');
      setPw('');
    } else {
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  // 내 정보 수정 창 열기
  const openEditMode = () => {
    setEditName(loggedInUser.name);
    setEditPw(loggedInUser.pw);
    setEditPwConfirm(loggedInUser.pw);
    setIsEditing(true);
  };

  // 내 정보 수정 저장하기
  const handleSaveProfile = () => {
    const trimmedName = editName.trim();
    const trimmedPw = editPw.trim();

    if (!trimmedName || !trimmedPw) {
      alert('이름과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (trimmedPw !== editPwConfirm.trim()) {
      alert('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (onUpdateUser) {
      onUpdateUser({ ...loggedInUser, name: trimmedName, pw: trimmedPw });
    }
    setIsEditing(false);
  };

  const cardStyle = {
    backgroundColor: '#ffffff', borderRadius: '16px', padding: '26px 20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box'
  };

  const inputStyle = {
    width: '85%', padding: '11px 12px', marginBottom: '10px', 
    border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#333', boxSizing: 'border-box', fontSize: '13px'
  };

  // 1) 로그인된 상태
  if (loggedInUser) {
    // 1-A) 내 정보 수정 화면
    if (isEditing) {
      return (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 14px 0', color: '#1e293b', fontSize: '16px' }}>⚙️ 내 정보 수정</h3>
          
          <div style={{ width: '85%', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>아이디 (변경 불가)</div>
          <input type="text" value={loggedInUser.id} disabled style={{ ...inputStyle, backgroundColor: '#e2e8f0', color: '#64748b', cursor: 'not-allowed' }} />

          <div style={{ width: '85%', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>이름</div>
          <input type="text" placeholder="이름" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />

          <div style={{ width: '85%', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>새 비밀번호</div>
          <input type="password" placeholder="새 비밀번호" value={editPw} onChange={(e) => setEditPw(e.target.value)} style={inputStyle} />

          <div style={{ width: '85%', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>새 비밀번호 확인</div>
          <input type="password" placeholder="새 비밀번호 확인" value={editPwConfirm} onChange={(e) => setEditPwConfirm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()} style={{ ...inputStyle, marginBottom: '16px' }} />

          <div style={{ display: 'flex', gap: '8px', width: '85%' }}>
            <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              취소
            </button>
            <button onClick={handleSaveProfile} style={{ flex: 1, padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              저장하기
            </button>
          </div>

          {onDeleteAccount && (
            <button 
              onClick={onDeleteAccount}
              style={{ marginTop: '14px', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              회원 탈퇴하기
            </button>
          )}
        </div>
      );
    }

    // 1-B) 기본 환영 화면
    return (
      <div style={{ ...cardStyle, justifyContent: 'center' }}>
        <div style={{ fontSize: '38px', marginBottom: '8px' }}>👋</div>
        <h2 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '18px' }}>
          <span style={{ color: '#3182ce' }}>{loggedInUser.name}</span>님, 환영합니다!
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', textAlign: 'center', wordBreak: 'keep-all' }}>
          {getTimeGreeting()}
        </p>
        <div style={{ display: 'flex', gap: '8px', width: '88%' }}>
          <button 
            onClick={openEditMode} 
            style={{ flex: 1, padding: '11px 0', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            ⚙️ 정보 수정
          </button>
          <button 
            onClick={onLogout} 
            style={{ flex: 1, padding: '11px 0', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 2) 비로그인 상태
  return (
    <div style={cardStyle}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px' }}>로그인</h2>
      
      <input type="text" placeholder="아이디" value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
      <input type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={{ ...inputStyle, marginBottom: '16px' }} />
      
      <button 
        onClick={handleLogin}
        style={{ width: '85%', padding: '12px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
      >
        로그인
      </button>
      
      <p onClick={onFindPasswordClick} style={{ margin: '0', fontSize: '12px', color: '#666', cursor: 'pointer' }}>비밀번호 찾기</p>
      <p onClick={onSignUpClick} style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#3182ce', cursor: 'pointer', fontWeight: 'bold' }}>회원가입</p>
    </div>
  );
}

export default LoginCard;