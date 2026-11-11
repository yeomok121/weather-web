// 낚시 페이지: 부이 관측·해상예보 행을 칩 모양으로 나열
import { forecastCards, formatKmaTime, prettyKey } from '../fishingFormat';

export default function DataRows({ rows, type }) {
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
