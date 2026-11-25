// 낚시 페이지 오른쪽 칸: 바다낚시 준비물 체크 (예전 '준비물' 탭을 합쳐 여기서 체크·편집을 모두 합니다)
// 오늘 바다 조건 항목 + 내 준비물(로그인하면 계정에 저장) + 기본 항목. 체크 표시는 이 브라우저에 저장합니다.
import { useState } from 'react';
import { FiCheckSquare, FiEdit2 } from 'react-icons/fi';
import { useApp } from '../../../shared/AppContext';
import { todayGearItems } from '../lib/gear';
import { gearCheckedKey } from '../lib/gearChecked';
import { useGearChecked } from '../useGearChecked';
import { useGearSetup } from '../useGearSetup';
import { openFishingLogin } from '../lib/loginPrompt';
import GearEditor from './GearEditor';

export default function GearChecklist({ area, indexDays, forecastRows, warnings }) {
  const { loggedInUser, promptLogin, showToast } = useApp();
  const { setup, save, isLoggedIn } = useGearSetup({ loggedInUser, showToast });
  const [editing, setEditing] = useState(false);
  const [today] = useState(() => Date.now());
  const { checked, toggle, reset } = useGearChecked(gearCheckedKey(loggedInUser));
  const { items, tips } = todayGearItems({ area, indexDays, forecastRows, warnings, setup, now: today });
  const done = items.filter((item) => checked.has(item.id)).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  return <section className="glass-card fish-gear-card" aria-label="준비물 체크">
    <header>
      <FiCheckSquare aria-hidden="true" /><b>준비물 체크</b><span>{done}/{items.length}</span>
      {isLoggedIn && !editing && <button type="button" className="fish-gear-edit" onClick={() => setEditing(true)}><FiEdit2 aria-hidden="true" /> 편집</button>}
    </header>
    <div className="fish-gear-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="준비한 비율"><i style={{ width: `${percent}%` }} /></div>
    <p className="fish-gear-sub">오늘 바다 조건에 맞춘 항목을 위에 표시해요</p>

    {editing && <GearEditor setup={setup} onCancel={() => setEditing(false)} onSave={async (next) => { if (await save(next)) setEditing(false); }} />}
    {tips.map((item) => <p className="fish-gear-tip" key={item.id}>⚠ {item.name} · {item.reason}</p>)}

    <ul className="fish-gear-list">{items.map((item) => {
      const detail = item.reason ? `오늘 · ${item.reason}` : item.note || '';
      return <li key={item.id} className={`${checked.has(item.id) ? 'done' : ''} ${item.reason ? 'today' : ''} ${item.mine ? 'mine' : ''}`}>
        <label title={detail ? `${item.name} — ${detail}` : item.name}>
          <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)} />
          <span>
            <b>{item.name}{item.reason ? <em>오늘</em> : item.mine ? <em className="mine">내 것</em> : null}</b>
            {(item.reason || item.note) && <small>{item.reason || item.note}</small>}
          </span>
        </label>
      </li>;
    })}</ul>

    <div className="fish-gear-foot">
      {!isLoggedIn && <p className="fish-gear-login">로그인하면 나만의 준비물 목록을 만들 수 있어요. 계정에 저장돼 어느 기기에서든 그대로 보여요.<button type="button" onClick={() => openFishingLogin(promptLogin)}>로그인하기</button></p>}
      {done > 0 && <button type="button" className="fish-gear-reset" onClick={reset}>체크 모두 지우기</button>}
    </div>
  </section>;
}
