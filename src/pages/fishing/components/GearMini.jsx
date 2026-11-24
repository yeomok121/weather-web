// 낚시 페이지 오른쪽 아래: 작은 준비물 체크리스트 (준비물 탭과 체크가 함께 바뀜)
import { useState } from 'react';
import { FiArrowRight, FiCheckSquare } from 'react-icons/fi';
import { useApp } from '../../../shared/AppContext';
import { todayGearItems } from '../lib/gear';
import { gearCheckedKey } from '../lib/gearChecked';
import { useGearChecked } from '../useGearChecked';

export default function GearMini({ area, indexDays, forecastRows, warnings, gear, onOpenFull }) {
  const { loggedInUser } = useApp();
  const [today] = useState(() => Date.now());
  const { checked, toggle } = useGearChecked(gearCheckedKey(loggedInUser));
  const { items } = todayGearItems({ area, indexDays, forecastRows, warnings, setup: gear.setup, now: today });
  const done = items.filter((item) => checked.has(item.id)).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  return <section className="glass-card fish-gear-mini" aria-label="준비물 체크">
    <header><FiCheckSquare aria-hidden="true" /><b>준비물 체크</b><span>{done}/{items.length}</span></header>
    <div className="fish-gear-mini-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="준비한 비율"><i style={{ width: `${percent}%` }} /></div>
    <ul>{items.map((item) => <li key={item.id} className={checked.has(item.id) ? 'done' : ''}>
      <label><input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)} />
        <span>{item.name}</span>{item.reason ? <em>오늘</em> : item.mine ? <em className="mine">내 것</em> : null}</label>
    </li>)}</ul>
    <button type="button" className="fish-gear-mini-more" onClick={onOpenFull}>준비물 자세히 · 편집 <FiArrowRight aria-hidden="true" /></button>
  </section>;
}
