// 낚시 페이지: 바다 실황 (가까운 기상청 부이 관측)
import { FiActivity } from 'react-icons/fi';
import { METRIC_UNITS, formatKmaTime, prettyKey } from '../fishingFormat';
import DataRows from './DataRows';

export default function BuoyPanel({ area, buoyRows, error }) {
  const firstBuoy = buoyRows[0] || {};
  const buoyEntries = Object.entries(firstBuoy).filter(([key]) => key !== 'fields');
  const metrics = ['WH', 'WS', 'WD', 'TW', 'TA', 'HM'].filter((key) => firstBuoy[key] != null).slice(0, 4);
  return <article className="fish-panel fish-metric-panel"><div className="fish-panel-title"><FiActivity /><div><h2>바다 실황</h2><p>{area.place} 기준 가까운 기상청 부이 관측</p></div></div>
    <div className="fish-metric-grid">{metrics.map((key) => <div className="fish-metric" key={key}><span>{prettyKey(key)}</span><strong>{firstBuoy[key] || '—'}<small>{METRIC_UNITS[key] || ''}</small></strong></div>)}
      {!buoyEntries.length && <p className="fish-empty">관측 자료를 불러오면 파고와 바람을 이곳에 표시합니다.</p>}</div>
    {firstBuoy.STN_KO && <p className="fish-station">가장 가까운 관측 지점 <b>{firstBuoy.STN_KO}</b> · 약 {firstBuoy.distance_km ?? '—'} km · {formatKmaTime(firstBuoy.TM)} <span>관측소와 낚시 지점 사이의 실제 바다는 다를 수 있습니다.</span></p>}
    <DataRows rows={buoyRows.slice(1)} type="buoy" />{error && <p className="fish-inline-error">{error}</p>}
  </article>;
}
