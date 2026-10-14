import React, { useState } from 'react';

function SignUpModal({ onClose }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = () => {
    if (!id || !pw || !pwConfirm || !name) {
      alert('모든 정보를 빠짐없이 입력해 주세요.');
      return;
    }
    if (pw !== pwConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];

    if (existingUsers.some(user => user.id === id)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    // 새 회원을 DB에 저장
    existingUsers.push({ id, pw, name });
    localStorage.setItem('users', JSON.stringify(existingUsers));

    // 💡 새 유저가 가입하면, 그 유저 전용 관심 지역에 '부천시'를 하나 기본으로 깔아줍니다!
    const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
    localStorage.setItem(`favorites_${id}`, JSON.stringify(defaultFav));

    alert(`${name}님, 환영합니다! 회원가입이 완료되었습니다.`);
    onClose();
  };

  const inputStyle = {
    width: '100%', padding: '12px', marginBottom: '15px',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    backgroundColor: '#f1f5f9', color: '#333', boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>회원가입</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>
        
        <input type="text" placeholder="아이디" value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="비밀번호 확인" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        
        <button 
          onClick={handleSignUp}
          style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
        >
          가입하기
        </button>
      </div>
    </div>
  );
}

export default SignUpModal;