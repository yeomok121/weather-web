import { useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiUser, FiUsers, FiShield, FiSearch } from 'react-icons/fi';
import { requestJson } from '../../shared/lib/apiClient';
import { adminHeaders } from './adminHeaders';
import './AdminMembers.css';

const roles = { member: '일반 회원', member_manager: '회원 관리자', notice_manager: '공지 관리자', superadmin: '최고 관리자' };
const labels = { create: '회원 등록', update: '이름 수정', rename: '아이디 변경', update_password: '비밀번호 변경', suspend: '계정 정지', restore: '정지 해제', delete: '영구 삭제' };
const clock = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' });
const pageSize = 20;
const api = '/api/admin/users';

function useMemberRequest(url, adminToken, adminPassword, revision) {
  const [response, setResponse] = useState(null);
  const key = url ? `${url}:${revision}` : null;
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    requestJson(url, { headers: adminHeaders(adminToken, adminPassword), signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResponse({ key, data }); })
      .catch(error => { if (!controller.signal.aborted) setResponse({ key, error: error.message }); });
    return () => controller.abort();
  }, [url, adminToken, adminPassword, key]);
  return key && response?.key === key ? response : null;
}

function History({ rows, showTarget = false }) {
  if (!rows.length) return <p className="member-muted">기록이 없습니다.</p>;
  return <ol className="member-history">
    {rows.map(row => {
      const role = row.action.startsWith('role:') ? roles[row.action.slice(5)] : null;
      return <li key={row.id}>
        <strong>{role ? `권한 변경 · ${role}` : labels[row.action] || row.action}{showTarget && ` · ${row.target_username}`}</strong>
        <small>{row.actor} · {row.occurred_at ? clock.format(new Date(row.occurred_at * 1000)) : row.created_at?.replace('T', ' ')}</small>
        {row.reason && <p>{row.reason}</p>}
      </li>;
    })}
  </ol>;
}

function MemberAction({ action, data, busy, onCancel, onSave }) {
  const [name, setName] = useState(data.name);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState(data.role);
  const [reason, setReason] = useState('');
  const [untilAt, setUntilAt] = useState('');
  const isDelete = action === 'delete';
  const needsReason = action !== 'name';
  const statusAction = action === 'state';
  const label = action === 'name' ? '이름 수정' : action === 'rename' ? '아이디 변경' : action === 'role' ? '권한 변경'
    : isDelete ? '영구 삭제' : data.suspended ? '정지 해제' : '계정 정지';
  const invalid = (needsReason && !reason.trim()) || (isDelete && username !== data.username)
    || (action === 'role' && role === data.role) || (action === 'name' && (!name.trim() || name.trim() === data.name))
    || (action === 'rename' && (!username.trim() || username.trim() === data.username));

  function submit(event) {
    event.preventDefault();
    if (invalid || busy) return;
    if (action === 'name') onSave('', 'PUT', { username: data.username, name: name.trim() });
    else if (action === 'rename') onSave('', 'PUT', { username: username.trim(), name: data.name, reason });
    else if (action === 'role') onSave('/state', 'PATCH', { role, reason });
    else if (isDelete) onSave('', 'DELETE', { username, reason });
    else onSave('/state', 'PATCH', { suspended: !data.suspended, reason, ...(untilAt && !data.suspended ? { until_at: `${untilAt}:00+09:00` } : {}) });
  }

  return <form className={`member-action-form${isDelete ? ' member-action-form--danger' : ''}`} onSubmit={submit}>
    <h4>{label}</h4>
    {isDelete && <>
      <p>계정과 연결된 데이터가 삭제됩니다. 회원이 작성한 글에 달린 다른 회원의 댓글도 함께 삭제될 수 있습니다.</p>
      <ul><li>저장한 산행 계획 {data.plan_count}개</li><li>소유한 파티 {data.owned_party_count}개</li>
        <li>작성한 커뮤니티 글 {data.post_count}개 · 댓글 {data.comment_count}개</li></ul>
      <label>확인 아이디 <input value={username} onChange={event => setUsername(event.target.value)} placeholder={data.username} required maxLength={80} autoComplete="off" /></label>
      <small>영구 삭제 후에는 복구할 수 없습니다.</small>
    </>}
    {action === 'name' && <label>이름<input value={name} onChange={event => setName(event.target.value)} required maxLength={120} /></label>}
    {action === 'rename' && <><p>변경하면 이 회원의 기존 로그인 세션이 종료됩니다.</p><label>새 아이디<input value={username} onChange={event => setUsername(event.target.value)}
      required minLength={4} maxLength={20} pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{4,20}" title="영문과 숫자를 모두 포함한 4~20자" autoComplete="off" /></label></>}
    {action === 'role' && <><p>변경하면 이 회원의 기존 로그인 세션이 종료됩니다.</p><label>새 권한<select value={role} onChange={event => setRole(event.target.value)}>
      {Object.entries(roles).map(([value, title]) => <option key={value} value={value}>{title}</option>)}
    </select></label></>}
    {statusAction && !data.suspended && <label>자동 해제 시각 (선택 · 한국 시간)<input type="datetime-local" value={untilAt} onChange={event => setUntilAt(event.target.value)} />
      <small>비워 두면 수동으로 해제할 때까지 정지됩니다. 정지하면 기존 로그인 세션이 종료됩니다.</small></label>}
    {needsReason && <label>작업 사유<textarea value={reason} onChange={event => setReason(event.target.value)} required maxLength={500} rows={2} /></label>}
    <div className="member-buttons">
      <button type="button" onClick={onCancel} disabled={busy}>취소</button>
      <button type="submit" className={isDelete ? 'member-danger-solid' : 'member-primary'} disabled={busy || invalid}>{busy ? '처리 중…' : `${label} 확인`}</button>
    </div>
  </form>;
}

function MemberDetail({ member, highest, adminToken, adminPassword, revision, onClose, onUpdated }) {
  const dialog = useRef(null);
  const inFlight = useRef(false);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const result = useMemberRequest(`${api}/${member.id}/summary`, adminToken, adminPassword, revision);
  const data = result?.data;
  const canChangeState = !member.is_self;

  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => node.close();
  }, []);

  async function save(path, method, payload) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await requestJson(`${api}/${member.id}${path}`, {
        method, headers: { ...adminHeaders(adminToken, adminPassword), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setAction(null);
      setFeedback({ message: result.message });
      onUpdated(method === 'DELETE', result.message);
    } catch (error) {
      setFeedback({ message: error.message || '작업을 완료하지 못했습니다.', error: true });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function choose(next) {
    setFeedback(null);
    setAction(next);
  }

  return <dialog className="admin-members member-detail" aria-labelledby="member-detail-title" ref={dialog}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="member-detail__heading">
      <div><span className="member-muted">회원 상세</span><h3 id="member-detail-title">{data?.name || member.name}</h3>
        <p>{data?.username || member.username} · {roles[data?.role || member.role]}</p></div>
      <button type="button" onClick={onClose} disabled={busy}>닫기</button>
    </header>
    {feedback && <p className={`member-feedback${feedback.error ? ' member-feedback--error' : ''}`} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    {!result ? <p role="status" className="member-muted">회원 정보를 불러오는 중입니다.</p>
      : result.error ? <p role="alert" className="member-feedback member-feedback--error">{result.error}</p>
      : <>
        <dl className="member-facts">
          <div><dt>계정 상태</dt><dd><Status suspended={data.suspended} /></dd></div>
          <div><dt>가입일</dt><dd>{member.created_at?.slice(0, 10) || '자료 없음'}</dd></div>
          <div><dt>저장 계획</dt><dd>{data.plan_count}개</dd></div>
          <div><dt>참여 중인 파티</dt><dd>{data.party_count}개</dd></div>
        </dl>
        {data.suspended && <section className="member-suspension">
          <strong>정지 사유</strong><p>{data.suspension_reason || '기존 정지 기록에 사유가 없습니다.'}</p>
          <small>{data.suspended_until ? `자동 해제 ${clock.format(new Date(data.suspended_until))} (한국 시간)` : '수동 해제 전까지 정지'}</small>
        </section>}
        <section className="member-recovery"><FiShield aria-hidden="true" /><div><h4>비밀번호 재설정</h4>
          <p>{data.recovery_ready ? '복구 이메일이 등록되어 있습니다. 회원에게 로그인 화면의 비밀번호 찾기를 안내하세요.'
            : '등록된 복구 이메일이 없습니다. 회원이 로그인할 수 있다면 내 정보에서 복구 이메일을 등록하도록 안내하세요.'}</p></div>
        </section>
        <div className="member-buttons">
          <button type="button" disabled={busy} onClick={() => choose('name')}>이름 수정</button>
          {canChangeState && <button type="button" disabled={busy} onClick={() => choose('state')}>{data.suspended ? '정지 해제' : '계정 정지'}</button>}
          {highest && canChangeState && <>
            <button type="button" disabled={busy} onClick={() => choose('rename')}>아이디 변경</button>
            <button type="button" disabled={busy} onClick={() => choose('role')}>권한 변경</button>
            <button type="button" className="member-danger" disabled={busy} onClick={() => choose('delete')}>영구 삭제</button>
          </>}
        </div>
        {action && <MemberAction key={action} action={action} data={data} busy={busy} onCancel={() => choose(null)} onSave={save} />}
        <section className="member-detail__history"><h4>회원 작업 이력</h4><History rows={data.history} /></section>
      </>}
  </dialog>;
}

function Status({ suspended }) {
  return <span className="member-state" data-suspended={Boolean(suspended)}>{suspended ? '정지' : '정상'}</span>;
}

export default function AdminMembers({ adminToken, adminPassword, adminRole }) {
  const [filters, setFilters] = useState({ query: '', role: '', status: '', sort: 'default' });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const result = useMemberRequest(api, adminToken, adminPassword, revision);
  const history = useMemberRequest(historyOpen ? '/api/admin/audit' : null, adminToken, adminPassword, revision);
  const highest = adminRole === 'superadmin';
  const members = result?.data || [];
  const query = filters.query.trim().toLowerCase();
  const matches = members.filter(member => (!filters.role || member.role === filters.role)
    && (!filters.status || Boolean(member.suspended) === (filters.status === 'suspended'))
    && [member.username, member.name].some(value => value.toLowerCase().includes(query)));
  if (filters.sort !== 'default') matches.sort((a, b) => a.name.localeCompare(b.name, 'ko') * (filters.sort === 'name' ? 1 : -1));
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const visiblePage = Math.min(page, pages - 1);

  function filter(key, value) {
    setFilters(previous => ({ ...previous, [key]: value }));
    setPage(0);
  }

  return <section className="admin-members" aria-labelledby="members-heading">
    <header className="admin-section-heading">
      <div><h2 id="members-heading">회원 관리</h2><p>계정 상태와 관리 이력을 확인합니다. 새 계정은 회원이 가입 화면에서 등록합니다.</p></div>
      <button type="button" onClick={() => setRevision(value => value + 1)}>새로고침</button>
    </header>
    {announcement && <p className="member-feedback" role="status">{announcement}</p>}
    {result?.data && <dl className="member-totals">
      <div><dt><FiUsers aria-hidden="true" /> 전체 회원</dt><dd>{members.length.toLocaleString()}명</dd></div>
      <div><dt><FiUser aria-hidden="true" /> 정상 계정</dt><dd>{members.filter(member => !member.suspended).length.toLocaleString()}명</dd></div>
      <div><dt><FiShield aria-hidden="true" /> 정지 계정</dt><dd>{members.filter(member => member.suspended).length.toLocaleString()}명</dd></div>
    </dl>}
    <section className="member-surface">
      <div className="member-filters">
        <label className="member-search-label"><span><FiSearch aria-hidden="true" /> 회원 검색</span><input type="search" placeholder="아이디 또는 이름" value={filters.query} onChange={event => filter('query', event.target.value)} /></label>
        <label>역할<select value={filters.role} onChange={event => filter('role', event.target.value)}><option value="">전체 역할</option>
          {Object.entries(roles).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
        <label>상태<select value={filters.status} onChange={event => filter('status', event.target.value)}><option value="">전체 상태</option><option value="active">정상</option><option value="suspended">정지</option></select></label>
        <label>정렬<select value={filters.sort} onChange={event => filter('sort', event.target.value)}><option value="default">가입 순</option><option value="name">이름 가나다순</option><option value="reverse">이름 역순</option></select></label>
      </div>
      {!result ? <p role="status" className="member-list-message">회원 목록을 불러오는 중입니다.</p>
        : result.error ? <p role="alert" className="member-list-message">{result.error}</p>
        : matches.length === 0 ? <p className="member-list-message">조건에 맞는 회원이 없습니다.</p>
        : <>
          <div className="member-table-wrap"><table>
            <thead><tr><th scope="col">회원</th><th scope="col">역할</th><th scope="col">상태</th><th scope="col">가입일</th><th scope="col">상세</th></tr></thead>
            <tbody>{matches.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize).map(member => <tr key={member.id}>
              <th scope="row"><strong>{member.name}</strong><small>{member.username}{member.is_self && ' · 내 계정'}</small></th>
              <td>{roles[member.role]}</td><td><Status suspended={member.suspended} /></td><td>{member.created_at?.slice(0, 10) || '자료 없음'}</td>
              <td>{highest || member.role === 'member' ? <button type="button" onClick={() => { setSelected(member); setAnnouncement(''); }} aria-label={`${member.name} 회원 상세`}>상세 <FiArrowRight aria-hidden="true" /></button>
                : <small>최고 관리자 전용</small>}</td>
            </tr>)}</tbody>
          </table></div>
          <footer className="member-pagination">
            <span>검색 결과 {matches.length.toLocaleString()}명</span>
            {pages > 1 && <nav className="member-buttons" aria-label="회원 목록 페이지">
              <button type="button" disabled={visiblePage === 0} onClick={() => setPage(visiblePage - 1)}>이전</button>
              <span>{visiblePage + 1} / {pages}</span>
              <button type="button" disabled={visiblePage + 1 === pages} onClick={() => setPage(visiblePage + 1)}>다음</button>
            </nav>}
          </footer>
        </>}
    </section>
    <details className="member-surface member-audit" onToggle={event => setHistoryOpen(event.currentTarget.open)}>
      <summary>최근 회원 관리 기록</summary>
      {historyOpen && (!history ? <p role="status">기록을 불러오는 중입니다.</p> : history.error ? <p role="alert">{history.error}</p> : <History rows={history.data} showTarget />)}
    </details>
    {selected && <MemberDetail key={selected.id} member={selected} highest={highest} adminToken={adminToken} adminPassword={adminPassword}
      revision={revision} onClose={() => setSelected(null)} onUpdated={(deleted, message) => {
        setRevision(value => value + 1);
        if (deleted) { setSelected(null); setAnnouncement(message); }
      }} />}
  </section>;
}
