import React from 'react';

function FindPasswordModal({ onClose }) {
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
          가입 시 등록한 아이디 또는 이메일을 입력해 주세요.<br/>임시 비밀번호를 발송해 드립니다.
        </p>
        
        <input type="text" placeholder="아이디 또는 이메일" style={inputStyle} />
        
        <button 
          onClick={() => { alert('입력하신 정보로 임시 비밀번호가 발송되었습니다.'); onClose(); }}
          style={{ width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          비밀번호 찾기
        </button>
      </div>
    </div>
  );
}

export default FindPasswordModal;