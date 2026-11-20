// 낚시 페이지: 출조 골든타임(물때 + 새벽·해질녘)과 갯바위 안전 알림
// 계산은 lib/fishingTime.js — 낚시인 경험칙 기반 참고용입니다.
import { FiAlertOctagon, FiAlertTriangle, FiClock, FiInfo, FiPhone } from 'react-icons/fi';
import { clock, windowReason } from '../lib/fishingTime';
import { indexDayLabel } from '../fishingFormat';

const DAY = 24 * 3600000;
const pct = (value, dayStartAt) => `${Math.min(100, Math.max(0, ((value - dayStartAt) / DAY) * 100))}%`;
const dateKey = (time) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(time);
const NOTE_ICON = { danger: FiAlertOctagon, warn: FiAlertTriangle, info: FiInfo };

function DayBar({ dayStartAt, windows, extremes, now }) {
  const end = dayStartAt + DAY;
  const parts = windows.filter((w) => w.end > dayStartAt && w.start < end);
  const marks = extremes.filter((e) => e.at >= dayStartAt && e.at < end);
  return <div className="fish-timing-day">
    <b>{indexDayLabel(dateKey(dayStartAt), now)}</b>
    <div className="fish-timing-bar" role="img" aria-label={`${indexDayLabel(dateKey(dayStartAt), now)} 시간대: ${parts.filter((w) => w.score > 0).map((w) => `${clock(Math.max(w.start, dayStartAt))}~${clock(Math.min(w.end, end))} ${windowReason(w)}`).join(', ') || '추천 시간 없음'}`}>
      {parts.map((w) => <span key={w.start} className={`seg ${w.score === 2 ? 'golden' : w.score === 1 ? 'good' : w.light === '밤' ? 'night' : 'plain'} ${w.rough ? 'rough' : ''}`}
        style={{ left: pct(Math.max(w.start, dayStartAt), dayStartAt), width: `calc(${pct(Math.min(w.end, end), dayStartAt)} - ${pct(Math.max(w.start, dayStartAt), dayStartAt)})` }} />)}
      {marks.map((e) => <i key={e.at} className={`mark ${e.type}`} style={{ left: pct(e.at, dayStartAt) }} title={`${e.type === 'high' ? '만조' : '간조'} ${clock(e.at)}`}>
        <em>{e.type === 'high' ? '▲' : '▼'} {clock(e.at)}</em></i>)}
      {now >= dayStartAt && now < end && <i className="now" style={{ left: pct(now, dayStartAt) }} aria-hidden="true" />}
    </div>
  </div>;
}

export default function TimingPanel({ timing, now }) {
  return <section className="fish-panel fish-timing" id="fish-timing">
    <div className="fish-panel-title"><FiClock /><div><h2>출조 시간 · 안전</h2>
      <p>물이 움직이는 때(만조 전후·초들물)와 새벽·해질녘이 겹치면 골든타임 · 낚시인 경험칙 기반 참고용</p></div></div>

    {timing.hasTide ? <>
      <div className="fish-timing-legend" aria-hidden="true"><span className="golden">골든타임</span><span className="good">좋은 때</span><span className="night">밤</span><span className="rough">바다 거침</span><span>▲ 만조 ▼ 간조</span></div>
      <div className="fish-timing-hours" aria-hidden="true"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div>
      {timing.dayStarts.map((start) => <DayBar key={start} dayStartAt={start} windows={timing.windows} extremes={timing.extremes} now={now} />)}
      {timing.recommended.length ? <ul className="fish-timing-picks">{timing.recommended.map((w) => <li key={w.start} className={w.score === 2 ? 'golden' : ''}>
        <b>{w.score === 2 ? '★ ' : ''}{indexDayLabel(dateKey(w.start), now)} {clock(w.start)}–{clock(w.end)}</b><span>{windowReason(w)}</span>
      </li>)}</ul> : <p className="fish-timing-none">{timing.blockedBy ? `${timing.blockedBy} 발효 중이라 출조 시간을 추천하지 않아요. 물때 시각만 참고하세요.` : '오늘·내일 남은 시간 중 추천할 때가 없어요. (밤이거나 예보상 바다가 거친 때)'}</p>}
    </> : <p className="fish-timing-none">조위 예측을 받지 못해 물때 기반 시간을 계산할 수 없어요.</p>}

    <h3 className="fish-safety-title">갯바위 안전</h3>
    <ul className="fish-safety">{timing.notes.map((note) => { const Icon = NOTE_ICON[note.level]; return <li key={note.title} className={note.level}>
      <Icon aria-hidden="true" /><div><b>{note.title}</b><span>{note.text}</span></div>
      {note.call && <a className="fish-call" href={`tel:${note.call}`}><FiPhone /> {note.call}</a>}
    </li>; })}</ul>
  </section>;
}
