// 관리자: 커뮤니티 신고 게시판 — 신고 들어온 글을 게시판처럼 보고, 숨김 해제(신고 초기화)·삭제
// 서버: /api/admin/community/reports, /api/admin/community/posts/{id}(/restore) — 관리자 계정·공용 비밀번호 모두 가능
import { useEffect, useState } from 'react';
import { requestJson } from '../../shared/lib/apiClient';
import { API } from '../../shared/lib/config';
import { adminHeaders } from './adminHeaders';
import './CommunityReports.css';

const FILTERS = [['all', '전체'], ['hidden', '숨김됨'], ['visible', '보이는 중']];
const KIND = { 자랑: '조과 자랑', 팁: '낚시 팁', 공지: '공지' };
const photoUrl = (id) => `${API}/api/community/photos/${id}`;
const when = (iso) => (iso ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)) : '—');

export default function CommunityReports({ adminToken, adminPassword }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [board, setBoard] = useState({ key: null, items: [], total: 0, per_page: 20, error: '' });
  const [selected, setSelected] = useState(null); // 신고 게시판의 한 줄
  const [detail, setDetail] = useState({ id: null, post: null, error: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const headers = adminHeaders(adminToken, adminPassword);
  const key = `${status}|${page}|${reload}`;

  useEffect(() => {
    const controller = new AbortController();
    requestJson(`/api/admin/community/reports?status=${status}&page=${page}`, { headers: adminHeaders(adminToken, adminPassword), signal: controller.signal })
      .then((data) => setBoard({ key, items: data.items, total: data.total, per_page: data.per_page, error: '' }))
      .catch((e) => { if (!controller.signal.aborted) setBoard({ key, items: [], total: 0, per_page: 20, error: e.message || '신고 목록을 불러오지 못했습니다.' }); });
    return () => controller.abort();
  }, [key, status, page, adminToken, adminPassword]);

  useEffect(() => {
    if (!selected) return undefined;
    const controller = new AbortController();
    requestJson(`/api/admin/community/posts/${selected.id}`, { headers: adminHeaders(adminToken, adminPassword), signal: controller.signal })
      .then((post) => setDetail({ id: selected.id, post, error: '' }))
      .catch((e) => { if (!controller.signal.aborted) setDetail({ id: selected.id, post: null, error: e.message || '글을 불러오지 못했습니다.' }); });
    return () => controller.abort();
  }, [selected, adminToken, adminPassword]);

  const act = async (kind) => {
    const post = selected;
    const ok = kind === 'restore'
      ? window.confirm(`'${post.title}'의 신고 ${post.report_count}건을 지우고 다시 보이게 할까요?`)
      : window.confirm(`'${post.title}' 글을 삭제할까요? 사진·댓글도 함께 지워지고 되돌릴 수 없습니다.`);
    if (!ok) return;
    setBusy(true); setMessage('');
    try {
      const res = await requestJson(`/api/admin/community/posts/${post.id}${kind === 'restore' ? '/restore' : ''}`, { method: kind === 'restore' ? 'POST' : 'DELETE', headers });
      setMessage(res.message); setSelected(null);
      setBoard((b) => ({ ...b, items: b.items.filter((row) => row.id !== post.id), total: Math.max(0, b.total - 1) })); // 바로 목록에서 빼고
      setReload((n) => n + 1); // 서버 목록으로 다시 맞춤
    } catch (e) { setMessage(e.message || '처리하지 못했습니다.'); } finally { setBusy(false); }
  };

  const loading = board.key !== key;
  const lastPage = Math.max(1, Math.ceil(board.total / board.per_page));
  const shown = detail.id === selected?.id ? detail : { post: null, error: '' };

  return <section className="admin-community-reports" aria-label="커뮤니티 신고">
    <header>
      <div><h2>커뮤니티 신고</h2><p>신고가 들어온 낚시 커뮤니티 글입니다. 서로 다른 회원 5명이 신고하면 자동으로 숨겨집니다. 신고 수는 관리자에게만 보입니다.</p></div>
      <button type="button" onClick={() => setReload((n) => n + 1)}>새로고침</button>
    </header>
    <div className="acr-filters" role="tablist" aria-label="상태">{FILTERS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={status === id}
      className={status === id ? 'on' : ''} onClick={() => { setStatus(id); setPage(1); setSelected(null); }}>{label}</button>)}
      <span>{loading ? '불러오는 중…' : `총 ${board.total}건`}</span></div>
    {message && <p className="acr-message" role="status">{message}</p>}
    {board.error ? <p className="acr-empty" role="alert">{board.error}</p>
      : !loading && board.items.length === 0 ? <p className="acr-empty">신고된 글이 없습니다.</p>
        : <div className="admin-table-scroll"><table className="acr-table">
          <thead><tr><th>번호</th><th>분류</th><th>제목</th><th>작성자</th><th>신고</th><th>상태</th><th>최근 신고</th></tr></thead>
          <tbody>{board.items.map((row) => <tr key={row.id} className={`${selected?.id === row.id ? 'on' : ''} ${row.hidden ? 'hidden-post' : ''}`}
            onClick={() => setSelected(selected?.id === row.id ? null : row)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(row); }}>
            <td>{row.id}</td>
            <td><span className={`acr-kind k-${row.category}`}>{KIND[row.category] || row.category}</span></td>
            <td><span className="acr-title">{row.photo_id && <img src={photoUrl(row.photo_id)} alt="" loading="lazy" />}<b>{row.title}</b>{row.photo_count > 1 && <small> 사진 {row.photo_count}</small>}</span></td>
            <td>{row.author}<small>{row.author_username}</small></td>
            <td><b className={`acr-count ${row.report_count >= 5 ? 'high' : ''}`}>{row.report_count}</b></td>
            <td>{row.hidden ? <span className="acr-state hidden">숨김</span> : <span className="acr-state">공개</span>}</td>
            <td>{when(row.last_reported_at)}</td>
          </tr>)}</tbody>
        </table></div>}
    {lastPage > 1 && <div className="acr-pages"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</button>
      <span>{page} / {lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>다음</button></div>}

    {selected && <section className="acr-detail" aria-label="신고된 글 자세히">
      <div className="acr-detail-head">
        <h3><span className={`acr-kind k-${selected.category}`}>{KIND[selected.category]}</span> {selected.title}</h3>
        <p>{selected.author}({selected.author_username}) · 작성 {when(selected.created_at)} · 신고 {selected.report_count}건 · {selected.hidden ? '숨김 상태' : '공개 상태'}</p>
      </div>
      {shown.error ? <p role="alert">{shown.error}</p> : !shown.post ? <p>글을 불러오는 중…</p> : <div className="acr-post">
        {shown.post.photos.length > 0 && <div className="acr-photos">{shown.post.photos.map((ph) => <a key={ph.id} href={photoUrl(ph.id)} target="_blank" rel="noreferrer"><img src={photoUrl(ph.id)} alt="첨부 사진" /></a>)}</div>}
        {(shown.post.species || shown.post.length_cm) && <p className="acr-facts">{shown.post.species} {shown.post.length_cm != null && `${shown.post.length_cm}cm`} {shown.post.point_name && `· ${shown.post.point_name}`}</p>}
        {shown.post.body ? <p className="acr-body">{shown.post.body}</p> : <p className="acr-body muted">(본문 없음)</p>}
        <p className="acr-meta">공감 {shown.post.like_count} · 댓글 {shown.post.comment_count}</p>
      </div>}
      <h4>신고 사유 ({selected.reasons.length}{selected.report_count > selected.reasons.length ? ` / ${selected.report_count}` : ''})</h4>
      <ul className="acr-reasons">{selected.reasons.map((r, i) => <li key={i}><b>{r.reason}</b><small>{r.reporter} · {when(r.created_at)}</small></li>)}</ul>
      <div className="acr-actions">
        <button type="button" onClick={() => act('restore')} disabled={busy}>{selected.hidden ? '숨김 해제 · 신고 초기화' : '신고 초기화 (문제없음)'}</button>
        <button type="button" className="danger" onClick={() => act('delete')} disabled={busy}>글 삭제</button>
        <a href={`/fishing/community?post=${selected.id}`} target="_blank" rel="noreferrer">커뮤니티에서 보기</a>
      </div>
    </section>}
  </section>;
}
