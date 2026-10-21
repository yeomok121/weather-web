import React, { useState } from 'react';
import { API } from '../config';

function SignUpModal({ onClose }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!id || !pw || !pwConfirm || !name) {
      alert('모든 정보를 빠짐없이 입력해 주세요.');
      return;
    }
    if (id.length < 4 || pw.length < 4) {
      alert('아이디와 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    if (pw !== pwConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password: pw, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '회원가입에 실패했습니다.');
        return;
      }

      // 새 유저 전용 관심 지역에 '부천시'를 기본으로 설정 (기존 기능 유지)
      const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
      localStorage.setItem(`favorites_${id}`, JSON.stringify(defaultFav));

      alert(`${name}님, 환영합니다! 회원가입이 완료되었습니다.`);
      onClose();
    } catch (e) {
      alert('서버에 연결할 수 없습니다. 백엔드 서버가 켜져 있는지 확인해 주세요.');
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
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>회원가입</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>

        <input type="text" placeholder="아이디 (4자 이상)" value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="비밀번호 (4자 이상)" value={pw} onChange={(e) => setPw(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="비밀번호 확인" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

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