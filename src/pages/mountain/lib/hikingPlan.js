export function koreanDate(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

export function planDepartureAt({ referenceAt = Date.now(), date, isFuture = false, offsetHours = 0, restoredAt = null }) {
  if (restoredAt && Number.isFinite(Date.parse(restoredAt))) return new Date(restoredAt).toISOString();
  const start = isFuture ? Date.parse(`${date || koreanDate(referenceAt)}T08:00:00+09:00`) : Number(referenceAt);
  return new Date(start + Number(offsetHours) * 3600000).toISOString();
}

export function readHikingDraft(key, storage = localStorage) {
  try {
    const draft = JSON.parse(storage.getItem(key) || 'null');
    if (!draft || !Array.isArray(draft.gearList)) return null;
    return { ...draft, gearList: [...new Set(draft.gearList.filter(item => typeof item === 'string' && item.trim()).map(item => item.slice(0, 120)))].slice(0, 100) };
  } catch { return null; }
}

export function writeHikingDraft(key, draft, storage = localStorage) {
  try { storage.setItem(key, JSON.stringify(draft)); } catch { /* Keep editing if storage is blocked or full. */ }
}
