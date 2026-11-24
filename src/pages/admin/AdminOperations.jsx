import { useEffect, useState } from 'react';
import { API } from '../../shared/lib/config';
import { requestJson } from '../../shared/lib/apiClient';
import './MountainSearchStats.css';

import { adminHeaders } from './adminHeaders';

const statusLabels = {
  available: '연결 정상', unavailable: '연결 오류', checking: '확인 중', ok: '자료 확인',
  not_checked: '확인 전', not_configured: '설정 필요', empty: '자료 없음',
  http_error: 'HTTP 오류', provider_error: '공급기관 오류',
};
const timeLabel = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '확인 시각 없음';

export function OperationsStatus({ adminToken, adminPassword }) {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState(null);
  const [marine, setMarine] = useState(null);
  const [checking, setChecking] = useState(false);
  const [weatherChecks, setWeatherChecks] = useState(null);
  const [checkingWeather, setCheckingWeather] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const health = fetch(`${API}/api/health`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(async response => {
      if (!response.ok && response.status !== 503) throw new Error('Health unavailable');
      return response.json();
    });
    Promise.allSettled([health, requestJson('/api/mountain/catalog/status', options)]).then(([db, mountains]) => {
      if (!controller.signal.aborted) setStatus({ db: db.value?.database, mountains: mountains.value });
    });
    return () => controller.abort();
  }, [revision]);

  async function checkWeather() {
    setCheckingWeather(true);
    const probes = [
      ['일반 예보 · 서울', '/api/weather/summary?lat=37.5665&lon=126.9780', data => data.hourly?.length > 0],
      ['산악 예보 · 북한산', '/api/mountain/summary?name=' + encodeURIComponent('북한산'), data => data.hourly?.length > 0],
      ['강수 레이더', '/api/weather/radar/frames', data => data.frames?.length > 0],
    ];
    const checks = await Promise.all(probes.map(async ([name, path, hasData]) => {
      try {
        const data = await requestJson(path, { timeoutMs: 25000 });
        return { name, message: hasData(data) ? '자료 확인' : '응답에 표시할 자료 없음', checkedAt: Date.now() };
      } catch (error) {
        return { name, message: error.status ? `HTTP ${error.status} · 조회 실패` : '연결 실패', checkedAt: Date.now() };
      }
    }));
    setWeatherChecks(checks);
    setCheckingWeather(false);
  }

  async function checkMarine() {
    setChecking(true);
    setMarine(null);
    try {
      setMarine(await requestJson('/api/admin/integrations/marine/check', {
        method: 'POST', headers: adminHeaders(adminToken, adminPassword), timeoutMs: 65000,
      }));
    } catch {
      setMarine({ error: true });
    } finally {
      setChecking(false);
    }
  }

  return <section className="mountain-search-stats">
    <div className="admin-section-heading">
      <div><h3>운영 상태</h3><p>회원 DB와 산 목록 공급 상태를 확인합니다.</p></div>
      <button type="button" className="admin-operation-action" disabled={!status} onClick={() => { setStatus(null); setRevision(value => value + 1); }}>상태 새로고침</button>
    </div>
    {!status ? <p role="status">상태 확인 중…</p> : <dl className="mountain-search-totals">
      <div><dt>회원 DB</dt><dd className="admin-state" data-tone={status.db?.status === 'available' ? 'ok' : undefined}>{statusLabels[status.db?.status] || '조회 실패'}</dd><small>{timeLabel(status.db?.checked_at)}</small></div>
      <div><dt>산 목록 공급원</dt><dd className="admin-state" data-tone={status.mountains?.source_check?.status === 'ok' ? 'ok' : undefined}>{statusLabels[status.mountains?.source_check?.status] || status.mountains?.source_check?.status || '조회 실패'}</dd>
        {status.mountains && <small>제공 목록 {status.mountains.catalog_count}개 · 공급원 확인 {status.mountains.source_check?.valid_rows ?? 0}건</small>}
      </div>
    </dl>}
    <div className="admin-check-panels">
      <section className="admin-check-panel">
        <div className="admin-section-heading">
          <h4>예보·레이더 표본 점검</h4>
          <button type="button" className="admin-operation-action" disabled={checkingWeather} onClick={checkWeather}>{checkingWeather ? '점검 중…' : '예보·레이더 점검'}</button>
        </div>
        {checkingWeather ? <p role="status">일반·산악 예보와 최근 레이더 영상 목록을 확인 중입니다.</p>
          : weatherChecks ? <ul>{weatherChecks.map(check => <li key={check.name}>{check.name} · {check.message} · {timeLabel(check.checkedAt)}</li>)}</ul>
          : <p>점검 전</p>}
      </section>
      <section className="admin-check-panel">
        <div className="admin-section-heading">
          <h4>해양 API 점검</h4>
          <button type="button" className="admin-operation-action" disabled={checking} onClick={checkMarine}>{checking ? '점검 중…' : '해양 API 점검'}</button>
        </div>
        {checking && <p role="status">해양 자료 공급기관을 확인 중입니다.</p>}
        {!checking && !marine && <p>점검 전</p>}
        {marine?.error && <p role="alert">해양 API 점검 결과를 받지 못했습니다.</p>}
        {marine?.checks && <><p>{marine.success_count}/{marine.total_count} 연결 확인 · {timeLabel(marine.checked_at)}</p>
          <ul>{marine.checks.map(item => <li key={item.name}><strong>{item.name}</strong> · <span className="admin-state" data-tone={item.success ? 'ok' : 'bad'}>{item.success ? '응답 확인' : '확인 필요'}</span> · {item.detail}</li>)}</ul></>}
      </section>
    </div>
  </section>;
}

const activityLabels = {
  create: '회원 추가', update: '회원 수정', update_password: '비밀번호 변경', delete: '회원 삭제',
  community_restore: '커뮤니티 신고 초기화', community_delete: '커뮤니티 글 삭제',
  suspend: '회원 정지', restore: '회원 복구', notice_create: '공지 등록', notice_update: '공지 수정', notice_delete: '공지 삭제',
};

export function AdminActivity({ adminToken, adminPassword }) {
  const [filters, setFilters] = useState({ days: '30', kind: 'all', target: '' });
  const [query, setQuery] = useState({ filters, revision: 0 });
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    requestJson(`/api/admin/activity?${new URLSearchParams(query.filters)}`, {
      headers: adminHeaders(adminToken, adminPassword), signal: controller.signal,
    }).then(rows => { if (!controller.signal.aborted) setResult({ query, rows }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ query, error: true }); });
    return () => controller.abort();
  }, [query, adminToken, adminPassword]);
  const current = result?.query === query ? result : null;
  return <section className="mountain-search-stats">
    <h3>관리자 작업 기록</h3>
    <p>최대 100건을 표시합니다. 공용 비밀번호로 수행한 작업은 수행자를 개별 식별할 수 없습니다.</p>
    <form className="mountain-search-filters" onSubmit={event => { event.preventDefault(); setQuery(prev => ({ filters, revision: prev.revision + 1 })); }}>
      <label>기간 <select value={filters.days} onChange={e => setFilters({ ...filters, days: e.target.value })}><option value="7">7일</option><option value="30">30일</option><option value="90">90일</option></select></label>
      <label>작업 <select value={filters.kind} onChange={e => setFilters({ ...filters, kind: e.target.value })}><option value="all">전체</option><option value="member">회원</option><option value="notice">공지</option></select></label>
      <label>대상 <input maxLength={80} value={filters.target} onChange={e => setFilters({ ...filters, target: e.target.value })} /></label>
      <button type="submit">조회</button>
    </form>
    {!current ? <p role="status">기록 조회 중…</p> : current.error ? <p role="alert">기록 조회에 실패했습니다.</p> :
      current.rows.length ? <div className="mountain-search-table"><table>
        <thead><tr><th>기록 시각</th><th>관리자</th><th>작업</th><th>대상</th></tr></thead>
        <tbody>{current.rows.map(row => <tr key={row.id}><td>{row.created_at.replace('T', ' ')}</td><td>{row.actor}</td><td>{activityLabels[row.action] || row.action}</td><td>{row.target_username}</td></tr>)}</tbody>
      </table></div> : <p>기록이 없습니다.</p>}
  </section>;
}
