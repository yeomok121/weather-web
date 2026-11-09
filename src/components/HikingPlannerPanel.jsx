import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiBell, FiCheck, FiSave, FiTrash2, FiUserPlus, FiUsers, FiRefreshCw, FiShare2 } from 'react-icons/fi';
import { requestJson } from '../lib/apiClient';
import './HikingPlannerPanel.css';

const displayDeparture = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : value || '미정';

const request = (path, token, options = {}) => requestJson(path, {
  ...options, timeoutMs: 20000,
  headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
});

export default function HikingPlannerPanel({
  user, mountainInfo, selectedCourse, courseIndex, weatherDate, selectedDateIdx,
  pace, departureOffsetHours, departureTime, departureAt, gearList, checklist, onApplyPlan,
  onShowToast, onRequireLogin, canSave = true, focusSection = 'plan', onInvitationCountChange,
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
  const [tab, setTab] = useState(focusSection);
  const [isBusy, setIsBusy] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savedPlan, setSavedPlan] = useState(null);
  const [itemFilter, setItemFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const token = user?.accessToken;
  const activeToken = useRef(token);
  activeToken.current = token;
  const selectedRef = useRef('');
  const busyRef = useRef(false);
  const syncingRef = useRef(null);
  const inviteInput = useRef(null);
  const notify = message => { setSuccess(message); onShowToast?.(message); };
  const partyStorageKey = `hiking:last-party:${user?.id || 'guest'}`;

  useEffect(() => { setTab(focusSection); }, [focusSection]);
  useEffect(() => { onInvitationCountChange?.(invitations.length); }, [invitations.length, onInvitationCountChange]);
  const loadParty = useCallback(async (id, accessToken = token) => {
    if (!id || !accessToken) return;
    const data = await request(`/api/hiking/parties/${id}`, accessToken);
    if (activeToken.current === accessToken && selectedRef.current === String(id)) setParty(data);
  }, [token]);

  const refresh = useCallback(async (accessToken = token) => {
    if (!accessToken || syncingRef.current === accessToken) return;
    syncingRef.current = accessToken;
    setIsSyncing(true);
    const paths = ['/api/users/me/hiking-plans', '/api/hiking/parties', '/api/hiking/parties/invitations'];
    try {
      const results = await Promise.allSettled(paths.map(path => request(path, accessToken)));
      if (activeToken.current !== accessToken) return;
      const setters = [setPlans, setParties, setInvitations];
      results.forEach((result, index) => { if (result.status === 'fulfilled') setters[index](result.value); });
      const failure = results.find(result => result.status === 'rejected');
      setError(failure ? failure.reason.message : '');
      if (results[1].status === 'fulfilled') {
        const available = results[1].value;
        let id = selectedRef.current;
        if (!available.some(item => String(item.id) === id)) {
          id = available[0] ? String(available[0].id) : '';
          selectedRef.current = id; setSelectedPartyId(id); setParty(null);
        }
        if (id) await loadParty(id, accessToken);
      }
    } catch (err) {
      if (activeToken.current === accessToken) setError(err.message);
    } finally {
      if (syncingRef.current === accessToken) syncingRef.current = null;
      if (activeToken.current === accessToken) setIsSyncing(false);
    }
  }, [token, loadParty]);

  useEffect(() => {
    setPlans([]); setParties([]); setInvitations([]); setParty(null);
    setError(''); setSuccess(''); setSavedPlan(null);
    setItemFilter('all'); setCreateOpen(false); setSavedOpen(false);
    const deepLink = new URLSearchParams(window.location.search).get('party');
    let remembered = '';
    try { remembered = localStorage.getItem(partyStorageKey) || ''; } catch { /* private storage */ }
    selectedRef.current = deepLink || remembered;
    setSelectedPartyId(selectedRef.current);
    if (deepLink || remembered) setTab('party');
    if (token) refresh(token);
  }, [token, partyStorageKey, refresh]);

  useEffect(() => {
    if (!token) return undefined;
    const sync = () => { if (!document.hidden && navigator.onLine && !busyRef.current) refresh(token); };
    window.addEventListener('focus', sync);
    window.addEventListener('online', sync);
    const interval = setInterval(sync, 30000);
    return () => { clearInterval(interval); window.removeEventListener('focus', sync); window.removeEventListener('online', sync); };
  }, [token, refresh]);

  const selectParty = async id => {
    const normalized = String(id || '');
    selectedRef.current = normalized; setSelectedPartyId(normalized); setParty(null);
    setItemFilter('all');
    try { localStorage.setItem(partyStorageKey, normalized); } catch { /* optional */ }
    if (normalized) await loadParty(normalized);
  };
  const currentPlan = {
    name: planName.trim() || '내 산행 계획', mountain_name: mountainInfo?.name || weatherDate?.region || '',
    course_index: courseIndex || 0, course_name: selectedCourse?.name || '기본 탐방로',
    weather_date: weatherDate?.forecastDate || weatherDate?.date || '', selected_date_idx: selectedDateIdx || 0,
    pace: pace || 'normal', departure_offset_hours: Math.round(departureOffsetHours || 0),
    departure_at: departureAt || `${weatherDate?.date || ''} ${departureTime || ''}`.trim(),
    items: gearList.map(name => ({ name, checked: !!checklist[name] })),
  };
  const signature = JSON.stringify(currentPlan);
  const savedMatches = savedPlan?.signature === signature;
  const run = async action => {
    if (!token || busyRef.current) return;
    busyRef.current = true; setIsBusy(true); setError(''); setSuccess('');
    const accessToken = token;
    try { await action(accessToken); }
    catch (err) { if (activeToken.current === accessToken) setError(err.message); }
    finally { busyRef.current = false; if (activeToken.current === accessToken) setIsBusy(false); }
  };
  const persistPlan = async accessToken => {
    if (savedMatches) return savedPlan.id;
    const response = await request(savedPlan?.id ? `/api/users/me/hiking-plans/${savedPlan.id}` : '/api/users/me/hiking-plans', accessToken, { method: savedPlan?.id ? 'PUT' : 'POST', body: JSON.stringify(currentPlan) });
    const id = savedPlan?.id || response.id;
    if (activeToken.current === accessToken) setSavedPlan({ id, signature });
    return id;
  };
  const savePlan = () => run(async accessToken => {
    await persistPlan(accessToken);
    if (activeToken.current !== accessToken) return;
    notify('계획을 저장했어요. 이제 이 일정으로 파티를 만들어 일행을 초대할 수 있어요.');
    await refresh(accessToken);
  });
  const createParty = () => run(async accessToken => {
    const planId = await persistPlan(accessToken);
    const created = await request('/api/hiking/parties', accessToken, { method: 'POST', body: JSON.stringify({
      ...currentPlan, name: partyName.trim() || `${currentPlan.mountain_name} 산행 파티`, plan_id: planId,
    }) });
    if (activeToken.current !== accessToken) return;
    setTab('party');
    setCreateOpen(false);
    await selectParty(created.id);
    await refresh(accessToken);
    notify('파티를 만들었어요. 회원 아이디로 일행을 초대하세요.');
    setTimeout(() => inviteInput.current?.focus(), 100);
  });
  const respondInvite = (invite, decision) => run(async accessToken => {
    await request(`/api/hiking/parties/invitations/${invite.id}/respond`, accessToken, { method: 'POST', body: JSON.stringify({ decision }) });
    if (activeToken.current !== accessToken) return;
    if (decision === 'accept') { await selectParty(invite.party_id); setTab('party'); }
    await refresh(accessToken);
    notify(decision === 'accept' ? '초대를 수락했어요. 공동 준비물 담당자를 정해 보세요.' : '초대를 거절했어요.');
  });
  const inviteMember = event => {
    event.preventDefault();
    if (!party || party.role !== 'owner' || !inviteUsername.trim()) return;
    run(async accessToken => {
      await request(`/api/hiking/parties/${party.id}/invites`, accessToken, { method: 'POST', body: JSON.stringify({ username: inviteUsername.trim() }) });
      setInviteUsername(''); await loadParty(party.id, accessToken); notify('초대를 보냈어요. 일행이 로그인한 뒤 이 화면에서 수락하면 함께 준비할 수 있어요.');
    });
  };
  const addItem = event => {
    event.preventDefault(); if (!party || !newItemName.trim()) return;
    run(async accessToken => {
      await request(`/api/hiking/parties/${party.id}/items`, accessToken, { method: 'POST', body: JSON.stringify({ name: newItemName.trim(), quantity: 1 }) });
      if (activeToken.current !== accessToken) return;
      setNewItemName(''); setItemFilter('all'); await loadParty(party.id, accessToken);
    });
  };
  const updateItem = (item, updates) => {
    if (busyRef.current || !party) return;
    const before = party;
    const assigned = party.members?.find(member => member.username === updates.assigned_to_username);
    setParty(previous => ({ ...previous, items: previous.items.map(row => row.id === item.id
      ? { ...row, ...updates, ...('assigned_to_username' in updates ? { assigned_to_name: assigned?.name || null } : {}) } : row) }));
    run(async accessToken => {
      try {
        await request(`/api/hiking/parties/${before.id}/items/${item.id}`, accessToken, { method: 'PATCH', body: JSON.stringify(updates) });
        await loadParty(before.id, accessToken);
      } catch (err) {
        if (activeToken.current === accessToken && selectedRef.current === String(before.id)) setParty(before);
        throw err;
      }
    });
  };
  const removeItem = item => {
    if (!window.confirm(`공동 준비물 ‘${item.name}’을 삭제할까요? 일행의 목록에서도 삭제됩니다.`)) return;
    run(async accessToken => {
      await request(`/api/hiking/parties/${party.id}/items/${item.id}`, accessToken, { method: 'DELETE' });
      await loadParty(party.id, accessToken);
    });
  };
  const removePlan = plan => {
    if (!window.confirm(`저장한 계획 ‘${plan.name}’을 삭제할까요?`)) return;
    run(async accessToken => {
      await request(`/api/users/me/hiking-plans/${plan.id}`, accessToken, { method: 'DELETE' });
      if (activeToken.current !== accessToken) return;
      if (savedPlan?.id === plan.id) setSavedPlan(null);
      await refresh(accessToken);
      notify('저장한 계획을 삭제했어요.');
    });
  };
  const shareParty = async () => {
    if (!party) return;
    const url = new URL(window.location.origin);
    url.searchParams.set('mountain', party.mountain_name); url.searchParams.set('party', party.id);
    const text = `${party.name}\n${party.mountain_name} · ${party.course_name}\n출발: ${displayDeparture(party.departure_at)}\n${(party.items || []).map(item => `${item.is_packed ? '☑' : '□'} ${item.name} ×${item.quantity} — ${item.assigned_to_name || '담당 미정'}`).join('\n')}\n파티 구성원은 로그인한 뒤 준비 상태를 확인할 수 있어요.`;
    try {
      if (navigator.share) await navigator.share({ title: party.name, text, url: url.href });
      else { await navigator.clipboard.writeText(`${text}\n${url.href}`); notify('파티 일정과 준비물 링크를 복사했어요.'); }
    } catch (err) { if (err.name !== 'AbortError') setError('공유하지 못했습니다. 브라우저의 공유 권한을 확인해 주세요.'); }
  };
  const packed = party?.items?.filter(item => item.is_packed).length || 0;
  const unassigned = party?.items?.filter(item => !item.assigned_to_username).length || 0;
  const myItems = (party?.items || []).filter(item => item.assigned_to_username === user?.id);
  const myPending = myItems.filter(item => !item.is_packed).length;
  const visibleItems = (party?.items || []).filter(item => itemFilter === 'mine' ? item.assigned_to_username === user?.id : itemFilter === 'unassigned' ? !item.assigned_to_username : true);
  const handleTabKey = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === 'Home' ? 'plan' : event.key === 'End' ? 'party' : tab === 'plan' ? 'party' : 'plan';
    setTab(nextTab);
    document.getElementById(`planner-tab-${nextTab}`)?.focus();
  };

  return <section id="hiking-planner" className="hiking-planner" aria-label="산행 계획 저장과 일행 초대">
    <div className="planner-heading"><div><h3>계획 저장 · 일행과 준비</h3></div>
      {user && <button type="button" className="subtle-button" onClick={() => refresh()} disabled={isSyncing || isBusy} aria-label="산행 계획과 초대 새로고침"><FiRefreshCw className={isSyncing ? 'connection-spinner' : ''} /> 새로고침</button>}
    </div>
    {isSyncing && <p className="planner-feedback" role="status">계획과 초대를 확인하고 있어요…</p>}
    {isBusy && <p className="planner-feedback" role="status">요청을 처리하고 있어요…</p>}
    {success && <p className="planner-success" role="status">{success}</p>}
    {error && <div className="planner-error" role="alert"><p>{error}</p><button type="button" disabled={isBusy || isSyncing} onClick={() => refresh()}>다시 불러오기</button><small>작성 중인 내용은 유지됩니다. 저장을 다시 시도하기 전에 저장한 계획을 확인해 주세요.</small></div>}
    {!user ? <div className="planner-guest"><strong>작성 중인 준비물은 이 브라우저에 보관돼요.</strong><p>로그인하면 계획을 계정에 저장하고 회원 아이디로 일행을 초대할 수 있어요.</p><button type="button" className="primary-button" onClick={onRequireLogin}>로그인하고 이어서 준비하기</button></div> : <>
      {!!invitations.length && <section className="planner-invitations" aria-label="받은 파티 초대"><h4><FiBell /> 받은 초대 {invitations.length}건</h4>{invitations.map(invite => <div key={invite.id} className="planner-invite"><div><strong>{invite.party_name}</strong><p>{invite.mountain_name} · {invite.invited_by_name}님의 초대</p></div><div className="planner-actions"><button type="button" disabled={isBusy} onClick={() => respondInvite(invite, 'accept')}>수락</button><button type="button" disabled={isBusy} onClick={() => respondInvite(invite, 'decline')}>거절</button></div></div>)}</section>}
      <div className="planner-tabs" role="tablist" aria-label="산행 준비 단계" onKeyDown={handleTabKey}>{[{ key: 'plan', label: '내 계획', count: plans.length }, { key: 'party', label: '내 파티', count: parties.length }].map(item => <button key={item.key} id={`planner-tab-${item.key}`} type="button" role="tab" aria-selected={tab === item.key} aria-controls={`planner-panel-${item.key}`} tabIndex={tab === item.key ? 0 : -1} onClick={() => setTab(item.key)}>{item.label} <span>{item.count}</span></button>)}</div>
      {tab === 'plan' ? <div id="planner-panel-plan" role="tabpanel" aria-labelledby="planner-tab-plan" className="planner-section">
        <div className="planner-summary"><strong>{currentPlan.mountain_name || '산을 선택하세요'} · {currentPlan.course_name}</strong><p>{displayDeparture(currentPlan.departure_at)} 출발 · 준비물 {gearList.length}개</p><a href="#hike-schedule">일정 다시 비교하기 ↑</a></div>
        <div className="planner-save-row"><label className="planner-label">계획 이름<input value={planName} onChange={event => setPlanName(event.target.value)} maxLength={120} /></label><span className={`planner-save-state ${savedMatches ? 'is-saved' : ''}`}>{savedMatches ? '계정에 저장됨' : savedPlan ? '변경 사항 저장 필요' : '아직 저장하지 않은 계획'}</span></div>
        <div className="planner-actions"><button className="primary-button" type="button" disabled={isBusy || !canSave || savedMatches} onClick={savePlan}><FiSave /> {savedMatches ? '저장 완료' : savedPlan ? '변경 사항 저장' : '계획 저장'}</button><button type="button" disabled={isBusy || !canSave} onClick={() => { setCreateOpen(true); setTab('party'); }}><FiUsers /> 이 일정으로 파티 만들기</button></div>
        {!canSave && <p className="muted">최신 기상 자료를 확인한 뒤 새 계획을 저장할 수 있어요. 기존 계획과 파티는 계속 확인할 수 있습니다.</p>}
        <details className="saved-plans" open={savedOpen} onToggle={event => setSavedOpen(event.currentTarget.open)}><summary>저장한 계획 {plans.length}개</summary>{plans.map(plan => <div key={plan.id} className="saved-plan"><div><strong>{plan.name}</strong><p>{plan.mountain_name} · {plan.course_name}</p><small>{displayDeparture(plan.departure_at) || plan.weather_date} · 준비물 {plan.items?.length || 0}개</small></div><div className="planner-actions"><button type="button" disabled={isBusy} onClick={() => run(async () => { await onApplyPlan?.(plan); setPlanName(plan.name); setSavedPlan({ id: plan.id, signature: '' }); notify('코스와 준비물을 불러왔어요. 출발 날짜와 시간을 확인해 주세요.'); })}>불러오기</button><button type="button" disabled={isBusy} aria-label={`${plan.name} 삭제`} onClick={() => removePlan(plan)}><FiTrash2 /></button></div></div>)}{!plans.length && <p className="muted">저장한 계획이 여기에 표시됩니다.</p>}</details>
      </div> : <div id="planner-panel-party" role="tabpanel" aria-labelledby="planner-tab-party" className="planner-section">
        <details className="create-party" open={createOpen} onToggle={event => setCreateOpen(event.currentTarget.open)}><summary>현재 일정으로 새 파티 만들기</summary><p className="muted">{currentPlan.mountain_name} · {displayDeparture(currentPlan.departure_at)} 출발</p><label className="planner-label">파티 이름<input value={partyName} onChange={event => setPartyName(event.target.value)} maxLength={120} placeholder={`${currentPlan.mountain_name} 산행 파티`} /></label><button type="button" className="primary-button" disabled={isBusy || !canSave} onClick={createParty}><FiUsers /> {savedMatches ? '저장한 계획으로 파티 만들기' : '계획 저장하고 파티 만들기'}</button><p className="muted">생성 후 회원 아이디로 일행을 초대할 수 있어요.</p></details>
        {!!parties.length && <label className="planner-label">내 산행 파티<select value={selectedPartyId} onChange={event => run(() => selectParty(event.target.value))}><option value="">파티를 선택하세요</option>{parties.map(item => <option key={item.id} value={item.id}>{item.name} · {item.member_count}명</option>)}</select></label>}
        {!parties.length && !isSyncing && <p className="muted">파티를 만들거나 초대를 수락하면 공동 준비물을 확인할 수 있어요.</p>}
        {party && <div className="party-detail"><div className="planner-heading"><div><h4>{party.name}</h4><p>{party.mountain_name} · {party.course_name}</p><small>출발 {displayDeparture(party.departure_at)}</small></div><button type="button" onClick={shareParty}><FiShare2 /> 일정 공유</button></div>
          <div className="party-members">{(party.members || []).map(member => <span key={member.username}>{member.name} (@{member.username}){member.role === 'owner' ? ' · 파티장' : ''}</span>)}</div>
          {party.role === 'owner' && <><form onSubmit={inviteMember} className="planner-inline-form"><label className="planner-label">초대할 회원 아이디<input ref={inviteInput} value={inviteUsername} onChange={event => setInviteUsername(event.target.value)} placeholder="회원 아이디 입력" minLength={4} maxLength={80} required /></label><button type="submit" disabled={isBusy || !inviteUsername.trim()}><FiUserPlus /> 초대 보내기</button></form><p className="muted">초대받은 회원은 로그인 후 ‘내 산행’에서 초대를 확인할 수 있어요.</p>{!!party.pending_invites?.length && <p className="pending-invites">수락 대기: {party.pending_invites.map(invite => `@${invite.username}`).join(', ')}</p>}</>}
          <div className="party-progress"><strong>준비 완료 {packed}/{party.items?.length || 0}</strong><span>담당 미정 {unassigned}개</span><progress value={packed} max={party.items?.length || 1} aria-label="공동 준비물 준비 완료" /></div>
          <div className="party-item-filters" role="group" aria-label="준비물 보기">{[{ key: 'all', label: `전체 ${party.items?.length || 0}` }, { key: 'mine', label: `내 담당 ${myItems.length}` }, { key: 'unassigned', label: `담당 미정 ${unassigned}` }].map(filter => <button type="button" key={filter.key} aria-pressed={itemFilter === filter.key} onClick={() => setItemFilter(filter.key)}>{filter.label}</button>)}</div>
          {itemFilter === 'mine' && <p className="muted" role="status">내 담당 {myItems.length}개 중 {myPending}개를 더 챙기면 됩니다.</p>}
          <form onSubmit={addItem} className="planner-inline-form"><label className="planner-label">공동 준비물<input value={newItemName} onChange={event => setNewItemName(event.target.value)} placeholder="함께 챙길 물품" maxLength={120} required /></label><button type="submit" disabled={isBusy || !newItemName.trim()}>추가</button></form>
          <div className="party-items">{visibleItems.map(item => <div key={item.id} className={`party-item ${item.is_packed ? 'is-packed' : ''}`}><label className="party-item-check"><input type="checkbox" checked={item.is_packed} disabled={isBusy} onChange={event => updateItem(item, { is_packed: event.target.checked })} /><span>{item.name}</span></label><div className="party-item-controls"><label>수량<select aria-label={`${item.name} 수량`} value={item.quantity} disabled={isBusy} onChange={event => updateItem(item, { quantity: Number(event.target.value) })}>{Array.from({ length: Math.max(10, item.quantity) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>담당자<select aria-label={`${item.name} 담당자`} value={item.assigned_to_username || ''} disabled={isBusy} onChange={event => updateItem(item, { assigned_to_username: event.target.value || null })}><option value="">담당 미정</option>{(party.members || []).map(member => <option key={member.username} value={member.username}>{member.name}{member.username === user.id ? ' (나)' : ''}</option>)}</select></label>{(party.role === 'owner' || item.created_by_username === user.id) && <button type="button" disabled={isBusy} aria-label={`${item.name} 삭제`} onClick={() => removeItem(item)}><FiTrash2 /></button>}</div></div>)}</div>
          {!visibleItems.length && <p className="planner-empty" role="status">{itemFilter === 'mine' ? '아직 내 담당 물품이 없어요. 전체 목록에서 담당자를 지정해 주세요.' : itemFilter === 'unassigned' ? '모든 물품의 담당자가 정해졌어요.' : '공동 준비물을 추가해 함께 챙겨 보세요.'}</p>}
          <p className="muted"><FiCheck /> 변경 내용은 서버에 저장되며, 다른 일행의 화면은 30초마다 갱신됩니다. 지금 확인하려면 새로고침을 누르세요.</p>
          {party.role === 'owner' && <button type="button" className="danger-button" disabled={isBusy} onClick={() => { if (window.confirm('이 파티와 공동 준비물을 삭제할까요?')) run(async accessToken => { await request(`/api/hiking/parties/${party.id}`, accessToken, { method: 'DELETE' }); selectedRef.current = ''; setSelectedPartyId(''); setParty(null); await refresh(accessToken); }); }}>파티 삭제</button>}
        </div>}
      </div>}
    </>}
  </section>;
}
