import { useCallback, useEffect, useState } from 'react';
import { FiAnchor, FiRefreshCw, FiWind, FiActivity, FiClock, FiInfo, FiMapPin, FiDroplet } from 'react-icons/fi';
import { API } from '../config';

const prettyKey = (key = '') => ({
  WH: '유의파고', WH_SIG: '유의파고', WH_MAX: '최대파고', WH_MAX_: '최대파고', WS: '풍속', WS1: '풍속', WS2: '풍속 상한',
  WD: '풍향', WD1: '풍향', TW: '해수면 온도', TA: '기온', HM: '습도', PA: '해면기압', WP: '파주기',
  STN_KO: '관측 지점', STN_ID: '지점 ID', TM: '관측 시각', REG_ID: '예보 구역', TM_FC: '예보 발표',
  TM_EF: '예보 시각', TM_FC: '발표 시각', W1: '풍향 시작', W2: '풍향 종료', ST: '강수 확률', SKY: '하늘 상태', PREP: '강수 형태', WF: '날씨',
  LON: '경도', LAT: '위도', TP: '관측 종류', WS2: '풍속 범위', WH1: '파고 시작', WH2: '파고 범위',
  obsvtrNm: '기준 관측소', obsrvnDt: '예측 시각', obsrvnHgt: '예측 조위',
  distance_km: '기준 위치와 거리',
})[key] || key.replaceAll('_', ' ');

function formatKmaTime(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10) return value || '—';
  return `${digits.slice(4, 6)}/${digits.slice(6, 8)} ${digits.slice(8, 10)}시`;
}

function forecastCards(row) {
  const windDirection = [row.W1, row.W2].filter(Boolean).join(' → ') || '—';
  const windSpeed = [row.WS1, row.WS2].filter(Boolean).join('–');
  const waveHeight = [row.WH1, row.WH2].filter(Boolean).join('–');
  const precipitation = ({ '0': '없음', '1': '비', '2': '비·눈', '3': '눈', '4': '눈·비' })[row.PREP] || '—';
  return [
    ['예보 시각', formatKmaTime(row.TM_EF)],
    ['날씨', row.WF || '—'],
    ['파고', waveHeight ? `${waveHeight} m` : '—'],
    ['풍향', windDirection],
    ['풍속', windSpeed ? `${windSpeed} m/s` : '—'],
    ['강수', precipitation],
  ];
}

function DataRows({ rows, type }) {
  if (!rows?.length) return <p className="fish-empty">아직 표시할 자료가 없습니다. {type === 'forecast' ? '예보 구역이나 발표 시각을 확인해 주세요.' : '기관 자료 갱신을 기다리거나 새로고침해 주세요.'}</p>;
  return <div className="fish-data-list">{rows.slice(0, 6).map((row, index) => {
    const entries = type === 'forecast'
      ? forecastCards(row)
      : ['STN_KO', 'TM', 'distance_km', 'WH', 'WS', 'WD', 'TW', 'TA']
        .filter((key) => row[key] != null)
        .map((key) => [key, key === 'TM' ? formatKmaTime(row[key]) : key === 'distance_km' ? `약 ${row[key]} km` : row[key]]);
    const rawFields = row.fields || [];
    return <article className={`fish-data-row ${type === 'forecast' ? 'fish-forecast-row' : ''}`} key={`${type}-${index}`}>
      {entries.length ? entries.map(([key, value]) => <span className="fish-data-chip" key={key}><small>{prettyKey(key)}</small><b>{String(value)}</b></span>) : <span className="fish-data-chip fish-raw">{rawFields.slice(0, 8).join(' · ')}</span>}
    </article>;
  })}</div>;
}

async function fetchFishingSummary() {
  const query = new URLSearchParams({
    place: '추자도 해상',
    lat: '33.96194',
    lon: '126.44527',
  });
  const response = await fetch(`${API}/api/fishing/summary?${query}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail || '해양 자료를 불러오지 못했습니다.');
  return body;
}

export default function FishingPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await fetchFishingSummary()); }
    catch (e) { setError(e.message || '서버에 연결할 수 없습니다.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    fetchFishingSummary()
      .then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) setError(e.message || '서버에 연결할 수 없습니다.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const sources = data?.sources || {};
  const buoyRows = sources.buoy?.records || [];
  const firstBuoy = buoyRows[0] || {};
  const buoyEntries = Object.entries(firstBuoy).filter(([key]) => key !== 'fields');
  const tideItems = sources.tide?.data?.body?.items?.item || [];
  const tideRows = (Array.isArray(tideItems) ? tideItems : [tideItems])
    .filter((item) => Date.parse(`${String(item.obsrvnDt || '').replace(' ', 'T')}:00+09:00`) >= Date.now())
    .slice(0, 6);
  const metrics = ['WH', 'WS', 'WD', 'TW', 'TA', 'HM'].filter((key) => firstBuoy[key] != null).slice(0, 4);

  return <main className="fishing-page">
    <section className="fish-hero glass-card">
      <div className="fish-hero-copy">
        <span className="fish-eyebrow"><FiAnchor /> WEATHER+ · 바다</span>
        <h1>오늘, 바다에 나가도 될까?</h1>
        <p>해상예보와 부이 실황, 조위 흐름을 한 화면에서 확인하세요.</p>
        <div className="fish-place"><FiMapPin /> {data?.place || '추자도 해상'} <span>· 관측은 기준 위치에 가까운 부이, 조위는 인근 TideBED 관측소 기준</span></div>
        <button className="fish-refresh" onClick={load} disabled={loading}><FiRefreshCw className={loading ? 'fish-spin' : ''} /> {loading ? '자료 확인 중' : '최신 자료 불러오기'}</button>
      </div>
      <div className="fish-hero-art"><div className="fish-orb"><FiAnchor /></div><span>CHECK THE SEA</span></div>
    </section>

    {error && <div className="fish-error" role="alert"><FiInfo /> {error}<button onClick={load}>다시 시도</button></div>}
    <div className="fish-data-meta"><FiClock /> 자료 조회 시각 {data?.updated_at || '확인 전'} <span>· 관측·예보 시각은 각 항목에 표시</span></div>

    <section className="fish-metrics">
      <article className="fish-panel fish-metric-panel"><div className="fish-panel-title"><FiActivity /><div><h2>바다 실황</h2><p>추자도 해상 기준 가까운 기상청 부이 관측</p></div></div>
        <div className="fish-metric-grid">
          {metrics.map((key) => <div className="fish-metric" key={key}><span>{prettyKey(key)}</span><strong>{firstBuoy[key] || '—'}<small>{({WH:' m',WH_SIG:' m',WS:' m/s',WS1:' m/s',TW:'°C',TA:'°C',HM:'%'})[key] || ''}</small></strong></div>)}
          {!buoyEntries.length && <p className="fish-empty">관측 자료를 불러오면 파고와 바람을 이곳에 표시합니다.</p>}
        </div>
        {firstBuoy.STN_KO && <p className="fish-station">가장 가까운 관측 지점 <b>{firstBuoy.STN_KO}</b> · 약 {firstBuoy.distance_km ?? '—'} km · {firstBuoy.TM}</p>}
        <DataRows rows={buoyRows.slice(1)} type="buoy" />
        {data?.errors?.buoy && <p className="fish-inline-error">{data.errors.buoy}</p>}
      </article>

      <article className="fish-panel fish-tide-panel"><div className="fish-panel-title"><FiDroplet /><div><h2>앞으로의 조위</h2><p>TideBED 예측 · 추자도 인근 기준항 · 단위 cm</p></div></div>
        {tideRows.length ? <div className="fish-tide-values">{tideRows.map((item, index) => <div className="fish-tide-item" key={`${item.obsrvnDt}-${index}`}><span>{prettyKey('obsrvnDt')}</span><b>{item.obsrvnDt || '—'}</b><span>{prettyKey('obsrvnHgt')}</span><b>{item.obsrvnHgt ?? '—'} cm</b></div>)}</div> : <p className="fish-empty">앞으로의 조위 자료가 없습니다. 잠시 뒤 새로고침해 주세요.</p>}
        {data?.errors?.tide && <p className="fish-inline-error">{data.errors.tide}</p>}
      </article>
    </section>

    <section className="fish-panel fish-forecast-panel"><div className="fish-panel-title"><FiWind /><div><h2>해상예보</h2><p>기상청 단기 해상예보 · {data?.region_name || '제주 인근 해역'}{sources.forecast?.records?.[0]?.TM_FC ? ` · 발표 ${formatKmaTime(sources.forecast.records[0].TM_FC)}` : ''}</p></div></div>
      <DataRows rows={sources.forecast?.records} type="forecast" />
      {data?.errors?.forecast && <p className="fish-inline-error">{data.errors.forecast}</p>}
    </section>
    <p className="fish-disclaimer"><FiInfo /> {data?.notice || '기관 예보와 관측을 참고용으로 제공합니다. 출조 전 기상특보와 현장 상황을 별도로 확인하세요.'}</p>
  </main>;
}
