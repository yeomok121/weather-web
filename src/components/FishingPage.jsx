import { useCallback, useEffect, useState } from 'react';
import { FiAnchor, FiRefreshCw, FiWind, FiActivity, FiClock, FiInfo, FiMapPin, FiDroplet } from 'react-icons/fi';
import { API } from '../config';

const prettyKey = (key = '') => ({
  WH: '유의파고', WH_SIG: '유의파고', WH_MAX: '최대파고', WH_MAX_: '최대파고', WS: '풍속', WS1: '풍속',
  WD: '풍향', WD1: '풍향', TW: '해수면 온도', TA: '기온', HM: '습도', PA: '해면기압', WP: '파주기',
  STN_KO: '관측 지점', STN_ID: '지점 ID', TM: '관측 시각', REG_ID: '예보 구역', TM_FC: '예보 발표',
  TM_EF: '예보 시각', W1: '풍향 시작', W2: '풍향 종료', ST: '강수 확률', SKY: '하늘 상태', PREP: '강수 형태', WF: '예보',
})[key] || key.replaceAll('_', ' ');

function collectValues(value, prefix = '') {
  if (value == null || typeof value !== 'object') return prefix ? [[prefix, value]] : [];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectValues(item, `${prefix}[${index + 1}]`));
  return Object.entries(value).flatMap(([key, item]) => collectValues(item, prefix ? `${prefix} · ${key}` : key));
}

function DataRows({ rows, type }) {
  if (!rows?.length) return <p className="fish-empty">아직 표시할 자료가 없습니다. {type === 'forecast' ? '예보 구역이나 발표 시각을 확인해 주세요.' : '기관 자료 갱신을 기다리거나 새로고침해 주세요.'}</p>;
  return <div className="fish-data-list">{rows.slice(0, 6).map((row, index) => {
    const entries = Object.entries(row).filter(([key]) => key !== 'fields').slice(0, 8);
    const rawFields = row.fields || [];
    return <article className="fish-data-row" key={`${type}-${index}`}>
      {entries.length ? entries.map(([key, value]) => <span className="fish-data-chip" key={key}><small>{prettyKey(key)}</small><b>{String(value)}</b></span>) : <span className="fish-data-chip fish-raw">{rawFields.slice(0, 8).join(' · ')}</span>}
    </article>;
  })}</div>;
}

export default function FishingPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/api/fishing/summary?place=${encodeURIComponent('김녕 앞바다')}&region=`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || '해양 자료를 불러오지 못했습니다.');
      setData(body);
    } catch (e) { setError(e.message || '서버에 연결할 수 없습니다.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sources = data?.sources || {};
  const buoyRows = sources.buoy?.records || [];
  const firstBuoy = buoyRows[0] || {};
  const buoyEntries = Object.entries(firstBuoy).filter(([key]) => key !== 'fields');
  const tideValues = collectValues(sources.tide?.data).slice(0, 12);

  return <main className="fishing-page">
    <section className="fish-hero glass-card">
      <div className="fish-hero-copy">
        <span className="fish-eyebrow"><FiAnchor /> WEATHER+ · 바다</span>
        <h1>오늘, 바다에 나가도 될까?</h1>
        <p>해상예보와 부이 실황, 조위 흐름을 한 화면에서 확인하세요.</p>
        <div className="fish-place"><FiMapPin /> 김녕 앞바다 <span>· 조위는 김녕 기준, 해상예보는 전국 발표 자료</span></div>
        <button className="fish-refresh" onClick={load} disabled={loading}><FiRefreshCw className={loading ? 'fish-spin' : ''} /> {loading ? '자료 확인 중' : '최신 자료 불러오기'}</button>
      </div>
      <div className="fish-hero-art"><div className="fish-orb"><FiAnchor /></div><span>CHECK THE SEA</span></div>
    </section>

    {error && <div className="fish-error" role="alert"><FiInfo /> {error}<button onClick={load}>다시 시도</button></div>}
    <div className="fish-data-meta"><FiClock /> 기준 자료 갱신 {data?.updated_at || '확인 전'} <span>· 기관 원자료 기준</span></div>

    <section className="fish-metrics">
      <article className="fish-panel fish-metric-panel"><div className="fish-panel-title"><FiActivity /><div><h2>바다 실황</h2><p>기상청 전체 부이 관측 중 최근 자료</p></div></div>
        <div className="fish-metric-grid">
          {buoyEntries.slice(0, 4).map(([key, value]) => <div className="fish-metric" key={key}><span>{prettyKey(key)}</span><strong>{value || '—'}<small>{({WH:' m',WH_SIG:' m',WS:' m/s',WS1:' m/s',TW:'°C',TA:'°C',HM:'%'})[key] || ''}</small></strong></div>)}
          {!buoyEntries.length && <p className="fish-empty">관측 자료를 불러오면 파고와 바람을 이곳에 표시합니다.</p>}
        </div>
        <DataRows rows={buoyRows.slice(1)} type="buoy" />
        {data?.errors?.buoy && <p className="fish-inline-error">{data.errors.buoy}</p>}
      </article>

      <article className="fish-panel fish-tide-panel"><div className="fish-panel-title"><FiDroplet /><div><h2>오늘의 조위</h2><p>TideBED 예측 · 김녕 기준</p></div></div>
        {tideValues.length ? <div className="fish-tide-values">{tideValues.map(([key, value]) => <div className="fish-tide-item" key={key}><span>{prettyKey(key.split(' · ').at(-1))}</span><b>{String(value)}</b></div>)}</div> : <p className="fish-empty">조위 자료를 불러오면 시간대별 예측을 표시합니다.</p>}
        {data?.errors?.tide && <p className="fish-inline-error">{data.errors.tide}</p>}
      </article>
    </section>

    <section className="fish-panel fish-forecast-panel"><div className="fish-panel-title"><FiWind /><div><h2>해상예보</h2><p>기상청 단기 해상예보 · 전국 발표 자료</p></div></div>
      <DataRows rows={sources.forecast?.records} type="forecast" />
      {data?.errors?.forecast && <p className="fish-inline-error">{data.errors.forecast}</p>}
    </section>
    <p className="fish-disclaimer"><FiInfo /> {data?.notice || '기관 예보와 관측을 참고용으로 제공합니다. 출조 전 기상특보와 현장 상황을 별도로 확인하세요.'}</p>
  </main>;
}
