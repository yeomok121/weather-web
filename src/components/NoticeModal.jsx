import React from 'react';

function NoticeModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📢 시스템 공지사항</h2>
          {/* 전달받은 onClose 함수를 실행하여 팝업을 닫습니다. */}
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
          <li style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}><span style={{ fontWeight: 'bold', color: '#e53e3e', marginRight: '5px' }}>[긴급]</span> 태풍 북상에 따른 기상 특보 연동 안내<div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>2026.10.07</div></li>
          <li style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}><span style={{ fontWeight: 'bold', color: '#3182ce', marginRight: '5px' }}>[점검]</span> 기상청 API 서버 정기 점검 안내 (10/10)<div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>2026.10.03</div></li>
          <li><span style={{ fontWeight: 'bold', color: '#3182ce', marginRight: '5px' }}>[안내]</span> 관심 지역 등록이 최대 5개로 확장되었습니다.<div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>2026.09.28</div></li>
        </ul>
      </div>
    </div>
  );
}

export default NoticeModal;