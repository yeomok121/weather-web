// 낚시 페이지: 바다낚시 준비물 체크리스트 (기본 + 오늘 바다 조건에 따른 추가 항목, 체크는 이 브라우저에 저장)
import { useState } from 'react';
import { FiCheckSquare } from 'react-icons/fi';
import { readStoredJson, writeStoredJson } from '../../../shared/lib/browserStorage';
import { BASE_GEAR, conditionalGear, todayConditions } from '../lib/gear';
import { tideCalendar } from '../lib/tideCalendar';

const STORAGE_KEY = 'fishing:gear-checked:v1';

export default function GearChecklist({ area, indexDays, forecastRows, warnings }) {
  const [today] = useState(() => Date.now());
  const conditions = todayConditions({ indexDays, forecastRows, warnings, tideLabel: tideCalendar(new Date(today), area.tide_system === 7 ? 7 : 8).label });
  const [checked, setChecked] = useState(() => new Set(readStoredJson(STORAGE_KEY, []).filter((id) => typeof id === 'string')));
  const extra = conditionalGear(conditions);
  const toggle = (id) => setChecked((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    writeStoredJson(STORAGE_KEY, [...next]);
    return next;
  });
  const reset = () => { setChecked(new Set()); writeStoredJson(STORAGE_KEY, []); };
  const items = [...extra.filter((item) => !item.tip), ...BASE_GEAR];
  const done = items.filter((item) => checked.has(item.id)).length;

  return <article className="fish-panel fish-gear-panel">
    <div className="fish-panel-title"><FiCheckSquare /><div><h2>바다낚시 준비물</h2><p>{done}/{items.length} 준비 · 오늘 바다 조건에 맞춘 항목을 위에 표시합니다</p></div></div>
    {extra.filter((item) => item.tip).map((item) => <p className="fish-gear-tip" key={item.id}>⚠ {item.name} · {item.reason}</p>)}
    <ul className="fish-gear-list">{items.map((item) => <li key={item.id} className={checked.has(item.id) ? 'done' : ''}>
      <label>
        <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)} />
        <span><b>{item.name}</b>{item.reason ? <em>오늘 · {item.reason}</em> : item.note ? <small>{item.note}</small> : null}</span>
      </label>
    </li>)}</ul>
    {done > 0 && <button type="button" className="fish-gear-reset" onClick={reset}>체크 모두 지우기</button>}
  </article>;
}
