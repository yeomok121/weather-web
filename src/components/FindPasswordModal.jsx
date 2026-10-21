import React, { useState } from 'react';
import { API } from '../config';

function FindPasswordModal({ onClose }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!id.trim() || !name.trim() || !newPw || !newPwConfirm) {
      alert('모든 정보를 입력해 주세요.');
      return;
    }
    if (newPw.length < 4) {
      alert('새 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    if (newPw !== newPwConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id.trim(), name: name.trim(), new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '비밀번호 변경에 실패했습니다.');
        return;
      }
      alert('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
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
          <h2 style={{ margin: 0, fontSize: '20px' }}>비밀번호 찾기</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
          가입 시 등록한 아이디와 이름이 일치하면<br />새 비밀번호로 변경할 수 있어요.
        </p>

        <input type="text" placeholder="아이디" value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="새 비밀번호 (4자 이상)" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inputStyle} />
        <input
          type="password" placeholder="새 비밀번호 확인" value={newPwConfirm}
          onChange={(e) => setNewPwConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleReset()}
          style={inputStyle}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#718096' : '#1a365d', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {loading ? '변경 중...' : '비밀번호 변경하기'}
        </button>
      </div>
    </div>
  );
}

export default FindPasswordModal;