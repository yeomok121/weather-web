import React, { useState } from 'react';

function LoginCard({ onSignUpClick, onFindPasswordClick, loggedInUser, onLogin, onLogout }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleLogin = () => {
    if (!id || !pw) {
      alert('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const user = existingUsers.find(u => u.id === id && u.pw === pw);

    if (user) {
      // 💡 부모(App.jsx)에게 어떤 유저가 로그인했는지 알려줌!
      onLogin(user);
      setId('');
      setPw('');
    } else {
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  const cardStyle = {
    backgroundColor: '#ffffff', borderRadius: '12px', padding: '30px 20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center'
  };

  const inputStyle = {
    width: '80%', padding: '12px', marginBottom: '10px', 
    border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#333'
  };

  if (loggedInUser) {
    return (
      <div style={{ ...cardStyle, justifyContent: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>👋</div>
        <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>
          <span style={{ color: '#3182ce' }}>{loggedInUser.name}</span>님, 환영합니다!
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>오늘도 기분 좋은 하루 보내세요.</p>
        <button 
          onClick={onLogout} 
          style={{ width: '85%', padding: '12px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>로그인</h2>
      
      <input type="text" placeholder="아이디" value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
      <input type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={{ ...inputStyle, marginBottom: '20px' }} />
      
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