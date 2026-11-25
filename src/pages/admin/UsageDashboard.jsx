import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { requestJson } from '../../shared/lib/apiClient';
import { adminHeaders } from './adminHeaders';
import MountainSearchStats from './MountainSearchStats';
import './UsageDashboard.css';

const views = { overview: '요약', pages: '인기 페이지', search: '검색 기록' };
const pageNames = { weather: '일반 날씨', mountain: '산행 날씨', fishing: '바다 낚시', community: '낚시 커뮤니티' };
const metrics = [['visitors', '순방문 브라우저', '곳'], ['views', '페이지 조회', '회'], ['searches', '기록된 검색', '건'], ['fishing_selections', '낚시 포인트 선택', '건']];
const numbers = new Intl.NumberFormat('ko-KR');
const collectionDate = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long' });
const number = value => value == null ? '미수집' : numbers.format(value);
const dayLabel = value => value.slice(5).replace('-', '/');

function TrafficTrend({ rows }) {
  return <section className="usage-panel">
    <h3>일별 방문·조회 추이</h3>
    <p>일별 방문 수는 같은 브라우저를 그날 한 번만 셉니다.</p>
    <div className="usage-trend">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e3ebee" />
          <XAxis dataKey="day" tickFormatter={dayLabel} minTickGap={16} fontSize={11} />
          <YAxis allowDecimals={false} width={40} fontSize={11} />
          <Tooltip labelFormatter={dayLabel} />
          <Legend />
          <Bar dataKey="visitors" name="순방문 브라우저" fill="#197562" radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Bar dataKey="views" name="페이지 조회" fill="#476e9c" radius={[3, 3, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <details className="usage-chart-table"><summary>날짜별 수치 보기</summary>
      <div className="mountain-search-table"><table>
        <thead><tr><th scope="col">날짜</th><th scope="col">순방문 브라우저</th><th scope="col">페이지 조회</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.day}><th scope="row">{dayLabel(row.day)}</th><td>{number(row.visitors)}</td><td>{number(row.views)}</td></tr>)}</tbody>
      </table></div>
    </details>
  </section>;
}

function Ranking({ title, rows, label }) {
  const largest = rows[0]?.views || 1;
  return <section className="usage-panel">
    <h3>{title}</h3>
    {rows.length ? <ol className="usage-ranking">
      {rows.map(row => <li key={label(row)}>
        <div><span>{label(row)}</span><strong>{number(row.views)}회</strong></div>
        <span className="usage-ranking__track" aria-hidden="true"><span style={{ width: `${row.views / largest * 100}%` }} /></span>
      </li>)}
    </ol> : <p>이 기간에 기록된 조회가 없습니다.</p>}
  </section>;
}

export default function UsageDashboard({ adminToken, adminPassword }) {
  const [view, setView] = useState('overview');
  const [days, setDays] = useState(7);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${days}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    requestJson(`/api/admin/usage?days=${days}`, { headers: adminHeaders(adminToken, adminPassword), signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult({ key, data }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ key, error: true }); });
    return () => controller.abort();
  }, [adminToken, adminPassword, days, key]);

  const current = result?.key === key ? result : null;
  const data = current?.data;
  const totals = data?.totals;
  const noResultsRate = totals?.searches ? (totals.no_results / totals.searches * 100).toFixed(1) : '0';

  return <section className="usage-dashboard" aria-labelledby="admin-usage-heading">
    <header className="usage-dashboard__header">
      <div><h2 id="admin-usage-heading">이용 현황</h2><p>날씨·산행·낚시 서비스 이용 통계</p></div>
      <label>기간 <select aria-label="집계 기간" value={days} onChange={event => setDays(Number(event.target.value))}>
        <option value={7}>최근 7일</option><option value={30}>최근 30일</option>
      </select></label>
    </header>
    <nav className="usage-dashboard__views" aria-label="이용 현황 메뉴">
      {Object.entries(views).map(([id, title]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{title}</button>)}
    </nav>
    {view === 'search' ? <MountainSearchStats adminToken={adminToken} adminPassword={adminPassword} days={days} />
      : !current ? <p role="status">이용 통계를 불러오는 중입니다.</p>
      : current.error ? <div className="usage-panel" role="alert"><p>이용 통계를 불러오지 못했습니다.</p><button type="button" onClick={() => setRevision(value => value + 1)}>다시 시도</button></div>
      : <>
        <p className="usage-coverage">
          {data.started_at ? `방문 기록 수집 시작 ${collectionDate.format(new Date(data.started_at))} · 한국 시간` : '아직 수집된 방문 기록이 없습니다. 검색 통계는 기존 기록을 사용합니다.'}
        </p>
        {view === 'overview' && <>
          <dl className="usage-metrics">{metrics.map(([id, label, unit]) => <div key={id}>
            <dt>{label}</dt><dd>{number(totals[id])}{totals[id] != null && <small>{unit}</small>}</dd>
          </div>)}</dl>
          <p className="usage-coverage">순방문은 선택 기간에 같은 브라우저를 한 번만 셉니다. 브라우저나 기기가 다르면 따로 집계될 수 있습니다.</p>
        </>}
        {data.started_at && <div className="usage-charts">
          {view === 'overview' ? <TrafficTrend rows={data.daily} />
            : <Ranking title="산행 날씨에서 많이 본 산" rows={data.mountains} label={row => row.mountain} />}
          <Ranking title="가장 많이 본 페이지" rows={data.pages} label={row => pageNames[row.page]} />
        </div>}
        {view === 'overview' && <section className="usage-panel usage-search-summary">
          <div><h3>검색에서 결과 없음</h3><p><strong>{number(totals.no_results)}건</strong> {totals.searches > 0 && <span>· 기록된 검색 {number(totals.searches)}건 중 {noResultsRate}%</span>}</p></div>
          <button type="button" onClick={() => setView('search')}>검색 기록 보기</button>
        </section>}
      </>}
  </section>;
}
