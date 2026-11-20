// 낚시 페이지: 출조 골든타임과 갯바위 안전 알림
// 낚시인들이 흔히 쓰는 경험칙을 그대로 계산한 참고용입니다. (어종·포인트마다 다를 수 있음)
//  - 물때: '만조 전후'(만조 2시간 전 ~ 1시간 뒤), '초들물'(간조 30분 뒤 ~ 2시간 30분 뒤) — 물이 움직이는 때
//  - 빛: '새벽'(밝아지기 시작 ~ 일출 1시간 뒤), '해질녘'(일몰 1시간 전 ~ 어두워짐)
//  - 두 가지가 겹치면 골든타임. 밤, 그리고 예보상 파고 2.5 m·바람 14 m/s 이상인 때는 추천하지 않습니다.
import { sunTimesFor } from './sunTimes.js';
import { currentForecastRow } from './seaToday.js';

const H = 3600000;
const SLOT = 10 * 60000;
const ROUGH_WAVE = 2.5;
const ROUGH_WIND = 14;
const num = (value) => { const n = Number.parseFloat(String(value ?? '')); return Number.isFinite(n) ? n : null; };
const kstDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
const kstTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const dayStart = (time) => Date.parse(`${kstDate.format(time)}T00:00:00+09:00`);
export const clock = (time) => kstTime.format(time);

export function parseExtremes(extremes = []) {
  return extremes.map((item) => ({ type: item.type, at: Date.parse(item.time), height: Number(item.height_cm) }))
    .filter((item) => (item.type === 'high' || item.type === 'low') && Number.isFinite(item.at))
    .sort((a, b) => a.at - b.at);
}

export function tideWindows(extremes) {
  return extremes.map((item) => (item.type === 'high'
    ? { start: item.at - 2 * H, end: item.at + H, label: '만조 전후', at: item.at }
    : { start: item.at + 0.5 * H, end: item.at + 2.5 * H, label: '초들물', at: item.at }));
}

// 날짜별 빛 구간 (새벽·낮·해질녘, 나머지는 밤)
export function lightPhases(dayStarts, lat, lon) {
  const phases = [];
  for (const start of dayStarts) {
    const sun = sunTimesFor(start + 12 * H, lat, lon);
    if (!sun || ![sun.dawnAt, sun.sunriseAt, sun.sunsetAt, sun.duskAt].every(Number.isFinite)) continue;
    phases.push({ start: sun.dawnAt, end: sun.sunriseAt + H, label: '새벽' });
    phases.push({ start: sun.sunriseAt + H, end: sun.sunsetAt - H, label: '낮' });
    phases.push({ start: sun.sunsetAt - H, end: sun.duskAt, label: '해질녘' });
  }
  return phases;
}

// from ~ to 를 10분 단위로 나눠 점수를 매기고, 같은 성격끼리 이어 붙인 구간 목록
// score 2 = 골든타임(물때+새벽/해질녘), 1 = 좋은 때(물때+낮 또는 새벽/해질녘만), 0 = 그 밖, rough = 바다 거침
// blocked=true(주의보·경보 발효 중)면 모든 시간을 '바다 거침'으로 보고 추천하지 않습니다.
export function fishingWindows({ extremes = [], lat, lon, from, to, forecastRows = [], blocked = false }) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return [];
  const days = [];
  for (let d = dayStart(from); d <= to; d += 24 * H) days.push(d);
  const tides = tideWindows(extremes);
  const lights = lightPhases(days, lat, lon);
  const segments = [];
  for (let t = from; t < to; t += SLOT) {
    const mid = Math.min(t + SLOT / 2, to);
    const tide = tides.find((w) => mid >= w.start && mid < w.end);
    const light = lights.find((w) => mid >= w.start && mid < w.end)?.label || '밤';
    const row = forecastRows.length ? currentForecastRow(forecastRows, mid) : null;
    const rough = blocked || (Boolean(row) && ((num(row.WH2) ?? num(row.WH1) ?? 0) >= ROUGH_WAVE || (num(row.WS2) ?? num(row.WS1) ?? 0) >= ROUGH_WIND));
    const edge = light === '새벽' || light === '해질녘';
    let score = 0;
    if (!rough && light !== '밤') score = tide && edge ? 2 : tide || edge ? 1 : 0;
    const key = `${score}|${tide?.label || ''}|${light}|${rough}`;
    const last = segments.at(-1);
    if (last && last.key === key) last.end = Math.min(t + SLOT, to);
    else segments.push({ key, start: t, end: Math.min(t + SLOT, to), score, tide: tide?.label || '', light, rough });
  }
  return segments.map(({ key, ...rest }) => rest); // eslint-disable-line no-unused-vars
}

// 추천 목록: 골든타임(20분 이상)을 먼저 고르고, 남는 자리는 물때가 맞는 낮 시간(30분 이상)으로. 시간순으로 보여줍니다.
export function recommendedWindows(windows, limit = 3) {
  const golden = windows.filter((w) => w.score === 2 && w.end - w.start >= 20 * 60000);
  const good = windows.filter((w) => w.score === 1 && w.tide && w.end - w.start >= 30 * 60000);
  return [...golden, ...good].slice(0, limit).sort((a, b) => a.start - b.start);
}

export const windowReason = (w) => [w.tide, w.light === '낮' ? '' : w.light].filter(Boolean).join(' + ') || w.light;

// ── 갯바위 안전 알림 ──
// level: danger(빨강) · warn(주황) · info
export function safetyNotes({ extremes = [], now, tideLabel = '', waveMax = null, windMax = null, warnings = [], sunsetAt = null }) {
  const notes = [];
  for (const item of warnings) {
    if (item.level === '주의' || item.level === '경보') notes.push({ level: 'danger', title: `${item.title} 발효 중`, text: '갯바위·방파제 끝 출입을 삼가세요. 특보 해제 전에는 출조를 미루는 것이 안전해요.' });
  }
  if (waveMax != null && waveMax >= ROUGH_WAVE) notes.push({ level: 'danger', title: `높은 파도 (최대 ${waveMax} m)`, text: '너울이 갯바위를 덮칠 수 있어요. 갯바위·테트라포드에는 오르지 마세요.' });
  else if (waveMax != null && waveMax >= 1.5) notes.push({ level: 'warn', title: `파도 주의 (최대 ${waveMax} m)`, text: '물보라가 닿는 낮은 자리는 피하고, 파도를 등지지 마세요.' });
  if (windMax != null && windMax >= ROUGH_WIND) notes.push({ level: 'danger', title: `강한 바람 (최대 ${windMax} m/s)`, text: '몸이 밀릴 수 있어요. 높은 갯바위·방파제 끝을 피하세요.' });

  const past = extremes.filter((e) => e.at <= now).at(-1);
  const nextHigh = extremes.find((e) => e.at > now && e.type === 'high');
  const nextLow = extremes.find((e) => e.at > now && e.type === 'low');
  if (nextHigh && (!past || past.type === 'low')) {
    const leave = nextHigh.at - H;
    notes.push({ level: 'warn', title: `지금 들물 · 만조 ${clock(nextHigh.at)}`, text: `물이 계속 차올라요. 낮은 갯바위·여·간출암에서는 늦어도 ${clock(leave)}까지 높은 곳으로 옮기거나 철수하세요.` });
  } else if (nextLow && nextHigh) {
    notes.push({ level: 'info', title: `지금 날물 · 간조 ${clock(nextLow.at)}`, text: `간조 뒤 다시 물이 차기 시작해 만조 ${clock(nextHigh.at)}까지 올라와요. 물 빠진 자리로 깊이 들어갔다면 들물 전에 나오세요.` });
  }
  if (['6물', '7물', '8물', '9물'].includes(tideLabel)) notes.push({ level: 'warn', title: `사리 물때 (${tideLabel})`, text: '물이 빨리, 높이 차요. 들물 때 퇴로가 끊기기 쉬우니 철수 시간을 넉넉히 잡으세요.' });
  if (sunsetAt != null && now >= sunsetAt - H) notes.push({ level: 'info', title: '어두워지는 시간', text: '헤드랜턴을 켜고 2명 이상 함께, 가족에게 위치와 귀가 시각을 알려 두세요.' });
  notes.push({ level: 'info', title: '구명조끼 · 해양 사고 신고 122', text: '갯바위·방파제에서도 구명조끼를 입으세요. 물에 빠진 사람을 보면 직접 뛰어들지 말고 122(해양경찰)에 신고하세요.', call: '122' });
  const order = { danger: 0, warn: 1, info: 2 };
  return notes.sort((a, b) => order[a.level] - order[b.level]);
}

// 화면용 한 번에 계산: 오늘·내일 구간, 지금 이후 추천 시간, 안전 알림
export function timingSummary({ tideSource, lat, lon, forecastRows = [], buoyRows = [], warnings = [], tideLabel = '', now }) {
  const extremes = parseExtremes(tideSource?.extremes || []);
  const start = dayStart(now);
  const activeWarning = warnings.find((item) => item.level === '주의' || item.level === '경보');
  const windows = extremes.length ? fishingWindows({ extremes, lat, lon, from: start, to: start + 48 * H, forecastRows, blocked: Boolean(activeWarning) }) : [];
  const upcoming = windows.filter((w) => w.end > now).map((w) => ({ ...w, start: Math.max(w.start, now) }));
  const row = forecastRows.length ? currentForecastRow(forecastRows, now) : null;
  const buoy = buoyRows.find((item) => item.distance_km != null && item.distance_km <= 60);
  const pick = (values) => { const list = values.filter((v) => v != null); return list.length ? Math.max(...list) : null; };
  const waveMax = pick([num(row?.WH2), num(row?.WH1), num(buoy?.WH)]);
  const windMax = pick([num(row?.WS2), num(row?.WS1), num(buoy?.WS)]);
  const sun = sunTimesFor(now, lat, lon);
  return {
    hasTide: extremes.length > 0, extremes, windows, dayStarts: [start, start + 24 * H], blockedBy: activeWarning?.title || '',
    recommended: recommendedWindows(upcoming),
    notes: safetyNotes({ extremes, now, tideLabel, waveMax, windMax, warnings, sunsetAt: sun?.sunsetAt ?? null }),
  };
}
