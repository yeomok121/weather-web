import React, { useCallback, useEffect, useState } from 'react';
import { FiBell, FiCheck, FiSave, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import { API } from '../config';

const panelStyle = {
  marginTop: '12px', padding: '14px', borderRadius: '12px',
  background: 'rgba(255,255,255,0.52)', border: '1px solid rgba(255,255,255,0.7)',
  color: '#1e293b',
};
const inputStyle = {
  minWidth: 0, padding: '8px 10px', border: '1px solid rgba(51,65,85,0.18)',
  borderRadius: '8px', background: 'rgba(255,255,255,0.9)', color: '#1e293b', fontSize: '12px',
};
const buttonStyle = {
  padding: '8px 10px', border: '1px solid rgba(23,107,99,0.22)', borderRadius: '8px',
  color: '#145c54', background: 'rgba(240,253,250,0.9)', fontSize: '11.5px',
  fontWeight: 750, cursor: 'pointer', whiteSpace: 'nowrap',
};

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || '요청을 처리하지 못했습니다.');
  return data;
}

function HikingPlannerPanel({
  user,
  mountainInfo,
  selectedCourse,
  courseIndex,
  weatherDate,
  selectedDateIdx,
  pace,
  departureOffsetHours,
  departureTime,
  gearList,
  checklist,
  onApplyPlan,
  onShowToast,
}) {
  const [plans, setPlans] = useState([]);
  const [parties, setParties] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [party, setParty] = useState(null);
  const [planName, setPlanName] = useState('내 산행 계획');
  const [partyName, setPartyName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const token = user?.accessToken;
  const notify = (message) => onShowToast?.(message);

  const loadParty = useCallback(async (partyId, accessToken = token) => {
    if (!partyId || !accessToken) {
      setParty(null);
      return;
    }
    const data = await request(`/api/hiking/parties/${partyId}`, accessToken);
    setParty(data);
  }, [token]);

  const refresh = useCallback(async (accessToken = token) => {
    if (!accessToken) return;
    const [nextPlans, nextParties, nextInvites] = await Promise.all([
      request('/api/users/me/hiking-plans', accessToken),
      request('/api/hiking/parties', accessToken),
      request('/api/hiking/parties/invitations', accessToken),
    ]);
    setPlans(nextPlans);
    setParties(nextParties);
    setInvitations(nextInvites);
    if (selectedPartyId && nextParties.some(item => String(item.id) === String(selectedPartyId))) {
      await loadParty(selectedPartyId, accessToken);
    } else if (!nextParties.length) {
      setSelectedPartyId('');
      setParty(null);
    }
  }, [loadParty, selectedPartyId, token]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setPlans([]);
      setParties([]);
      setInvitations([]);
      setSelectedPartyId('');
      setParty(null);
      setError('');
      return undefined;
    }
    Promise.all([
      request('/api/users/me/hiking-plans', token),
      request('/api/hiking/parties', token),
      request('/api/hiking/parties/invitations', token),
    ]).then(([nextPlans, nextParties, nextInvites]) => {
      if (cancelled) return;
      setPlans(nextPlans);
      setParties(nextParties);
      setInvitations(nextInvites);
      setError('');
    }).catch(err => {
      if (!cancelled) setError(err.message);
    });
    return () => { cancelled = true; };
  }, [token]);

  const currentPlan = {
    name: planName.trim() || '내 산행 계획',
    mountain_name: mountainInfo?.name || weatherDate?.region || '산행지',
    course_index: courseIndex || 0,
    course_name: selectedCourse?.name || '기본 탐방로',
    weather_date: weatherDate?.date || '',
    selected_date_idx: selectedDateIdx || 0,
    pace: pace || 'normal',
    departure_offset_hours: departureOffsetHours || 0,
    departure_at: `${weatherDate?.date || ''} ${departureTime || ''}`.trim(),
    items: gearList.map(name => ({ name, checked: !!checklist[name] })),
  };

  const run = async (action) => {
    if (!token) return;
    setIsBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const savePlan = () => run(async () => {
    await request('/api/users/me/hiking-plans', token, {
      method: 'POST', body: JSON.stringify(currentPlan),
    });
    await refresh();
    notify('산행 계획과 준비물 목록을 계정에 저장했습니다.');
  });

  const createParty = () => run(async () => {
    const created = await request('/api/hiking/parties', token, {
      method: 'POST',
      body: JSON.stringify({
        ...currentPlan,
        name: partyName.trim() || `${currentPlan.mountain_name} 산행 파티`,
        plan_id: null,
      }),
    });
    const nextParties = await request('/api/hiking/parties', token);
    setParties(nextParties);
    setSelectedPartyId(String(created.id));
    await loadParty(created.id);
    notify('파티를 만들었습니다. 회원 아이디로 일행을 초대해 보세요.');
  });

  const respondInvite = (invite, decision) => run(async () => {
    await request(`/api/hiking/parties/invitations/${invite.id}/respond`, token, {
      method: 'POST', body: JSON.stringify({ decision }),
    });
    await refresh();
    if (decision === 'accept') {
      const nextParties = await request('/api/hiking/parties', token);
      setParties(nextParties);
      const accepted = nextParties.find(item => Number(item.id) === Number(invite.party_id));
      if (accepted) {
        setSelectedPartyId(String(accepted.id));
        await loadParty(accepted.id);
      }
    }
  });

  const inviteMember = (event) => {
    event.preventDefault();
    if (!party || party.role !== 'owner' || !inviteUsername.trim()) return;
    run(async () => {
      await request(`/api/hiking/parties/${party.id}/invites`, token, {
        method: 'POST', body: JSON.stringify({ username: inviteUsername.trim() }),
      });
      setInviteUsername('');
      notify('파티 초대를 보냈습니다.');
    });
  };

  const addPartyItem = (event) => {
    event.preventDefault();
    if (!party || !newItemName.trim()) return;
    run(async () => {
      await request(`/api/hiking/parties/${party.id}/items`, token, {
        method: 'POST', body: JSON.stringify({ name: newItemName.trim(), quantity: 1 }),
      });
      setNewItemName('');
      await loadParty(party.id);
    });
  };

  const updatePartyItem = (item, updates) => run(async () => {
    await request(`/api/hiking/parties/${party.id}/items/${item.id}`, token, {
      method: 'PATCH', body: JSON.stringify(updates),
    });
    await loadParty(party.id);
  });

  const removePartyItem = (item) => run(async () => {
    await request(`/api/hiking/parties/${party.id}/items/${item.id}`, token, { method: 'DELETE' });
    await loadParty(party.id);
  });

  const deletePlan = (planId) => run(async () => {
    await request(`/api/users/me/hiking-plans/${planId}`, token, { method: 'DELETE' });
    await refresh();
  });

  const deleteParty = () => {
    if (!party || party.role !== 'owner' || !window.confirm('이 산행 파티와 공동 준비물을 삭제할까요?')) return;
    run(async () => {
      await request(`/api/hiking/parties/${party.id}`, token, { method: 'DELETE' });
      setSelectedPartyId('');
      setParty(null);
      await refresh();
    });
  };

  const selectParty = (partyId) => {
    setSelectedPartyId(partyId);
    if (partyId) run(() => loadParty(partyId));
    else setParty(null);
  };

  const sectionTitle = { margin: 0, fontSize: '12.5px', color: '#1e3a4b', fontWeight: 850 };
  const muted = { color: '#64748b', fontSize: '11px', lineHeight: 1.45 };

  return (
    <section style={panelStyle} aria-label="회원 산행 계획과 파티">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 9, color: '#176b63', background: 'rgba(23,107,99,0.1)' }}><FiUsers size={15} /></span>
        <div>
          <h5 style={{ margin: 0, color: '#145c54', fontSize: '13px', fontWeight: 850 }}>내 산행 계획과 파티</h5>
          <div style={muted}>계획을 저장하고, 일행과 준비물을 나눠 챙기세요.</div>
        </div>
      </div>

      {!user ? (
        <p style={{ ...muted, margin: '10px 0 0' }}>회원 로그인 후 산행 계획 저장, 파티 초대, 공동 준비물 기능을 이용할 수 있습니다.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.62)' }}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <input aria-label="산행 계획 이름" style={{ ...inputStyle, flex: 1 }} value={planName} onChange={event => setPlanName(event.target.value)} maxLength={120} />
              <button type="button" disabled={isBusy} onClick={savePlan} style={buttonStyle}><FiSave size={13} style={{ verticalAlign: '-2px' }} /> 계획 저장</button>
            </div>
            <div style={{ ...muted, marginTop: 6 }}>
              {currentPlan.mountain_name} · {currentPlan.course_name} · {currentPlan.departure_at || '출발 시간 미설정'} · 준비물 {currentPlan.items.length}개
            </div>
          </div>

          {plans.length > 0 && (
            <div>
              <h6 style={sectionTitle}>저장한 계획</h6>
              <div style={{ display: 'grid', gap: 6, marginTop: 7 }}>
                {plans.map(plan => (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 9px', borderRadius: 9, background: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: 11.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.name}</strong>
                      <span style={muted}>{plan.mountain_name} · {plan.course_name} · 준비물 {plan.items?.length || 0}개</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button type="button" onClick={() => onApplyPlan?.(plan)} style={buttonStyle}>불러오기</button>
                      <button type="button" title="계획 삭제" aria-label={`${plan.name} 삭제`} onClick={() => deletePlan(plan.id)} style={{ ...buttonStyle, color: '#9f1239', borderColor: 'rgba(159,18,57,0.18)', padding: '7px' }}><FiTrash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.62)' }}>
            <h6 style={sectionTitle}>현재 계획으로 산행 파티 만들기</h6>
            <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
              <input aria-label="산행 파티 이름" style={{ ...inputStyle, flex: 1 }} value={partyName} onChange={event => setPartyName(event.target.value)} maxLength={120} placeholder={`${currentPlan.mountain_name} 산행 파티`} />
              <button type="button" disabled={isBusy} onClick={createParty} style={buttonStyle}><FiUsers size={13} style={{ verticalAlign: '-2px' }} /> 파티 만들기</button>
            </div>
            <div style={{ ...muted, marginTop: 6 }}>현재 코스와 준비물 목록을 파티에 복사합니다. 구성원은 함께 상태를 갱신할 수 있습니다.</div>
          </div>

          {invitations.length > 0 && (
            <div style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(37,99,235,0.16)', background: 'rgba(239,246,255,0.65)' }}>
              <h6 style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 5 }}><FiBell size={13} /> 파티 초대 {invitations.length}건</h6>
              <div style={{ display: 'grid', gap: 6, marginTop: 7 }}>
                {invitations.map(invite => (
                  <div key={invite.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.75)' }}>
                    <span style={{ fontSize: 11.5 }}>{invite.party_name} · {invite.mountain_name} · {invite.invited_by_name}님의 초대</span>
                    <span style={{ display: 'flex', gap: 5 }}>
                      <button type="button" disabled={isBusy} onClick={() => respondInvite(invite, 'accept')} style={buttonStyle}>수락</button>
                      <button type="button" disabled={isBusy} onClick={() => respondInvite(invite, 'decline')} style={{ ...buttonStyle, color: '#64748b' }}>거절</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parties.length > 0 && (
            <div style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.62)' }}>
              <label htmlFor="hiking-party-select" style={{ ...sectionTitle, display: 'block', marginBottom: 7 }}>내 파티 ({parties.length})</label>
              <select id="hiking-party-select" value={selectedPartyId} onChange={event => selectParty(event.target.value)} style={{ ...inputStyle, width: '100%' }}>
                <option value="">파티를 선택하세요</option>
                {parties.map(item => <option key={item.id} value={item.id}>{item.name} · {item.mountain_name} · {item.member_count}명</option>)}
              </select>
            </div>
          )}

          {party && (
            <div style={{ padding: '11px', borderRadius: 10, border: '1px solid rgba(23,107,99,0.16)', background: 'rgba(240,253,250,0.55)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <h6 style={{ ...sectionTitle, fontSize: 13 }}>{party.name}</h6>
                  <div style={muted}>{party.mountain_name} · {party.course_name} · 출발 {party.departure_at || '미정'}</div>
                </div>
                {party.role === 'owner' && <button type="button" onClick={deleteParty} aria-label="파티 삭제" title="파티 삭제" style={{ ...buttonStyle, color: '#9f1239', padding: 7 }}><FiTrash2 size={13} /></button>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '8px 0' }}>
                {(party.members || []).map(member => (
                  <span key={member.username} style={{ padding: '4px 7px', borderRadius: 20, color: '#334155', background: 'rgba(255,255,255,0.75)', fontSize: 10.5 }}>
                    {member.name} (@{member.username}){member.role === 'owner' ? ' · 파티장' : ''}
                  </span>
                ))}
              </div>

              {party.role === 'owner' && (
                <form onSubmit={inviteMember} style={{ display: 'flex', gap: 6, marginBottom: 9 }}>
                  <input aria-label="초대할 회원 아이디" style={{ ...inputStyle, flex: 1 }} value={inviteUsername} onChange={event => setInviteUsername(event.target.value)} placeholder="초대할 회원 아이디" minLength={4} maxLength={80} />
                  <button type="submit" disabled={isBusy || !inviteUsername.trim()} style={buttonStyle}><FiUserPlus size={13} style={{ verticalAlign: '-2px' }} /> 초대</button>
                </form>
              )}

              <form onSubmit={addPartyItem} style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
                <input aria-label="공동 준비물" style={{ ...inputStyle, flex: 1 }} value={newItemName} onChange={event => setNewItemName(event.target.value)} placeholder="함께 챙길 물품 추가" maxLength={120} />
                <button type="submit" disabled={isBusy || !newItemName.trim()} style={buttonStyle}>추가</button>
              </form>

              <div style={{ display: 'grid', gap: 5 }}>
                {(party.items || []).map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.72)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, fontSize: 11.5, color: item.is_packed ? '#64748b' : '#1e293b', textDecoration: item.is_packed ? 'line-through' : 'none' }}>
                      <input type="checkbox" checked={item.is_packed} onChange={event => updatePartyItem(item, { is_packed: event.target.checked })} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name} × {item.quantity}</span>
                    </label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <select aria-label={`${item.name} 담당자`} value={item.assigned_to_username || ''} onChange={event => updatePartyItem(item, { assigned_to_username: event.target.value || null })} style={{ ...inputStyle, padding: '5px 6px', maxWidth: 112 }}>
                        <option value="">담당 없음</option>
                        {(party.members || []).map(member => <option key={member.username} value={member.username}>{member.name}</option>)}
                      </select>
                      {(party.role === 'owner' || item.created_by_username === user?.id) && (
                        <button type="button" onClick={() => removePartyItem(item)} aria-label={`${item.name} 삭제`} title="준비물 삭제" style={{ ...buttonStyle, color: '#9f1239', padding: 6 }}><FiTrash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                ))}
                {!party.items?.length && <p style={{ ...muted, margin: '4px 0' }}>공동 준비물이 아직 없습니다.</p>}
              </div>
              <div style={{ ...muted, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}><FiCheck size={12} />체크와 담당자 변경은 파티 구성원에게 함께 반영됩니다.</div>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" style={{ margin: '9px 0 0', color: '#b91c1c', fontSize: 11.5 }}>{error}</p>}
    </section>
  );
}

export default HikingPlannerPanel;
