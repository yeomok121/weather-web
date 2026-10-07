import React from 'react';

function LoginCard() {
  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '30px 20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  // 입력창 공통 스타일 (연한 회색 배경 적용)
  const inputStyle = {
    width: '80%', 
    padding: '12px', 
    marginBottom: '10px', 
    border: '1px solid #e2e8f0', 
    borderRadius: '6px',
    backgroundColor: '#f1f5f9', /* 연한 회색 배경 */
    color: '#333' /* 입력 글씨 검은색으로 고정 */
  };

  return (
    <div style={cardStyle}>
      {/* 제목 글씨 색상을 #333(진한 회색/검정)으로 명시하여 보이게 수정 */}
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>로그인</h2>
      
      <input type="text" placeholder="아이디" style={inputStyle} />
      <input type="password" placeholder="비밀번호" style={{ ...inputStyle, marginBottom: '20px' }} />
      
      <button style={{ width: '85%', padding: '12px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
        로그인
      </button>
      <p style={{ margin: '0', fontSize: '12px', color: '#666', cursor: 'pointer' }}>비밀번호 찾기</p>
      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#3182ce', cursor: 'pointer' }}>회원가입</p>
    </div>
  );
}

export default LoginCard;