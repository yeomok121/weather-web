import React, { useEffect, useState } from 'react';
import { API } from '../config';

function NoticeModal({ onClose }) {
  const [notices, setNotices] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/notices`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (!cancelled) {
          setNotices(data);
          setStatus('ok');
        }
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📢 시스템 공지사항</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto' }}>
          {status === 'loading' && <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>불러오는 중...</p>}
          {status === 'error' && <p style={{ textAlign: 'center', color: '#e53e3e', margin: '20px 0' }}>공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
          {status === 'ok' && notices.length === 0 && <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>등록된 공지사항이 없습니다.</p>}

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
