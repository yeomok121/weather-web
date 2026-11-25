// 낚시 페이지: '내 준비물' 편집 창 (오른쪽 준비물 체크 칸 안에서 열림)
import { useState } from 'react';
import { FiEye, FiEyeOff, FiPlus, FiX } from 'react-icons/fi';
import { BASE_GEAR, GEAR_LIMITS, REQUIRED_GEAR, addGearItem } from '../lib/gear';

// 편집 창: 열 때의 세팅을 복사해 고치고, 저장을 눌러야 계정에 반영됩니다.
export default function GearEditor({ setup, onSave, onCancel }) {
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
