// 낚시 페이지: 물때와 조위 (국립해양조사원 TideBED 예측 + 음력 기준 물때 계산)
import { useEffect, useState } from 'react';
import { FiDroplet, FiMoon } from 'react-icons/fi';
import { formatTideTime, prettyKey, tideTimeline, upcomingTides } from '../fishingFormat';
import { tideCalendar } from '../lib/tideCalendar';
import TideChart from './TideChart';

export default function TidePanel({ area, tideSource, error }) {
  // 1분마다 '지금' 기준을 갱신해 지난 만조·간조가 목록에서 빠지게 합니다.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const timeline = tideTimeline(tideSource, { now });
  const legacy = upcomingTides(tideSource?.data, { now });
  const station = timeline.station || legacy.station;
  const calendar = tideCalendar(new Date(now), area.tide_system === 7 ? 7 : 8);

  return <article className="fish-panel fish-tide-panel"><div className="fish-panel-title"><FiDroplet /><div><h2>물때와 조위</h2><p>국립해양조사원 TideBED 예측 · {station || `${area.place} 인근 기준항`} · cm</p></div></div>
    <div className="fish-tide-day">
      <FiMoon />
      <div><span>오늘 물때 · {calendar.system}물때식</span><b>{calendar.label}</b></div>
      <small>음력 {calendar.lunarDay}일{calendar.hint ? ` · ${calendar.hint}` : ''}</small>
    </div>

    {timeline.upcoming.length ? <div className="fish-tide-extremes">{timeline.upcoming.map((item) => <div className={`fish-tide-extreme ${item.type}`} key={item.time}>
      <span>{item.type === 'high' ? '만조' : '간조'}</span><b>{formatTideTime(item.time, now)}</b><small>약 {Math.round(item.height_cm)} cm</small>
    </div>)}</div> : null}

    <TideChart points={timeline.points} extremes={timeline.upcoming} now={now} />

    {!timeline.points.length && (legacy.rows.length
      ? <div className="fish-tide-values">{legacy.rows.map((item, index) => <div className="fish-tide-item" key={`${item.obsrvnDt}-${index}`}><span>{prettyKey('obsrvnDt')}</span><b>{item.obsrvnDt || '—'}</b><span>{prettyKey('obsrvnHgt')}</span><b>{item.obsrvnHgt ?? '—'} cm</b></div>)}</div>
      : <p className="fish-empty">앞으로의 조위 자료가 없습니다. 잠시 뒤 새로고침해 주세요.</p>)}
    {error && <p className="fish-inline-error">{error}</p>}
    <p className="fish-tide-note">만조·간조 시각은 1시간 간격 예측으로 추정한 값이고, 물때는 음력으로 계산한 참고값입니다. 지역 관습에 따라 하루 정도 다르게 부를 수 있습니다.</p>
  </article>;
}
