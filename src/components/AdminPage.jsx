import React, { useState, useEffect } from 'react';
import { FiTrash2, FiEdit } from 'react-icons/fi';

function AdminPage({ onClose }) {
  const [notices, setNotices] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ type: '안내', title: '', date: '' });

  // 1. 페이지가 열릴 때 기존 공지사항 불러오기 (없으면 기본값 세팅)
  useEffect(() => {
    const defaultNotices = [
      { id: 1, type: '긴급', title: '태풍 북상에 따른 기상 특보 연동 안내', date: '2026.10.07', color: '#e53e3e' },
      { id: 2, type: '점검', title: '기상청 API 서버 정기 점검 안내 (10/10)', date: '2026.10.03', color: '#3182ce' },
      { id: 3, type: '안내', title: '관심 지역 등록이 최대 5개로 확장되었습니다.', date: '2026.09.28', color: '#3182ce' }
    ];
    const stored = JSON.parse(localStorage.getItem('notices')) || defaultNotices;
    setNotices(stored);
  }, []);

  // 2. 공지사항 저장 함수 (수정/추가 공통)
  const handleSave = () => {
    if (!form.title || !form.date) {
      alert('제목과 날짜를 입력해 주세요.');
      return;
    }
    
    let updatedNotices;
    const color = form.type === '긴급' ? '#e53e3e' : '#3182ce';

    if (editId) {
      // 수정 모드
      updatedNotices = notices.map(n => n.id === editId ? { ...n, ...form, color } : n);
      setEditId(null);
    } else {
      // 새 글 추가 모드
      const newId = notices.length > 0 ? Math.max(...notices.map(n => n.id)) + 1 : 1;
      updatedNotices = [{ id: newId, ...form, color }, ...notices]; // 새 글을 맨 위에 추가
    }
    
    setNotices(updatedNotices);
    localStorage.setItem('notices', JSON.stringify(updatedNotices));
    setForm({ type: '안내', title: '', date: '' }); // 폼 초기화
    alert(editId ? '수정되었습니다.' : '추가되었습니다.');
  };

  // 3. 공지사항 삭제 함수
  const handleDelete = (id) => {
    if (window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      const updatedNotices = notices.filter(n => n.id !== id);
      setNotices(updatedNotices);
      localStorage.setItem('notices', JSON.stringify(updatedNotices));
    }
  };

  // 4. 수정 버튼 눌렀을 때 폼에 내용 채우기
  const handleEditClick = (notice) => {
    setEditId(notice.id);
    setForm({ type: notice.type, title: notice.title, date: notice.date });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f4f7f6', zIndex: 9999, overflowY: 'auto' }}>
      {/* 상단 네비게이션 */}
      <div style={{ backgroundColor: '#1a365d', color: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>⚙️ 관리자 대시보드 - 공지사항 관리</h2>
        <button onClick={onClose} style={{ background: 'white', color: '#1a365d', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>나가기</button>
      </div>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#333' }}>
        
        {/* 공지사항 입력/수정 폼 */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>{editId ? '📝 공지사항 수정' : '➕ 새 공지사항 작성'}</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="안내">안내</option>
              <option value="점검">점검</option>
              <option value="긴급">긴급</option>
            </select>
            <input type="text" placeholder="YYYY.MM.DD (예: 2026.10.15)" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', width: '150px' }} />
          </div>
          <input type="text" placeholder="공지사항 제목을 입력하세요" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} style={{ flex: 1, padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {editId ? '수정 완료' : '등록하기'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm({ type: '안내', title: '', date: '' }); }} style={{ padding: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>취소</button>
            )}
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>📋 등록된 공지사항 목록</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notices.map(notice => (
              <li key={notice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '15px 0' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: notice.color, marginRight: '8px' }}>[{notice.type}]</span>
                  <span>{notice.title}</span>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{notice.date}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditClick(notice)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}><FiEdit size={18} /></button>
                  <button onClick={() => handleDelete(notice.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><FiTrash2 size={18} /></button>
                </div>
              </li>
            ))}
            {notices.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>등록된 공지사항이 없습니다.</p>}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default AdminPage;