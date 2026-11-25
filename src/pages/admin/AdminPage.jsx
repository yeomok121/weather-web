import React, { useState, useEffect, useEffectEvent } from 'react';
import { FiTrash2, FiEdit } from 'react-icons/fi';
import AdminMembers from './AdminMembers';
import { OperationsStatus, AdminActivity } from './AdminOperations';
import AdminMountainCourses from './AdminMountainCourses';
import CommunityReports from './CommunityReports';
import './AdminDashboard.css';
import UsageDashboard from './UsageDashboard';
import { API } from '../../shared/lib/config';
import { koreanDate } from '../mountain/lib/hikingPlan';

const noticeStates = { draft: '초안', published: '게시', ended: '종료' };
const newNotice = () => ({ state: 'published', type: '안내', title: '', date: koreanDate() });

function AdminPage({ onClose, adminPassword, adminToken, adminRole }) {
  // 상단 탭 상태 ('notices' | 'users')
  const [activeTab, setActiveTab] = useState(adminRole === 'superadmin' ? 'operations' : adminRole === 'notice_manager' ? 'notices' : 'users');
  const canMembers = adminRole === 'superadmin' || adminRole === 'member_manager';
  const canNotices = adminRole === 'superadmin' || adminRole === 'notice_manager';
  // ================= 1. 공지사항 관리 상태 =================
  const [notices, setNotices] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(newNotice);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeType, setNoticeType] = useState('전체');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeBusy, setNoticeBusy] = useState(false);

  // ----------------- 공지사항 관련 함수 (MySQL 연동) -----------------
  const noticeHeaders = { 'Content-Type': 'application/json', ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : { 'x-admin-password': adminPassword || '' }) };

  const loadNotices = async () => {
    try {
      const res = await fetch(`${API}/api/admin/notices`, { headers: noticeHeaders });
      if (!res.ok) throw new Error('failed');
      setNotices(await res.json());
    } catch {
      setNoticeMessage('공지사항을 불러오지 못했습니다. 다시 확인해 주세요.');
    }
  };

  const handleSaveNotice = async () => {
    if (!form.title.trim() || !form.date.trim()) {
      setNoticeMessage('제목과 날짜를 입력해 주세요.');
      return;
    }
    if (noticeBusy) return;
    setNoticeBusy(true);
    setNoticeMessage('');
    const wasEditing = !!editId;
    try {
      const res = await fetch(
        wasEditing ? `${API}/api/admin/notices/${editId}` : `${API}/api/admin/notices`,
        {
          method: wasEditing ? 'PUT' : 'POST',
          headers: noticeHeaders,
          body: JSON.stringify({ state: form.state, type: form.type, title: form.title.trim(), date: form.date.replaceAll('-', '.') }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setNoticeMessage(data.detail || '공지사항 저장에 실패했습니다.');
        return;
      }
      setEditId(null);
      setForm(newNotice());
      await loadNotices();
      setNoticeMessage(wasEditing ? '공지사항이 수정되었습니다.' : '새 공지사항이 등록되었습니다.');
    } catch {
      setNoticeMessage('서버 응답을 확인하지 못했습니다. 목록에서 저장 여부를 확인해 주세요.');
    } finally { setNoticeBusy(false); }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API}/api/admin/notices/${id}`, { method: 'DELETE', headers: noticeHeaders });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '삭제에 실패했습니다.');
        return;
      }
      await loadNotices();
    } catch {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleEditNoticeClick = (notice) => {
    setEditId(notice.id);
    setForm({ state: notice.state || 'published', type: notice.type, title: notice.title, date: notice.date.replaceAll('.', '-') });
    setNoticeMessage('');
  };

  // ----------------- 회원 관리 관련 함수 (MySQL 연동) -----------------
  const loadInitialData = useEffectEvent(() => { if (canNotices) loadNotices(); });
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) loadInitialData(); });
    return () => { cancelled = true; };
  }, [adminPassword, adminToken, adminRole]);

  const isSuperadmin = adminRole === 'superadmin';
  const groups = [
    { title: '운영', items: isSuperadmin ? [['operations', '운영 상태'], ['searches', '이용 현황'], ['courses', '산·코스 등록 현황']] : [] },
    { title: '관리', items: [
      ...(canMembers ? [['users', '회원 관리']] : []),
      ...(canNotices ? [['notices', '공지사항']] : []),
      ['community', '커뮤니티 신고'],
      ...(isSuperadmin ? [['activity', '작업 기록']] : []),
    ] },
  ].filter(group => group.items.length);
  const activeTitle = groups.flatMap(group => group.items).find(([id]) => id === activeTab)?.[1];
  const roleLabel = { superadmin: '최고 관리자', member_manager: '회원 관리자', notice_manager: '공지 관리자' }[adminRole];

  function selectMenu(id) {
    if (id === activeTab) return;
    setActiveTab(id);
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-inner">
          <h1><span>Weather+</span> 관리자</h1>
          <div className="admin-header-actions">
            <span>{roleLabel}</span>
            <button type="button" onClick={onClose}>관리 화면 닫기</button>
          </div>
        </div>
      </header>
      <div className="admin-dashboard-layout">
        <nav className="admin-sidebar" aria-label="관리자 메뉴">
          {groups.map(group => <section key={group.title}>
            <h2>{group.title}</h2>
            {group.items.map(([id, label]) => <button key={id} type="button"
              aria-current={activeTab === id ? 'page' : undefined} onClick={() => selectMenu(id)}>{label}</button>)}
          </section>)}
        </nav>
        <label className="admin-mobile-menu">현재 메뉴
          <select value={activeTab} onChange={event => selectMenu(event.target.value)}>
            {groups.map(group => <optgroup key={group.title} label={group.title}>
              {group.items.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </optgroup>)}
          </select>
        </label>

        <main className="admin-workspace" aria-label={activeTitle}>
        {activeTab === 'operations' && adminRole === 'superadmin' ? (
          <OperationsStatus adminToken={adminToken} adminPassword={adminPassword} />
        ) : activeTab === 'activity' && adminRole === 'superadmin' ? (
          <AdminActivity adminToken={adminToken} adminPassword={adminPassword} />
        ) : activeTab === 'courses' && adminRole === 'superadmin' ? (
          <AdminMountainCourses />
        ) : activeTab === 'searches' && adminRole === 'superadmin' ? (
          <UsageDashboard adminToken={adminToken} adminPassword={adminPassword} />
        ) : activeTab === 'community' ? (
          <CommunityReports adminToken={adminToken} adminPassword={adminPassword} />
        ) : activeTab === 'users' && canMembers ? (
          <AdminMembers adminToken={adminToken} adminPassword={adminPassword} adminRole={adminRole} />
        ) : (
          /* ================= [탭 2] 기존 공지사항 관리 화면 ================= */
          <>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
              <h3 style={{ marginTop: 0 }}>{editId ? '📝 공지사항 수정' : '➕ 새 공지사항 작성'}</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'end' }}>
                <label>유형<br /><select aria-label="공지 유형" value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="안내">안내</option>
                  <option value="점검">점검</option>
                  <option value="긴급">긴급</option>
                </select></label>
                <label>표시 날짜<br /><input type="date" aria-label="공지 표시 날짜" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} /></label>
                <button type="button" onClick={() => setForm({...form, date: koreanDate()})}>오늘로 변경</button>
              </div>
              <p style={{ color: '#475569', fontSize: '13px' }}>표시 날짜는 공지에 표시되는 날짜입니다. 저장하면 선택한 날짜와 관계없이 즉시 공개됩니다.</p>
              <input type="text" aria-label="공지 제목" maxLength={200} placeholder="공지사항 제목을 입력하세요" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px', boxSizing: 'border-box' }} />
              <div style={{ padding: '14px', marginBottom: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflowWrap: 'anywhere' }}><strong>방문자 화면 미리보기</strong><p><b style={{ color: form.type === '긴급' ? '#c53030' : '#2769a9' }}>[{form.type}]</b> {form.title.trim() || '공지 제목을 입력해 주세요'}</p><small>{form.date ? form.date.replaceAll('-', '.') : '날짜를 선택해 주세요'}</small></div>
              {noticeMessage && <p role="status" style={{ color: '#334155', lineHeight: 1.5 }}>{noticeMessage}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <label>공개 상태 <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                  {Object.entries(noticeStates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select></label>
                {form.title.trim() && <details><summary>미리보기</summary><p>{form.type} · {form.date}</p><strong>{form.title}</strong></details>}
                <button disabled={noticeBusy} onClick={handleSaveNotice} style={{ flex: 1, padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {noticeBusy ? '저장 중...' : editId ? '수정 완료' : '등록하기'}
                </button>
                {editId && (
                  <button disabled={noticeBusy} onClick={() => { setEditId(null); setForm(newNotice()); setNoticeMessage(''); }} style={{ padding: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>취소</button>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>📋 등록된 공지사항 목록</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><input aria-label="공지 제목 검색" placeholder="제목 검색" value={noticeSearch} onChange={e => setNoticeSearch(e.target.value)} style={{ padding: '10px', minWidth: 0 }} /><select aria-label="공지 유형 필터" value={noticeType} onChange={e => setNoticeType(e.target.value)} style={{ padding: '10px' }}><option>전체</option><option>안내</option><option>점검</option><option>긴급</option></select></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notices.filter(notice => (noticeType === '전체' || notice.type === noticeType) && notice.title.toLowerCase().includes(noticeSearch.trim().toLowerCase())).map(notice => (
                  <li key={notice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '15px 0' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', color: notice.color, marginRight: '8px' }}>[{notice.type}]</span>
                      <span>{notice.title} · {noticeStates[notice.state] || '게시'}</span>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{notice.date}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button aria-label={`${notice.title} 수정`} onClick={() => handleEditNoticeClick(notice)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}><FiEdit size={18} /></button>
                      <button aria-label={`${notice.title} 삭제`} onClick={() => handleDeleteNotice(notice.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><FiTrash2 size={18} /></button>
                    </div>
                  </li>
                ))}
                {notices.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>등록된 공지사항이 없습니다.</p>}
                {notices.length > 0 && !notices.some(notice => (noticeType === '전체' || notice.type === noticeType) && notice.title.toLowerCase().includes(noticeSearch.trim().toLowerCase())) && <p>검색 결과가 없습니다.</p>}
              </ul>
            </div>
          </>
        )}

        </main>
      </div>
    </div>
  );
}

export default AdminPage;
