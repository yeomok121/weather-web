const PREFIX = '직접 입력: ';
const PATTERN = /^직접 입력: ([^·\r\n]{1,60}) · (\d+(?:\.\d{1,2})?)km · (\d{1,4})분$/;

export function makeManualCourse({ name, distance, minutes }) {
  const clean = String(name || '').trim();
  const km = Number(distance);
  const duration = Number(minutes);
  if (!clean || clean.length > 60 || /[·\r\n]/.test(clean)) return null;
  if (!Number.isFinite(km) || km < 0.1 || km > 100 || !/^\d+(?:\.\d{1,2})?$/.test(String(distance))) return null;
  if (!Number.isInteger(duration) || duration < 20 || duration > 1440) return null;
  return { name: `${PREFIX}${clean} · ${km}km · ${duration}분`, distance: `${km}km`, time: duration, diff: '미확인', manual: true };
}

export function parseManualCourse(value) {
  const match = String(value || '').match(PATTERN);
  return match ? makeManualCourse({ name: match[1], distance: match[2], minutes: match[3] }) : null;
}
