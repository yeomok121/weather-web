import React, { useState, useEffect } from 'react';
import { FiTrash2, FiEdit, FiCheck, FiX, FiSearch, FiUserPlus } from 'react-icons/fi';
import { API } from '../config';

function AdminPage({ onClose, adminPassword }) {
  // 상단 탭 상태 ('notices' | 'users')
  const [activeTab, setActiveTab] = useState('users');

  // ================= 1. 공지사항 관리 상태 =================
  const [notices, setNotices] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ type: '안내', title: '', date: '' });

  // ================= 2. 회원 관리 상태 =================
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUserForm, setNewUserForm] = useState({ id: '', pw: '', name: '' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ id: '', pw: '', name: '' });

  // 초기 데이터 불러오기 (공지사항 + 회원 목록)
  useEffect(() => {
    const defaultNotices = [
      { id: 1, type: '긴급', title: '태풍 북상에 따른 기상 특보 연동 안내', date: '2026.10.07', color: '#e53e3e' },
      { id: 2, type: '점검', title: '기상청 API 서버 정기 점검 안내 (10/10)', date: '2026.10.03', color: '#3182ce' },
      { id: 3, type: '안내', title: '관심 지역 등록이 최대 5개로 확장되었습니다.', date: '2026.09.28', color: '#3182ce' }
    ];
    const storedNotices = JSON.parse(localStorage.getItem('notices')) || defaultNotices;
    setNotices(storedNotices);

    loadUsers();
  }, []);

  // ----------------- 공지사항 관련 함수 -----------------
  const handleSaveNotice = () => {
    if (!form.title || !form.date) {
      alert('제목과 날짜를 입력해 주세요.');
      return;
    }
    
    let updatedNotices;
    const color = form.type === '긴급' ? '#e53e3e' : '#3182ce';

    if (editId) {
      updatedNotices = notices.map(n => n.id === editId ? { ...n, ...form, color } : n);
      setEditId(null);
    } else {
      const newId = notices.length > 0 ? Math.max(...notices.map(n => n.id)) + 1 : 1;
      updatedNotices = [{ id: newId, ...form, color }, ...notices];
    }
    
    setNotices(updatedNotices);
    localStorage.setItem('notices', JSON.stringify(updatedNotices));
    setForm({ type: '안내', title: '', date: '' });
    alert(editId ? '공지사항이 수정되었습니다.' : '새 공지사항이 추가되었습니다.');
  };

  const handleDeleteNotice = (id) => {
    if (window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      const updatedNotices = notices.filter(n => n.id !== id);
      setNotices(updatedNotices);
      localStorage.setItem('notices', JSON.stringify(updatedNotices));
    }
  };

  const handleEditNoticeClick = (notice) => {
    setEditId(notice.id);
    setForm({ type: notice.type, title: notice.title, date: notice.date });
  };

  // ----------------- 회원 관리 관련 함수 (MySQL 연동) -----------------
  const authHeaders = { 'Content-Type': 'application/json', 'x-admin-password': adminPassword || '' };

  // 회원 목록 불러오기
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '회원 목록을 불러오지 못했습니다.');
        return;
      }
      setUsers(data.map(u => ({ dbId: u.id, id: u.username, name: u.name })));
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  // 1) 관리자 직접 회원 추가
  const handleAddUser = async () => {
    const id = newUserForm.id.trim();
    const pw = newUserForm.pw.trim();
    const name = newUserForm.name.trim();

    if (!id || !pw || !name) {
      alert('아이디, 비밀번호, 이름을 모두 입력해 주세요.');
      return;
    }
    if (id.length < 4 || pw.length < 4) {
      alert('아이디와 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ username: id, password: pw, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '회원 추가에 실패했습니다.');
        return;
      }

      // 신규 회원의 기본 관심 지역(부천시) 세팅
      if (!localStorage.getItem(`favorites_${id}`)) {
        const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
        localStorage.setItem(`favorites_${id}`, JSON.stringify(defaultFav));
      }

      setNewUserForm({ id: '', pw: '', name: '' });
      await loadUsers();
      alert(`'${name}(${id})' 회원이 추가되었습니다.`);
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  // 2) 회원 수정 모드 진입 (비밀번호는 암호화되어 있어 비워둠, 입력할 때만 변경)
  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUserForm({ id: user.id, pw: '', name: user.name });
  };

  // 3) 회원 정보 수정 저장
  const handleSaveUserEdit = async (originalId) => {
    const newId = editUserForm.id.trim();
    const newPw = editUserForm.pw.trim();
    const newName = editUserForm.name.trim();

    if (!newId || !newName) {
      alert('아이디와 이름을 비워둘 수 없습니다.');
      return;
    }
    if (newPw && newPw.length < 4) {
      alert('새 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }

    const target = users.find(u => u.id === originalId);
    if (!target) return;

    try {
      const res = await fetch(`${API}/api/admin/users/${target.dbId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ username: newId, name: newName, password: newPw || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '회원 수정에 실패했습니다.');
        return;
      }

      // 아이디가 변경된 경우 해당 유저의 관심 지역 데이터도 새 아이디로 이전
      if (newId !== originalId) {
        const oldFavs = localStorage.getItem(`favorites_${originalId}`);
        if (oldFavs) {
          localStorage.setItem(`favorites_${newId}`, oldFavs);
          localStorage.removeItem(`favorites_${originalId}`);
        }
      }

      setEditingUserId(null);
      await loadUsers();
      alert('회원 정보가 수정되었습니다.');
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  // 4) 회원 삭제 (강제 탈퇴)
  const handleDeleteUser = async (targetId, targetName) => {
    if (!window.confirm(`정말 '${targetName}(${targetId})' 회원을 삭제하시겠습니까?`)) return;
    const target = users.find(u => u.id === targetId);
    if (!target) return;

    try {
      const res = await fetch(`${API}/api/admin/users/${target.dbId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '회원 삭제에 실패했습니다.');
        return;
      }
      localStorage.removeItem(`favorites_${targetId}`);
      await loadUsers();
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  // 검색어로 필터링된 회원 목록
  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f4f7f6', zIndex: 9999, overflowY: 'auto' }}>
      {/* 상단 네비게이션 */}
      <div style={{ backgroundColor: '#1a365d', color: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>⚙️ 관리자 대시보드</h2>
        <button onClick={onClose} style={{ background: 'white', color: '#1a365d', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>나가기</button>
      </div>

      <div style={{ maxWidth: '850px', margin: '30px auto', padding: '0 20px', color: '#333' }}>
        
        {/* 상단 탭 전환 버튼 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'users' ? '#3182ce' : 'white', color: activeTab === 'users' ? 'white' : '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
          >
            👥 회원 관리 ({users.length}명)
          </button>
          <button 
            onClick={() => setActiveTab('notices')}
            style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', backgroundColor: activeTab === 'notices' ? '#3182ce' : 'white', color: activeTab === 'notices' ? 'white' : '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
          >
            📢 공지사항 관리 ({notices.length}건)
          </button>
        </div>

        {/* ================= [탭 1] 회원 관리 화면 ================= */}
        {activeTab === 'users' ? (
          <>
            {/* 신규 회원 직접 추가 폼 */}
            <div style={{ backgroundColor: 'white', padding: '25px 30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUserPlus color="#3182ce" /> 신규 회원 직접 추가
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input 
                  type="text" placeholder="아이디" value={newUserForm.id} 
                  onChange={e => setNewUserForm({...newUserForm, id: e.target.value})} 
                  style={{ flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                />
                <input 
                  type="password" placeholder="비밀번호" value={newUserForm.pw} 
                  onChange={e => setNewUserForm({...newUserForm, pw: e.target.value})} 
                  style={{ flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                />
                <input 
                  type="text" placeholder="이름" value={newUserForm.name} 
                  onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                  style={{ flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                />
                <button 
                  onClick={handleAddUser} 
                  style={{ padding: '10px 20px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  회원 등록
                </button>
              </div>
            </div>

            {/* 가입된 회원 목록 및 검색 */}
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>📋 가입된 회원 목록 (총 {filteredUsers.length}명)</h3>
                
                {/* 회원 검색창 */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', width: '240px' }}>
                  <FiSearch color="#94a3b8" style={{ marginRight: '8px' }} />
                  <input 
                    type="text" placeholder="아이디 또는 이름 검색..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '13px', color: '#333' }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 10px', width: '60px', textAlign: 'center' }}>번호</th>
                      <th style={{ padding: '12px 10px' }}>아이디</th>
                      <th style={{ padding: '12px 10px' }}>비밀번호</th>
                      <th style={{ padding: '12px 10px' }}>이름</th>
                      <th style={{ padding: '12px 10px', width: '110px', textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => {
                      const isEditing = editingUserId === user.id;
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isEditing ? '#f0f9ff' : 'transparent' }}>
                          <td style={{ padding: '14px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '14px 10px', fontWeight: 'bold', color: '#1e293b' }}>
                            {isEditing ? (
                              <input 
                                type="text" value={editUserForm.id} 
                                onChange={e => setEditUserForm({...editUserForm, id: e.target.value})}
                                style={{ width: '90%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #3182ce' }}
                              />
                            ) : user.id}
                          </td>
                          <td style={{ padding: '14px 10px', color: '#475569', fontFamily: 'monospace', fontSize: '14px' }}>
                            {isEditing ? (
                              <input 
                                type="password" placeholder="변경 시에만 입력" value={editUserForm.pw} 
                                onChange={e => setEditUserForm({...editUserForm, pw: e.target.value})}
                                style={{ width: '90%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #3182ce' }}
                              />
                            ) : '●●●●●●●●'}
                          </td>
                          <td style={{ padding: '14px 10px', color: '#334155' }}>
                            {isEditing ? (
                              <input 
                                type="text" value={editUserForm.name} 
                                onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                                onKeyDown={e => e.key === 'Enter' && handleSaveUserEdit(user.id)}
                                style={{ width: '90%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #3182ce' }}
                              />
                            ) : user.name}
                          </td>
                          <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button onClick={() => handleSaveUserEdit(user.id)} title="저장" style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <FiCheck size={16} />
                                </button>
                                <button onClick={() => setEditingUserId(null)} title="취소" style={{ background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <FiX size={16} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <button onClick={() => startEditUser(user)} title="수정" style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}>
                                  <FiEdit size={18} />
                                </button>
                                <button onClick={() => handleDeleteUser(user.id, user.name)} title="삭제" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                                  <FiTrash2 size={18} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', margin: 0 }}>
                    {searchQuery ? '검색 조건에 맞는 회원이 없습니다.' : '아직 가입된 회원이 없습니다.'}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ================= [탭 2] 기존 공지사항 관리 화면 ================= */
          <>
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
                <button onClick={handleSaveNotice} style={{ flex: 1, padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editId ? '수정 완료' : '등록하기'}
                </button>
                {editId && (
                  <button onClick={() => { setEditId(null); setForm({ type: '안내', title: '', date: '' }); }} style={{ padding: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>취소</button>
                )}
              </div>
            </div>

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
                      <button onClick={() => handleEditNoticeClick(notice)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}><FiEdit size={18} /></button>
                      <button onClick={() => handleDeleteNotice(notice.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><FiTrash2 size={18} /></button>
                    </div>
                  </li>
                ))}
                {notices.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>등록된 공지사항이 없습니다.</p>}
              </ul>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default AdminPage;