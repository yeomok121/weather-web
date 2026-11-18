// 낚시 페이지: 바다낚시지수 설명 창 (포인트의 날짜·시간대별 지수, 왜 좋은지/나쁜지, 지수 안내)
import { useEffect, useRef, useState } from 'react';
import { FiInfo, FiRefreshCw, FiTarget, FiX } from 'react-icons/fi';
import { fetchPointIndex } from '../fishingApi';
import { gradeTone, indexDayLabel, namedSpecies, sessionLabel } from '../fishingFormat';
import { explainFactors, explainReason } from '../lib/indexExplain';

const GRADES = [
  ['매우좋음', '파도·바람이 잔잔하고 수온·물때가 어종에 잘 맞는 날'],
  ['좋음', '대체로 낚시하기 좋은 조건'],
  ['보통', '조건 일부가 맞지 않아 조과를 장담하기 어려운 날'],
  ['나쁨', '파도·바람이 거세거나 어종 조건이 맞지 않는 날'],
  ['매우나쁨', '출조를 피하는 것이 좋은 날 (특보와 함께 나오는 경우가 많음)'],
];

function SessionDetail({ session }) {
  const best = session.species[0];
  return <article className="fish-modal-session">
    <header><b>{sessionLabel(session.session)}</b>{best && <em className={`fish-grade ${gradeTone(best.index)}`}>{best.index}</em>}</header>
    <p className="fish-modal-reason">{explainReason(session)}</p>
    <ul className="fish-modal-factors">{explainFactors(session).map((factor) => <li key={factor.id}>
      <span>{factor.name}</span><b>{factor.value}</b><em className={`fish-factor ${factor.tone}`}>{factor.label}</em><small>{factor.note}</small>
    </li>)}</ul>
    {namedSpecies(session.species).length > 0
      ? <div className="fish-modal-species"><span>어종별</span>{namedSpecies(session.species).map((item) => <span key={item.name}>{item.name} <em className={`fish-grade ${gradeTone(item.index)}`}>{item.index}</em></span>)}</div>
      : <div className="fish-modal-species"><span>어종별</span><span>이 포인트는 어종 구분 없이 지수 하나만 제공됩니다.</span></div>}
  </article>;
}

export default function FishingIndexModal({ pointId, pointName, initialIndex, openGuide = false, onClose }) {
  const [state, setState] = useState(() => (initialIndex ? { status: 'ready', index: initialIndex } : { status: 'loading' }));
  const [selected, setSelected] = useState(null);
  const [now] = useState(() => Date.now());
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (initialIndex || !pointId) return undefined;
    const controller = new AbortController();
    fetchPointIndex(pointId, { signal: controller.signal })
      .then((index) => setState({ status: 'ready', index }))
      .catch((error) => { if (!controller.signal.aborted) setState({ status: 'error', message: error.message || '바다낚시지수를 불러오지 못했습니다.' }); });
    return () => controller.abort();
  }, [pointId, initialIndex]);

  // 열리면 닫기 버튼에 초점, Esc로 닫기, 뒤 화면 스크롤 막기
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onCloseRef.current?.(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, []);

  const days = state.index?.days || [];
  const day = days.find((item) => item.date === selected) || days[0];
  const title = state.index?.point?.name || pointName || '바다낚시지수';

  return <div className="fish-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {/* 닫기 버튼은 스크롤되는 내용 밖(창 오른쪽 위 모서리 바깥)에 고정해 내용을 내려도 항상 보입니다. */}
    <div className="fish-modal-frame" role="dialog" aria-modal="true" aria-labelledby="fish-modal-title">
    <button type="button" ref={closeRef} className="fish-modal-close" onClick={onClose} aria-label="닫기"><FiX /></button>
    <div className="fish-modal">
      <div className="fish-modal-head">
        <FiTarget />
        <div><h2 id="fish-modal-title">{title} 바다낚시지수</h2><p>국립해양조사원 · {state.index?.gubun || '갯바위'} 기준</p></div>
      </div>

      {state.status === 'loading' && <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>지수를 불러오고 있어요</b></div></div>}
      {state.status === 'error' && <p className="fish-inline-error">{state.message}</p>}
      {state.status === 'ready' && (day ? <>
        {days.length > 1 && <div className="fish-index-days" role="tablist" aria-label="날짜 선택">{days.map((item) => <button type="button" role="tab" key={item.date} aria-selected={item.date === day.date} className={item.date === day.date ? 'active' : ''} onClick={() => setSelected(item.date)}>{indexDayLabel(item.date, now)}</button>)}</div>}
        <div className="fish-modal-sessions">{day.sessions.map((session) => <SessionDetail key={session.session} session={session} />)}</div>
        <p className="fish-tide-note"><FiInfo /> 조건별 좋음·주의 표시와 이유 문장은 Weather+가 일반적인 갯바위 낚시 기준으로 덧붙인 참고 해석입니다. 실제 지수는 국립해양조사원이 계산합니다.</p>
      </> : <p className="fish-empty">이 포인트의 바다낚시지수 자료가 없습니다.</p>)}

      <details className="fish-modal-guide" open={openGuide || (!pointId && !initialIndex)}>
        <summary><FiInfo /> 바다낚시지수란?</summary>
        <p>국립해양조사원이 전국 낚시 포인트마다 <b>물때·파고·수온·기온·풍속·유속</b>을 어종별 적정 조건과 비교해 계산한 지수입니다. 날짜마다 오전·오후(며칠 뒤는 하루 단위)로, 감성돔·돌돔·벵에돔·참돔·농어·볼락 등 어종별로 나옵니다.</p>
        <ul className="fish-modal-grades">{GRADES.map(([grade, text]) => <li key={grade}><em className={`fish-grade ${gradeTone(grade)}`}>{grade}</em><span>{text}</span></li>)}</ul>
        <p>지수는 바다 조건을 바탕으로 한 참고 정보입니다. 실제 조과를 보장하지 않으며, 출조 전에는 기상특보와 현장 상황을 꼭 확인하세요.</p>
      </details>
    </div>
    </div>
  </div>;
}
