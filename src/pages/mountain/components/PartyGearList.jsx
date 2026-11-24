import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { allocations, amount, gearSummary, missing, myGear, prepared } from '../lib/partyGear';

const blank = { name: '', kind: 'personal', quantity: 1, unit: '개' };
function GearAllocation({ item, party, username, busy, canManage, onSave }) {
  const [target, setTarget] = useState(username);
  const [quantity, setQuantity] = useState('');
  const options = canManage ? party.members : party.members.filter(member => member.username === username);
  const selected = options.some(member => member.username === target) ? target : username;
  const current = allocations(item).find(row => row.username === selected)?.quantity || 0;
  const max = missing(item) + current;
  return (
    <form className="planner-inline-form party-gear-allocation" onSubmit={event => {
      event.preventDefault();
      const next = quantity === '' ? current : Number(quantity);
      onSave(item, `/allocations/${encodeURIComponent(selected)}`, 'PUT', { quantity: next });
    }}>
      {canManage && <label>담당자
        <select value={selected} onChange={event => { setTarget(event.target.value); setQuantity(''); }} disabled={busy}>
          {options.map(member => <option value={member.username} key={member.username}>{member.name}{member.username === username ? ' (나)' : ''}</option>)}
        </select>
      </label>}
      <label>{canManage ? '담당 수량' : '내 담당 수량'}
        <input type="number" value={quantity === '' ? current : quantity} min="0" max={max} required disabled={busy}
          onChange={event => setQuantity(event.target.value)} />
      </label>
      <button type="submit" disabled={busy}>배정 저장</button>
    </form>
  );
}

function GearQuantity({ item, busy, onSave }) {
  const [quantity, setQuantity] = useState(item.quantity);
  return <form className="planner-inline-form party-gear-allocation" onSubmit={event => {
    event.preventDefault();
    onSave(item, '', 'PATCH', { quantity: Number(quantity) });
  }}>
    <label>{item.kind === 'personal' ? '1인 수량' : '파티 전체 수량'}
      <input type="number" min="1" max="99" required value={quantity} disabled={busy}
        onChange={event => setQuantity(event.target.value)} />
    </label>
    <button type="submit" disabled={busy || Number(quantity) === item.quantity}>수량 수정</button>
  </form>;
}

export default function PartyGearList({ party, username, busy, onAdd, onSave, onRemove }) {
  const [filter, setFilter] = useState('mine');
  const [draft, setDraft] = useState(blank);
  const memberCount = party.members.length;
  const items = party.items || [];
  const mine = items.filter(item => myGear(item, username));
  const pending = mine.filter(item => !myGear(item, username).is_packed).length;
  const visible = filter === 'mine' ? mine : items;
  const submit = async event => {
    event.preventDefault();
    if (await onAdd({ ...draft, name: draft.name.trim(), quantity: Number(draft.quantity) })) {
      setDraft(blank);
      if (draft.kind === 'shared') setFilter('all');
    }
  };
  return <>
    <div className="party-item-filters" role="group" aria-label="준비물 보기">
      <button type="button" aria-pressed={filter === 'mine'} onClick={() => setFilter('mine')}>내가 챙길 것 {mine.length}</button>
      <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>파티 전체 {items.length}</button>
    </div>
    {filter === 'mine' && <p className="muted" role="status">내 준비물 {mine.length - pending}/{mine.length}개 완료</p>}
    <form onSubmit={submit} className="planner-inline-form party-gear-create">
      <label className="planner-label">준비물
        <input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} maxLength={120} required />
      </label>
      <label>유형
        <select value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value })}>
          <option value="personal">각자 챙기기</option>
          <option value="shared">함께 쓰기</option>
        </select>
      </label>
      <label>{draft.kind === 'personal' ? '1인 수량' : '파티 전체 수량'}
        <input type="number" min="1" max="99" required value={draft.quantity} onChange={event => setDraft({ ...draft, quantity: event.target.value })} />
      </label>
      <label>단위
        <select value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value })}>
          <option value="개">개</option><option value="L">L</option><option value="팩">팩</option><option value="병">병</option>
        </select>
      </label>
      <button type="submit" disabled={busy || !draft.name.trim()}>추가</button>
    </form>
    {!visible.length && <p className="planner-empty">{filter === 'mine' ? '내가 챙길 물품이 없어요. 파티 전체에서 공동 물품을 확인하세요.' : '파티 준비물을 추가해 보세요.'}</p>}
    <div className="party-items">{visible.map(item => {
      const assignment = myGear(item, username);
      const canManage = party.role === 'owner' || item.created_by_username === username;
      return <div className="party-item" key={item.id}>
        <div>
          <strong>{gearSummary(item, memberCount)}</strong>
          {assignment && <label className="party-item-check">
            <input type="checkbox" checked={assignment.is_packed} disabled={busy}
              onChange={event => onSave(item, '/my-check', 'PUT', { is_packed: event.target.checked })} />
            {item.name} 내 준비 완료 · {amount(item, assignment.quantity)}
          </label>}
          {filter === 'all' && item.kind === 'personal' && prepared(item).length > 0 && <small>준비 완료 · {prepared(item).map(row => row.name).join(', ')}</small>}
          {filter === 'all' && item.kind !== 'personal' && allocations(item).length > 0 && <ul>
            {allocations(item).map(row => <li key={row.username}>{row.name} · {amount(item, row.quantity)} · {row.is_packed ? '완료' : '준비 중'}</li>)}
          </ul>}
        </div>
        {filter === 'all' && <div className="party-item-controls">
          {item.kind !== 'personal' && <GearAllocation key={JSON.stringify(allocations(item))} item={item}
            party={party} username={username} busy={busy} canManage={canManage} onSave={onSave} />}
          {canManage && <GearQuantity key={item.quantity} item={item} busy={busy} onSave={onSave} />}
          {canManage && <button type="button" disabled={busy} aria-label={`${item.name} 삭제`} onClick={() => onRemove(item)}><FiTrash2 /></button>}
        </div>}
      </div>;
    })}</div>
  </>;
}
