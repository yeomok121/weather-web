// 낚시 페이지: 앞으로의 조위 (국립해양조사원 TideBED 예측)
import { FiDroplet } from 'react-icons/fi';
import { prettyKey, upcomingTides } from '../fishingFormat';

export default function TidePanel({ area, tideData, error }) {
  const { rows: tideRows, station: tideStation } = upcomingTides(tideData);
  return <article className="fish-panel fish-tide-panel"><div className="fish-panel-title"><FiDroplet /><div><h2>앞으로의 조위</h2><p>국립해양조사원 TideBED 예측 · {tideStation || `${area.place} 인근 기준항`} · cm</p></div></div>
    {tideRows.length ? <div className="fish-tide-values">{tideRows.map((item, index) => <div className="fish-tide-item" key={`${item.obsrvnDt}-${index}`}><span>{prettyKey('obsrvnDt')}</span><b>{item.obsrvnDt || '—'}</b><span>{prettyKey('obsrvnHgt')}</span><b>{item.obsrvnHgt ?? '—'} cm</b></div>)}</div> : <p className="fish-empty">앞으로의 조위 자료가 없습니다. 잠시 뒤 새로고침해 주세요.</p>}
    {error && <p className="fish-inline-error">{error}</p>}
  </article>;
}
