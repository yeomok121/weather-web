import React, { useEffect, useState } from 'react';

function NoticeModal({ onClose }) {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    // 임시 DB에서 공지사항을 가져옵니다 (없으면 기본 세팅값 표시)
    const defaultNotices = [
      { id: 1, type: '긴급', title: '태풍 북상에 따른 기상 특보 연동 안내', date: '2026.10.07', color: '#e53e3e' },
      { id: 2, type: '점검', title: '기상청 API 서버 정기 점검 안내 (10/10)', date: '2026.10.03', color: '#3182ce' },
      { id: 3, type: '안내', title: '관심 지역 등록이 최대 5개로 확장되었습니다.', date: '2026.09.28', color: '#3182ce' }
    ];
    const stored = JSON.parse(localStorage.getItem('notices')) || defaultNotices;
    setNotices(stored);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📢 시스템 공지사항</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto' }}>
          {notices.length === 0 && <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>등록된 공지사항이 없습니다.</p>}
          
          {notices.map(notice => (
            <li key={notice.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <span style={{ fontWeight: 'bold', color: notice.color, marginRight: '5px' }}>
                [{notice.type}]
              </span> 
              {notice.title}
              <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{notice.date}</div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}

export default NoticeModal;