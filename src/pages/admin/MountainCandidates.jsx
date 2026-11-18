import { useEffect, useState } from 'react';
import { requestJson } from '../../shared/lib/apiClient';
import { adminHeaders } from './adminHeaders';

const stages = { pending: '조사 대기', sourcing: '출처 확인', done: '반영 완료' };
const path = '/api/admin/mountain-candidates';
const blank = { name: '', kind: 'new', status: 'pending', note: '' };

export default function MountainCandidates({ adminToken, adminPassword, selected, onClose }) {
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState(selected || blank);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    requestJson(path, { headers: adminHeaders(adminToken, adminPassword), signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return;
      setRows(data);
      if (selected) setDraft(data.find(row => row.name === selected.name && row.kind === selected.kind) || selected);
    }).catch(() => { if (!controller.signal.aborted) setLoadError(true); });
    return () => controller.abort();
  }, [adminToken, adminPassword, selected]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const entry = { ...draft, name: draft.name.trim().replace(/\s+/g, ' '), note: draft.note.trim() };
    try {
      await requestJson(path, { method: 'PUT', headers: { ...adminHeaders(adminToken, adminPassword), 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
      setRows(previous => [entry, ...previous.filter(row => row.name !== entry.name || row.kind !== entry.kind)]);
      setMessage('후보를 저장했습니다.');
    } catch {
      setMessage('후보를 저장하지 못했습니다.');
    } finally { setBusy(false); }
  }

  return <section className="mountain-search-stats">
    <h3>산·코스 조사 후보</h3>
    <p>공식 자료 조사 상태와 메모를 관리합니다.</p>
    {onClose && <button type="button" onClick={onClose}>검색 현황으로 돌아가기</button>}
    {loadError ? <p role="alert">후보 목록을 불러오지 못했습니다.</p> : !rows ? <p role="status">후보 조회 중…</p> : <>
      <form className="admin-candidate-form" onSubmit={save}>
        <label>산 이름 <input required minLength={2} maxLength={24} pattern="[가-힣 ]+" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>구분 <select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value })}><option value="new">새 산 추가</option><option value="course">코스 보강</option></select></label>
        <label>상태 <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>{Object.entries(stages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>조사 메모 <textarea maxLength={500} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} /></label>
        <button type="submit" disabled={busy}>후보 저장</button>
      </form>
      {message && <p role="status">{message}</p>}
      {rows.length ? <ul>{rows.map(row => <li key={row.kind + ':' + row.name}>
        <button type="button" onClick={() => { setDraft(row); setMessage(''); }}>{row.name} · {row.kind === 'new' ? '새 산 추가' : '코스 보강'} · {stages[row.status]}</button>
      </li>)}</ul> : <p>저장한 조사 후보가 없습니다.</p>}
    </>}
  </section>;
}
