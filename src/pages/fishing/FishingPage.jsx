import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiAnchor, FiRefreshCw, FiWind, FiActivity, FiClock, FiInfo, FiMapPin, FiDroplet } from 'react-icons/fi';
import { API } from '../../shared/lib/config';

const FISHING_AREAS = [
  { id: 'chuja', place: '추자도 해상', region: '12D00000', regionName: '제주도 전해상', lat: 33.96194, lon: 126.44527 },
  { id: 'west', place: '태안 앞바다', region: '12A20100', regionName: '서해중부앞바다', lat: 36.7, lon: 126.1 },
  { id: 'southeast', place: '부산 앞바다', region: '12B20100', regionName: '남해동부앞바다', lat: 35.1, lon: 129.2 },
];

const prettyKey = (key = '') => ({
  WH: '유의파고', WH_SIG: '유의파고', WH_MAX: '최대파고', WS: '풍속', WS1: '풍속', WS2: '풍속 상한',
  WD: '풍향', WD1: '풍향', TW: '해수면 온도', TA: '기온', HM: '습도', PA: '해면기압', WP: '파주기',
  STN_KO: '관측 지점', STN_ID: '지점 ID', TM: '관측 시각', REG_ID: '예보 구역', TM_FC: '예보 발표',
  TM_EF: '예보 시각', W1: '풍향 시작', W2: '풍향 종료', ST: '강수 확률', SKY: '하늘 상태', PREP: '강수 형태', WF: '날씨',
  LON: '경도', LAT: '위도', TP: '관측 종류', WS2: '풍속 범위', WH1: '파고 시작', WH2: '파고 범위',
  obsvtrNm: '기준 관측소', obsrvnDt: '예측 시각', obsrvnHgt: '예측 조위', distance_km: '기준 위치와 거리',
})[key] || key.replaceAll('_', ' ');

function formatKmaTime(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10) return value || '—';
  return `${digits.slice(4, 6)}/${digits.slice(6, 8)} ${digits.slice(8, 10)}시`;
}

function numberFrom(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function rangeHigh(row, key) {
  const values = [row[key], row[`${key}1`], row[`${key}2`]].map(numberFrom).filter((value) => value !== null);
  return values.length ? Math.max(...values) : null;
}

function forecastCards(row) {
  const windDirection = [row.W1, row.W2].filter(Boolean).join(' → ') || '—';
  const windSpeed = [row.WS1, row.WS2].filter(Boolean).join('–');
  const waveHeight = [row.WH1, row.WH2].filter(Boolean).join('–');
  const precipitation = ({ '0': '없음', '1': '비', '2': '비·눈', '3': '눈', '4': '눈·비' })[row.PREP] || '—';
  return [['예보 시각', formatKmaTime(row.TM_EF)], ['날씨', row.WF || '—'], ['파고', waveHeight ? `${waveHeight} m` : '—'], ['풍향', windDirection], ['풍속', windSpeed ? `${windSpeed} m/s` : '—'], ['강수', precipitation]];
}

function DataRows({ rows, type }) {
  if (!rows?.length) return <p className="fish-empty">아직 표시할 자료가 없습니다. {type === 'forecast' ? '예보 구역이나 발표 시각을 확인해 주세요.' : '기관 자료 갱신을 기다리거나 새로고침해 주세요.'}</p>;
  return <div className="fish-data-list">{rows.slice(0, 6).map((row, index) => {
    const entries = type === 'forecast'
      ? forecastCards(row)
      : ['STN_KO', 'TM', 'distance_km', 'WH', 'WS', 'WD', 'TW', 'TA'].filter((key) => row[key] != null)
        .map((key) => [key, key === 'TM' ? formatKmaTime(row[key]) : key === 'distance_km' ? `약 ${row[key]} km` : row[key]]);
    const rawFields = row.fields || [];
    return <article className={`fish-data-row ${type === 'forecast' ? 'fish-forecast-row' : ''}`} key={`${type}-${index}`}>
      {entries.length ? entries.map(([key, value]) => <span className="fish-data-chip" key={key}><small>{prettyKey(key)}</small><b>{String(value)}</b></span>) : <span className="fish-data-chip fish-raw">{rawFields.slice(0, 8).join(' · ')}</span>}
    </article>;
  })}</div>;
}

async function fetchFishingSummary(area, signal) {
  const query = new URLSearchParams({ place: area.place, region: area.region, lat: String(area.lat), lon: String(area.lon) });
  const response = await fetch(`${API}/api/fishing/summary?${query}`, { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail || '해양 자료를 불러오지 못했습니다.');
  return body;
}

export default function FishingPage() {
  const [areaId, setAreaId] = useState(FISHING_AREAS[0].id);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(null);
  const area = FISHING_AREAS.find((item) => item.id === areaId) || FISHING_AREAS[0];
  const data = result?.areaId === areaId ? result.data : null;
  const load = useCallback(async (requestedArea = area) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => controller.abort('timeout'), 90000);
    setLoading(true); setError('');
    try {
      const body = await fetchFishingSummary(requestedArea, controller.signal);
      if (requestRef.current === controller) setResult({ areaId: requestedArea.id, data: body });
    } catch (e) {
      if (requestRef.current === controller) setError(controller.signal.aborted ? '응답이 지연되고 있습니다. 다시 시도해 주세요.' : (e.message || '서버에 연결할 수 없습니다.'));
    } finally {
      clearTimeout(timer);
      if (requestRef.current === controller) setLoading(false);
    }
  }, [area]);

  useEffect(() => {
    load(area);
    return () => { requestRef.current?.abort(); requestRef.current = null; };
  }, [area, load]);

  const sources = data?.sources || {};
  const buoyRows = sources.buoy?.records || [];
  const firstBuoy = buoyRows[0] || {};
  const buoyEntries = Object.entries(firstBuoy).filter(([key]) => key !== 'fields');
  const tideItems = sources.tide?.data?.body?.items?.item || [];
  const tideRows = (Array.isArray(tideItems) ? tideItems : [tideItems])
    .filter((item) => Date.parse(`${String(item.obsrvnDt || '').replace(' ', 'T')}:00+09:00`) >= Date.now()).slice(0, 6);
  const forecastRows = sources.forecast?.records || [];
  const metrics = ['WH', 'WS', 'WD', 'TW', 'TA', 'HM'].filter((key) => firstBuoy[key] != null).slice(0, 4);
  const outlook = useMemo(() => {
    const waveRow = forecastRows.filter((row) => rangeHigh(row, 'WH') !== null).sort((a, b) => rangeHigh(b, 'WH') - rangeHigh(a, 'WH'))[0];
    const windRow = forecastRows.filter((row) => rangeHigh(row, 'WS') !== null).sort((a, b) => rangeHigh(b, 'WS') - rangeHigh(a, 'WS'))[0];
    return { waveRow, windRow };
  }, [forecastRows]);
  const tideStation = tideRows[0]?.obsvtrNm || tideItems?.[0]?.obsvtrNm;

  return <main className="fishing-page">
    <section className="fish-hero glass-card">
      <div className="fish-hero-copy">
        <span className="fish-eyebrow"><FiAnchor /> WEATHER+ · 바다</span>
        <h1>오늘, 바다에 나가도 될까?</h1>
        <p>예보·실황·조위를 살펴 출조 계획을 세워보세요.</p>
        <label className="fish-area-picker"><FiMapPin /><span>확인할 해역</span>
          <select value={areaId} onChange={(event) => setAreaId(event.target.value)} aria-label="확인할 해역 선택">
            {FISHING_AREAS.map((item) => <option key={item.id} value={item.id}>{item.place}</option>)}
          </select>
        </label>
        <div className="fish-place"><span>예보 기준: {area.regionName}</span><span>· 실황은 가장 가까운 부이, 조위는 인근 예측 관측소 기준</span></div>
        <button className="fish-refresh" onClick={() => load(area)} disabled={loading}><FiRefreshCw className={loading ? 'fish-spin' : ''} /> {loading ? '해양 자료 확인 중' : '최신 자료 불러오기'}</button>
      </div>
      <div className="fish-hero-art"><div className="fish-orb"><FiAnchor /></div><span>CHECK THE SEA</span></div>
    </section>

    {error && <div className="fish-error" role="alert"><FiInfo /> {error}<button onClick={() => load(area)}>다시 시도</button></div>}
    {loading && !data && <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>해양 기관 자료를 불러오고 있어요</b><span>첫 요청은 서버 준비로 다소 오래 걸릴 수 있습니다.</span></div></div>}
    <div className="fish-data-meta"><FiClock /> 자료 조회 시각 {data?.updated_at || '확인 전'} <span>· 예보 발표·관측 시각은 각 항목에 표시</span></div>

    <section className="fish-panel fish-outlook"><div className="fish-panel-title"><FiActivity /><div><h2>출조 전 예보 요약</h2><p>선택한 해역의 단기 예보에서 가장 큰 값을 표시합니다. 안전 판정은 아닙니다.</p></div></div>
      {outlook.waveRow || outlook.windRow ? <div className="fish-outlook-grid">
        {outlook.waveRow && <article><span>예보상 가장 큰 파고 범위</span><b>{outlook.waveRow.WH1 || '—'}–{outlook.waveRow.WH2 || outlook.waveRow.WH1 || '—'} m</b><small>{formatKmaTime(outlook.waveRow.TM_EF)} · 파고를 확인할 구간</small></article>}
        {outlook.windRow && <article><span>예보상 가장 강한 바람 범위</span><b>{outlook.windRow.WS1 || '—'}–{outlook.windRow.WS2 || outlook.windRow.WS1 || '—'} m/s</b><small>{formatKmaTime(outlook.windRow.TM_EF)} · 풍속을 확인할 구간</small></article>}
      </div> : <p className="fish-empty">예보 자료를 받으면 파고와 바람이 큰 시간대를 요약합니다.</p>}
      <p className="fish-outlook-note"><FiInfo /> 해역 단위 예보 요약입니다. 출조 전 최신 기상특보와 실제 현장 상황을 반드시 함께 확인하세요.</p>
    </section>

    <section className="fish-metrics">
      <article className="fish-panel fish-metric-panel"><div className="fish-panel-title"><FiActivity /><div><h2>바다 실황</h2><p>{area.place} 기준 가까운 기상청 부이 관측</p></div></div>
        <div className="fish-metric-grid">{metrics.map((key) => <div className="fish-metric" key={key}><span>{prettyKey(key)}</span><strong>{firstBuoy[key] || '—'}<small>{({WH:' m',WH_SIG:' m',WS:' m/s',WS1:' m/s',TW:'°C',TA:'°C',HM:'%'})[key] || ''}</small></strong></div>)}
          {!buoyEntries.length && <p className="fish-empty">관측 자료를 불러오면 파고와 바람을 이곳에 표시합니다.</p>}</div>
        {firstBuoy.STN_KO && <p className="fish-station">가장 가까운 관측 지점 <b>{firstBuoy.STN_KO}</b> · 약 {firstBuoy.distance_km ?? '—'} km · {formatKmaTime(firstBuoy.TM)} <span>관측소와 낚시 지점 사이의 실제 바다는 다를 수 있습니다.</span></p>}
        <DataRows rows={buoyRows.slice(1)} type="buoy" />{data?.errors?.buoy && <p className="fish-inline-error">{data.errors.buoy}</p>}
      </article>

      <article className="fish-panel fish-tide-panel"><div className="fish-panel-title"><FiDroplet /><div><h2>앞으로의 조위</h2><p>국립해양조사원 TideBED 예측 · {tideStation || `${area.place} 인근 기준항`} · cm</p></div></div>
        {tideRows.length ? <div className="fish-tide-values">{tideRows.map((item, index) => <div className="fish-tide-item" key={`${item.obsrvnDt}-${index}`}><span>{prettyKey('obsrvnDt')}</span><b>{item.obsrvnDt || '—'}</b><span>{prettyKey('obsrvnHgt')}</span><b>{item.obsrvnHgt ?? '—'} cm</b></div>)}</div> : <p className="fish-empty">앞으로의 조위 자료가 없습니다. 잠시 뒤 새로고침해 주세요.</p>}
        {data?.errors?.tide && <p className="fish-inline-error">{data.errors.tide}</p>}
      </article>
    </section>

    <section className="fish-panel fish-forecast-panel"><div className="fish-panel-title"><FiWind /><div><h2>해상예보</h2><p>기상청 단기 해상예보 · {data?.region_name || area.regionName}{forecastRows[0]?.TM_FC ? ` · 발표 ${formatKmaTime(forecastRows[0].TM_FC)}` : ''}</p></div></div>
      <DataRows rows={forecastRows} type="forecast" />{data?.errors?.forecast && <p className="fish-inline-error">{data.errors.forecast}</p>}
    </section>
    <details className="fish-source-details"><summary><FiInfo /> 자료 범위와 기준</summary><p>해상예보는 선택 해역 단위이며 개별 포인트의 예보가 아닙니다. 부이는 위치와 거리를 함께 표시한 참고 관측이고, TideBED 조위는 응답에 포함된 인근 기준 관측소의 예측입니다. 각 기관 자료의 발표·관측 시각을 확인해 최신성도 살펴보세요.</p></details>
    <p className="fish-disclaimer"><FiInfo /> {data?.notice || '기관 예보와 관측을 참고용으로 제공합니다. 출조 전 기상특보와 현장 상황을 별도로 확인하세요.'}</p>
  </main>;
}
