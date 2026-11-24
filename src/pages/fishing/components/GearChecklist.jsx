// 낚시 페이지: 바다낚시 준비물 체크리스트
// 오늘 바다 조건 항목 + 내 준비물(로그인하면 계정에 저장) + 기본 항목. 체크 표시는 이 브라우저에 저장합니다.
import { useState } from 'react';
import { FiCheckSquare, FiEdit2, FiEye, FiEyeOff, FiPlus, FiX } from 'react-icons/fi';
import { useApp } from '../../../shared/AppContext';
import { readStoredJson, writeStoredJson } from '../../../shared/lib/browserStorage';
import { BASE_GEAR, GEAR_LIMITS, REQUIRED_GEAR, addGearItem, conditionalGear, gearListFor, todayConditions } from '../lib/gear';
import { tideCalendar } from '../lib/tideCalendar';
import { useGearSetup } from '../useGearSetup';
import { openFishingLogin } from '../lib/loginPrompt';

const STORAGE_KEY = 'fishing:gear-checked:v1';

export default function GearChecklist(props) {
  const account = useApp();
  const owner = account.loggedInUser?.memberId ?? account.loggedInUser?.id;
  const key = owner == null ? STORAGE_KEY : `${STORAGE_KEY}:member:${owner}`;
  return <AccountGearChecklist key={key} storageKey={key} {...account} {...props} />;
}

function AccountGearChecklist({ area, indexDays, forecastRows, warnings, loggedInUser, showToast, promptLogin, storageKey }) {
  const { setup, save, isLoggedIn } = useGearSetup({ loggedInUser, showToast });
  const [editing, setEditing] = useState(false);
  const [today] = useState(() => Date.now());
  const conditions = todayConditions({ indexDays, forecastRows, warnings, tideLabel: tideCalendar(new Date(today), area.tide_system === 7 ? 7 : 8).label });
  const [checked, setChecked] = useState(() => new Set(readStoredJson(storageKey, []).filter((id) => typeof id === 'string')));
  const extra = conditionalGear(conditions);
  const toggle = (id) => setChecked((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    writeStoredJson(storageKey, [...next]);
    return next;
  });
  const reset = () => { setChecked(new Set()); writeStoredJson(storageKey, []); };
  const items = gearListFor(setup, extra);
  const done = items.filter((item) => checked.has(item.id)).length;

  return <article className="fish-panel fish-gear-panel">
    <div className="fish-panel-title fish-gear-title"><FiCheckSquare /><div><h2>바다낚시 준비물</h2><p>{done}/{items.length} 준비 · 오늘 바다 조건에 맞춘 항목을 위에 표시합니다</p></div>
      {isLoggedIn && !editing && <button type="button" className="fish-gear-edit" onClick={() => setEditing(true)}><FiEdit2 /> 내 준비물 편집</button>}
    </div>
    {!isLoggedIn && <p className="fish-gear-login">로그인하면 나만의 준비물 목록을 만들 수 있어요. 계정에 저장돼서 어느 기기에서 로그인해도 그대로 보여요.<button type="button" onClick={() => openFishingLogin(promptLogin)}>로그인하기</button></p>}
    {editing && <GearEditor setup={setup} onCancel={() => setEditing(false)} onSave={async (next) => { if (await save(next)) setEditing(false); }} />}
    {extra.filter((item) => item.tip).map((item) => <p className="fish-gear-tip" key={item.id}>⚠ {item.name} · {item.reason}</p>)}
    <ul className="fish-gear-list">{items.map((item) => <li key={item.id} className={`${checked.has(item.id) ? 'done' : ''} ${item.mine ? 'mine' : ''}`}>
      <label>
        <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)} />
        <span><b>{item.name}</b>{item.reason ? <em>오늘 · {item.reason}</em> : item.mine ? <i>내 준비물{item.note ? ` · ${item.note}` : ''}</i> : item.note ? <small>{item.note}</small> : null}</span>
      </label>
    </li>)}</ul>
    {done > 0 && <button type="button" className="fish-gear-reset" onClick={reset}>체크 모두 지우기</button>}
  </article>;
}

// 편집 창: 열 때의 세팅을 복사해 고치고, 저장을 눌러야 계정에 반영됩니다.
function GearEditor({ setup, onSave, onCancel }) {
  const [draft, setDraft] = useState(setup);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const hidden = new Set(draft.hidden);

  const add = (event) => {
    event.preventDefault();
    const result = addGearItem(draft, { name, note });
    if (result.error) { setError(result.error); return; }
    setDraft(result.setup); setName(''); setNote(''); setError('');
  };
  const remove = (id) => setDraft((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== id) }));
  const toggleBase = (id) => setDraft((previous) => ({
    ...previous, hidden: previous.hidden.includes(id) ? previous.hidden.filter((value) => value !== id) : [...previous.hidden, id],
  }));
  const submit = async () => { setSaving(true); await onSave(draft); setSaving(false); };

  return <section className="fish-gear-editor" aria-label="내 준비물 편집">
    <h3>내 준비물 <small>{draft.items.length}/{GEAR_LIMITS.items}</small></h3>
    {draft.items.length ? <ul className="fish-gear-mine">{draft.items.map((item) => <li key={item.id}>
      <span><b>{item.name}</b>{item.note && <small>{item.note}</small>}</span>
      <button type="button" onClick={() => remove(item.id)} aria-label={`${item.name} 지우기`}><FiX /></button>
    </li>)}</ul> : <p className="fish-gear-empty">아직 직접 넣은 준비물이 없어요. 자주 챙기는 장비를 넣어 보세요.</p>}
    <form className="fish-gear-add" onSubmit={add}>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="준비물 이름 (예: 루어 박스)" maxLength={GEAR_LIMITS.name} aria-label="준비물 이름" />
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="메모 (선택)" maxLength={GEAR_LIMITS.note} aria-label="메모" />
      <button type="submit"><FiPlus /> 추가</button>
    </form>
    {error && <p className="fish-gear-error" role="alert">{error}</p>}

    <h3>기본 항목 <small>안 쓰는 항목은 숨길 수 있어요</small></h3>
    <div className="fish-gear-base">{BASE_GEAR.map((item) => {
      const required = REQUIRED_GEAR.has(item.id);
      const off = hidden.has(item.id);
      return <button type="button" key={item.id} className={off ? 'off' : ''} disabled={required} aria-pressed={!off}
        onClick={() => toggleBase(item.id)} title={required ? '안전 필수 항목이라 숨길 수 없어요' : off ? '다시 보이기' : '숨기기'}>
        {off ? <FiEyeOff /> : <FiEye />} {item.name}{required ? ' · 필수' : ''}
      </button>;
    })}</div>

    <div className="fish-gear-actions">
      <button type="button" className="primary" onClick={submit} disabled={saving}>{saving ? '저장 중…' : '계정에 저장'}</button>
      <button type="button" onClick={onCancel} disabled={saving}>취소</button>
    </div>
  </section>;
}
