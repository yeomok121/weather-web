export const allocations = item => item.member_items || [];
export const amount = (item, quantity = item.quantity) => `${quantity}${item.unit || '개'}`;
const allocated = item => allocations(item).reduce((total, row) => total + row.quantity, 0);
export const prepared = item => allocations(item).filter(row => row.is_packed);
export const missing = item => Math.max(0, item.quantity - allocated(item));

export function myGear(item, username) {
  const member = allocations(item).find(row => row.username === username);
  if (item.kind === 'personal') {
    return { quantity: item.quantity, is_packed: member?.is_packed ?? false };
  }
  return member || null;
}

export function gearSummary(item, memberCount) {
  if (item.kind === 'personal') {
    return `${item.name} · 각자 ${amount(item)} · ${prepared(item).length}/${memberCount}명 준비`;
  }
  if (item.kind === 'assigned') {
    const [assignee] = allocations(item);
    const status = assignee ? `${assignee.name} 담당 · ${assignee.is_packed ? '완료' : '준비 중'}` : '담당 미지정';
    return `${item.name} · ${amount(item)} · ${status}`;
  }
  const ready = item.is_packed && !allocations(item).length
    ? item.quantity : prepared(item).reduce((total, row) => total + row.quantity, 0);
  const status = ready >= item.quantity ? '완료' : missing(item) ? `${amount(item, missing(item))} 담당 미정` : '준비 중';
  return `${item.name} · 함께 ${amount(item)} · ${status}`;
}


export function shareGear(item, memberCount) {
  const summary = gearSummary(item, memberCount);
  if (item.kind === 'personal' || item.kind === 'assigned' || !allocations(item).length) return summary;
  const assignments = allocations(item).map(row => `${row.name} ${amount(item, row.quantity)}`);
  return `${summary} · ${assignments.join(', ')}`;
}
