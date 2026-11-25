import { useEffect, useState } from 'react';
import { requestJson } from '../../shared/lib/apiClient';
import './MountainSearchStats.css';

const labels = { course: '코스 선택 가능', no_course: '코스 미제공', not_found: '결과 없음', error: '조회 오류', found: '검색 성공' };
const timeFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' });

export default function MountainSearchStats({ adminToken, adminPassword, onCandidate, days }) {
  const [service, setService] = useState('mountain');
  const outcomes = service === 'mountain' ? ['course', 'no_course', 'not_found', 'error']
    : service === 'weather' ? ['found', 'not_found', 'error'] : ['found'];
  const rankingGroups = service === 'mountain'
    ? [['not_found', '추가 후보 · 결과 없음 TOP 10'], ['no_course', '코스 보강 후보 TOP 10']]
    : service === 'weather' ? [['found', '많이 검색한 지역 TOP 10'], ['not_found', '결과 없는 지역 TOP 10']]
    : [['found', '많이 선택한 포인트 TOP 10']];
  const [termDraft, setTermDraft] = useState('');
  const [term, setTerm] = useState('');
  const [outcome, setOutcome] = useState('all');
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const requestKey = `${service}:${days}:${outcome}:${term}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : { 'x-admin-password': adminPassword || '' };
    requestJson(`/api/admin/searches?service=${service}&days=${days}&outcome=${outcome}&term=${encodeURIComponent(term)}`, { headers, signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult({ requestKey, data }); })
      .catch(() => { if (!controller.signal.aborted) setError(requestKey); });
    return () => controller.abort();
  }, [adminToken, adminPassword, service, days, outcome, term, requestKey]);

  const data = result?.requestKey === requestKey ? result.data : null;
  const total = Object.values(data?.totals || {}).reduce((sum, count) => sum + count, 0);
  return <section className="mountain-search-stats" aria-labelledby="mountain-search-title">
    <h3 id="mountain-search-title">검색 현황</h3>
    <p>{service === 'fishing' ? '포인트 검색·지도 목록에서 선택한 횟수입니다.' : '검색을 실행하거나 검색창 결과를 선택하면 기록합니다.'} 최근 로그는 최대 100건입니다.</p>
    <div className="mountain-search-filters">
      <label>서비스 <select value={service} onChange={event => { setService(event.target.value); setOutcome('all'); setTerm(''); setTermDraft(''); }}>
        <option value="mountain">산행 날씨</option><option value="weather">일반 날씨</option><option value="fishing">바다 낚시</option>
      </select></label>
      <button type="button" onClick={() => setRevision(value => value + 1)}>새로고침</button>
    </div>
    {error === requestKey ? <p role="alert">검색 현황을 불러오지 못했습니다.</p> : !data ? <p role="status">검색 현황을 불러오는 중…</p> : <>
      <dl className="mountain-search-totals">
        <div><dt>{service === 'fishing' ? '포인트 선택' : '기록된 검색'}</dt><dd>{total.toLocaleString()}건</dd></div>
        {service !== 'fishing' && <div><dt>결과 없음 비율</dt><dd>{total ? `${((data.totals.not_found || 0) / total * 100).toFixed(1)}%` : '—'}</dd></div>}
        {outcomes.map(key => <div key={key}><dt>{labels[key]}</dt><dd>{(data.totals[key] || 0).toLocaleString()}건</dd></div>)}
      </dl>
      {data.daily?.length > 0 && <details><summary>일별 {service === 'fishing' ? '선택' : '검색'} 건수</summary>
        <ul>{data.daily.map(row => <li key={row.day}>{row.day} · {row.count}건</li>)}</ul>
      </details>}
      <div className="mountain-search-rankings">
        {rankingGroups.map(([key, title]) => (
          <section key={key}><h4>{title}</h4>
            {data.rankings[key].length ? <ol>{data.rankings[key].map(row => <li key={row.term}>{row.term} <strong>{row.count}건</strong>
              {service === 'mountain' && onCandidate && <button type="button" onClick={() => onCandidate(row.term, key === 'not_found' ? 'new' : 'course')}>후보 검토</button>}</li>)}</ol> : <p>해당 기록이 없습니다.</p>}
          </section>
        ))}
      </div>
    </>}
    <h4>최근 {service === 'fishing' ? '선택' : '검색'} 로그</h4>
    <form className="mountain-search-filters" onSubmit={event => { event.preventDefault(); setTerm(termDraft.trim()); }}>
      <label>이름 <input maxLength={40} value={termDraft} onChange={event => setTermDraft(event.target.value)} /></label>
      <button type="submit">로그 검색</button>
    </form>
    <label>결과 <select value={outcome} onChange={event => setOutcome(event.target.value)}>
      <option value="all">전체</option>
      {outcomes.map(key => <option key={key} value={key}>{labels[key]}</option>)}
    </select></label>
    {data && (data.recent.length ? <div className="mountain-search-table"><table>
      <thead><tr><th scope="col">검색 시각 (한국)</th><th scope="col">지역·산·포인트</th><th scope="col">결과</th></tr></thead>
      <tbody>{data.recent.map(row => <tr key={row.id}>
        <td>{timeFormat.format(new Date(row.searched_at))}</td><td>{row.term}</td><td>{labels[row.outcome]}</td>
      </tr>)}</tbody>
    </table></div> : <p>선택한 조건의 기록이 없습니다.</p>)}
  </section>;
}
