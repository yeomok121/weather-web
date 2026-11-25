import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { allocations, amount, gearSummary, missing, myGear, prepared } from '../lib/partyGear';

const blank = { name: '', kind: 'personal', quantity: 1, unit: '개', assigned_to_username: '' };
const quantityLabel = { personal: '1인 수량', shared: '파티 전체 수량', assigned: '담당 수량' };

function MemberSelect({ members, username, value, onChange, disabled }) {
  return <select value={value} onChange={event => onChange(event.target.value)} disabled={disabled} required>
    <option value="" disabled>파티원 선택</option>
    {members.map(member => <option value={member.username} key={member.username}>{member.name} (@{member.username}){member.username === username ? ' · 나' : ''}</option>)}
  </select>;
}

function GearAssignee({ item, party, username, busy, onSave }) {
  const current = allocations(item)[0]?.username || '';
  const [target, setTarget] = useState(current);
  const selected = party.members.some(member => member.username === target) ? target : '';
  return <form className="planner-inline-form party-gear-allocation" onSubmit={event => {
    event.preventDefault();
    if (selected && selected !== current) onSave(item, '', 'PATCH', { assigned_to_username: selected });
  }}>
    <label>담당 파티원<MemberSelect members={party.members} username={username} value={selected} onChange={setTarget} disabled={busy} /></label>
    <button type="submit" disabled={busy || !selected || selected === current}>{current ? '담당자 변경' : '담당자 지정'}</button>
  </form>;
}

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
    <label>{quantityLabel[item.kind] || quantityLabel.shared}
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
  const { assigned_to_username: assignee, ...itemDraft } = draft;
  const assigned = draft.kind === 'assigned';
  const selectedAssignee = party.members.some(member => member.username === assignee) ? assignee : '';
  const submit = async event => {
    event.preventDefault();
    if (assigned && !selectedAssignee) return;
    if (await onAdd({ ...itemDraft, name: draft.name.trim(), quantity: Number(draft.quantity), ...(assigned ? { assigned_to_username: selectedAssignee } : {}) })) {
      setDraft(blank);
      if (draft.kind === 'shared' || (assigned && selectedAssignee !== username)) setFilter('all');
    }
  };
  return <>
    <div className="party-item-filters" role="group" aria-label="준비물 보기">
      <button type="button" aria-pressed={filter === 'mine'} onClick={() => setFilter('mine')}>내 담당 준비물 {mine.length}</button>
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
          <option value="assigned">지정한 사람만 챙기기</option>
        </select>
      </label>
      {assigned && <label>담당 파티원
        <MemberSelect members={party.members} username={username} value={selectedAssignee}
          onChange={value => setDraft({ ...draft, assigned_to_username: value })} disabled={busy} />
      </label>}
      <label>{quantityLabel[draft.kind]}
        <input type="number" min="1" max="99" required value={draft.quantity} onChange={event => setDraft({ ...draft, quantity: event.target.value })} />
      </label>
      <label>단위
        <select value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value })}>
          <option value="개">개</option><option value="L">L</option><option value="팩">팩</option><option value="병">병</option>
        </select>
      </label>
      <button type="submit" disabled={busy || !draft.name.trim() || (assigned && !selectedAssignee)}>추가</button>
    </form>
    {!visible.length && <p className="planner-empty">{filter === 'mine' ? '내가 챙길 물품이 없어요. 파티 전체에서 준비물을 확인하세요.' : '파티 준비물을 추가해 보세요.'}</p>}
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
          {filter === 'all' && item.kind !== 'personal' && item.kind !== 'assigned' && allocations(item).length > 0 && <ul>
            {allocations(item).map(row => <li key={row.username}>{row.name} · {amount(item, row.quantity)} · {row.is_packed ? '완료' : '준비 중'}</li>)}
          </ul>}
        </div>
        {filter === 'all' && <div className="party-item-controls">
          {item.kind !== 'personal' && item.kind !== 'assigned' && <GearAllocation key={JSON.stringify(allocations(item))} item={item}
            party={party} username={username} busy={busy} canManage={canManage} onSave={onSave} />}
          {item.kind === 'assigned' && canManage && <GearAssignee key={allocations(item)[0]?.username || 'unassigned'} item={item}
            party={party} username={username} busy={busy} onSave={onSave} />}
          {canManage && <GearQuantity key={item.quantity} item={item} busy={busy} onSave={onSave} />}
          {canManage && <button type="button" disabled={busy} aria-label={`${item.name} 삭제`} onClick={() => onRemove(item)}><FiTrash2 /></button>}
        </div>}
      </div>;
    })}</div>
  </>;
}
