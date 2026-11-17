// 낚시 페이지: 국립해양조사원 바다낚시지수 (가장 가까운 포인트의 날짜·오전/오후·어종별 지수)
import { useState } from 'react';
import { FiTarget } from 'react-icons/fi';
import { formatRange, gradeTone, indexDayLabel, sessionLabel } from '../fishingFormat';

function Session({ session }) {
  const best = session.species[0];
  return <article className="fish-index-session">
    <header><b>{sessionLabel(session.session)}</b>{session.tide_phase && <span>{session.tide_phase}</span>}</header>
    {best && <p className="fish-index-best">가장 좋은 어종 <b>{best.name}</b> <em className={`fish-grade ${gradeTone(best.index)}`}>{best.index}</em></p>}
    <ul className="fish-index-species">{session.species.map((item) => <li key={item.name}><span>{item.name}</span><em className={`fish-grade ${gradeTone(item.index)}`}>{item.index || '—'}</em></li>)}</ul>
    <dl className="fish-index-conditions">
      <div><dt>파고</dt><dd>{formatRange(session.wave_m, ' m')}</dd></div>
      <div><dt>풍속</dt><dd>{formatRange(session.wind_ms, ' m/s')}</dd></div>
      <div><dt>수온</dt><dd>{formatRange(session.water_temp_c, '°C')}</dd></div>
      <div><dt>기온</dt><dd>{formatRange(session.air_temp_c, '°C')}</dd></div>
      <div><dt>유속</dt><dd>{formatRange(session.current_speed, '', 2)}</dd></div>
    </dl>
  </article>;
}

export default function FishingIndexPanel({ index, error }) {
  const days = index?.days || [];
  const [selected, setSelected] = useState(null);
  const day = days.find((item) => item.date === selected) || days[0];
  const point = index?.point;

  return <section className="fish-panel fish-index">
    <div className="fish-panel-title"><FiTarget /><div><h2>바다낚시지수</h2>
      <p>국립해양조사원 · {point ? `${point.name} ${index.gubun || ''} 포인트 · 기준 위치에서 약 ${point.distance_km} km` : '가까운 낚시 포인트 기준'}</p></div></div>

    {day ? <>
      {days.length > 1 && <div className="fish-index-days" role="tablist" aria-label="날짜 선택">{days.map((item) => <button type="button" role="tab" key={item.date} aria-selected={item.date === day.date} className={item.date === day.date ? 'active' : ''} onClick={() => setSelected(item.date)}>{indexDayLabel(item.date)}</button>)}</div>}
      <div className={`fish-index-sessions ${day.sessions.length === 1 ? 'single' : ''}`}>{day.sessions.map((session) => <Session key={session.session} session={session} />)}</div>
    </> : !error && <p className="fish-empty">{point === null && index?.nearby?.length
      ? `선택한 해역 80 km 안에 바다낚시지수 포인트가 없습니다. 가장 가까운 포인트: ${index.nearby.map((item) => `${item.name}(약 ${Math.round(item.distance_km)} km)`).join(', ')}`
      : '바다낚시지수를 받으면 어종별 낚시 적합도를 표시합니다.'}</p>}
    {error && <p className="fish-inline-error">{error}</p>}
    <p className="fish-tide-note">낚시지수는 해양 조건으로 계산한 참고 지수입니다. 실제 조과나 출조 안전을 보장하지 않습니다.</p>
  </section>;
}
