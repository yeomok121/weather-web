// 낚시 페이지: 바다낚시 준비물 목록. 기본 준비물 + 오늘 바다 조건에 따라 더할 것.
import { tideCalendar } from './tideCalendar.js';
export const BASE_GEAR = [
  { id: 'lifejacket', name: '구명조끼', note: '갯바위·방파제·선상 모두 필수' },
  { id: 'shoes', name: '미끄럼 방지 신발', note: '갯바위는 스파이크·펠트 바닥' },
  { id: 'rod', name: '낚싯대·릴·채비', note: '대상 어종에 맞는 바늘·찌·봉돌' },
  { id: 'bait', name: '미끼·밑밥', note: '현지 낚시점에서 구매 가능' },
  { id: 'gloves', name: '장갑', note: '고기·바늘 다룰 때' },
  { id: 'water', name: '물·간식' },
  { id: 'phone', name: '휴대폰 방수팩·보조배터리', note: '해경 122 신고용' },
  { id: 'firstaid', name: '응급약·밴드' },
  { id: 'trash', name: '쓰레기봉투', note: '밑밥·채비 쓰레기 되가져오기' },
];

const maxOf = (values) => Math.max(-Infinity, ...values.filter((value) => Number.isFinite(value)));
const minOf = (values) => Math.min(Infinity, ...values.filter((value) => Number.isFinite(value)));

// conditions: { windMax, airTempMin, airTempMax, waveMax, rain, warningKinds: [], tideLabel }
export function conditionalGear(conditions = {}) {
  const items = [];
  const { windMax, airTempMin, airTempMax, waveMax, rain, warningKinds = [], tideLabel } = conditions;
  if (warningKinds.includes('풍랑') || warningKinds.includes('강풍') || windMax >= 8) items.push({ id: 'windbreaker', name: '방풍 재킷·모자 고정끈', reason: warningKinds.length ? `${warningKinds.join('·')} 특보` : `바람 최대 ${windMax} m/s` });
  if (airTempMin <= 10) items.push({ id: 'warm', name: '방한복·핫팩', reason: `기온 최저 ${airTempMin}°C` });
  if (airTempMax >= 25) items.push({ id: 'sun', name: '선크림·선글라스·챙 모자', reason: `기온 최고 ${airTempMax}°C` });
  if (rain) items.push({ id: 'rain', name: '우비·방수 가방', reason: '해상예보에 비·눈' });
  if (waveMax >= 1.5) items.push({ id: 'wave', name: '높은 파도 주의', reason: `파고 최대 ${waveMax} m · 갯바위 낮은 자리 피하기`, tip: true });
  if (['6물', '7물', '8물', '9물'].includes(tideLabel)) items.push({ id: 'current', name: '무거운 봉돌·여유 채비', reason: `${tideLabel} · 물살이 센 때` });
  items.push({ id: 'lamp', name: '헤드랜턴', reason: '새벽·해질녘 이동' });
  return items;
}

// 화면 데이터에서 오늘 조건을 뽑습니다. (바다낚시지수 오늘 자료 + 해상예보 + 특보)
export function todayConditions({ indexDays = [], forecastRows = [], warnings = [], tideLabel = '' } = {}) {
  const sessions = indexDays[0]?.sessions || [];
  const forecastWind = forecastRows.slice(0, 2).map((row) => Number(row.WS2 ?? row.WS1));
  return {
    windMax: maxOf([...sessions.map((s) => s.wind_ms?.max), ...forecastWind]),
    airTempMin: minOf(sessions.map((s) => s.air_temp_c?.min)),
    airTempMax: maxOf(sessions.map((s) => s.air_temp_c?.max)),
    waveMax: maxOf([...sessions.map((s) => s.wave_m?.max), ...forecastRows.slice(0, 2).map((row) => Number(row.WH2 ?? row.WH1))]),
    rain: forecastRows.slice(0, 2).some((row) => row.PREP && row.PREP !== '0'),
    warningKinds: [...new Set((warnings || []).map((item) => item.kind).filter((kind) => kind === '풍랑' || kind === '강풍'))],
    tideLabel,
  };
}

// ── 내 준비물 세팅 (로그인하면 계정에 저장: 백엔드 /api/users/me/fishing-gear) ──
// setup = { items: [{ id: 'my-…', name, note }], hidden: ['bait', …] }  (hidden = 숨긴 기본 항목 id)
export const GEAR_LIMITS = { items: 30, name: 30, note: 60 };
export const REQUIRED_GEAR = new Set(['lifejacket']); // 안전 필수 항목은 숨길 수 없습니다
export const EMPTY_GEAR_SETUP = Object.freeze({ items: [], hidden: [] });
const MY_ID = /^my-[a-z0-9]{1,24}$/;
const BASE_IDS = new Set(BASE_GEAR.map((item) => item.id));
const tidy = (value, limit) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit); // eslint-disable-line no-control-regex

// 서버·브라우저에서 읽은 값을 화면에서 쓸 수 있는 모양으로 (잘못된 항목은 버림)
export function cleanGearSetup(raw) {
  const items = [];
  for (const item of Array.isArray(raw?.items) ? raw.items : []) {
    const name = tidy(item?.name, GEAR_LIMITS.name);
    if (!MY_ID.test(String(item?.id)) || !name || items.some((other) => other.id === item.id || other.name === name)) continue;
    items.push({ id: item.id, name, note: tidy(item?.note, GEAR_LIMITS.note) });
  }
  const hidden = [...new Set((Array.isArray(raw?.hidden) ? raw.hidden : []).filter((id) => BASE_IDS.has(id) && !REQUIRED_GEAR.has(id)))];
  return { items: items.slice(0, GEAR_LIMITS.items), hidden };
}

// 화면 순서: 오늘 바다 조건 항목 → 내 항목 → 기본 항목(숨긴 것 제외)
export function gearListFor(setup = EMPTY_GEAR_SETUP, extra = []) {
  const hidden = new Set(setup.hidden);
  return [
    ...extra.filter((item) => !item.tip),
    ...setup.items.map((item) => ({ ...item, mine: true })),
    ...BASE_GEAR.filter((item) => !hidden.has(item.id)),
  ];
}

export const newGearId = (random = Math.random) => `my-${random().toString(36).slice(2, 12) || '0'}`;

// 항목 하나 추가. 문제가 있으면 { error } (사용자용 문구)
export function addGearItem(setup, { name, note } = {}, id = newGearId()) {
  const cleanName = tidy(name, 1000);
  const cleanNote = tidy(note, 1000);
  if (!cleanName) return { error: '준비물 이름을 입력해 주세요.' };
  if (cleanName.length > GEAR_LIMITS.name) return { error: `이름은 ${GEAR_LIMITS.name}자까지 쓸 수 있어요.` };
  if (cleanNote.length > GEAR_LIMITS.note) return { error: `메모는 ${GEAR_LIMITS.note}자까지 쓸 수 있어요.` };
  if (setup.items.length >= GEAR_LIMITS.items) return { error: `내 준비물은 최대 ${GEAR_LIMITS.items}개까지 만들 수 있어요.` };
  if (setup.items.some((item) => item.name === cleanName) || BASE_GEAR.some((item) => item.name === cleanName)) return { error: '이미 목록에 있는 준비물이에요.' };
  return { setup: { ...setup, items: [...setup.items, { id, name: cleanName, note: cleanNote }] } };
}

// 화면(준비물 탭·오른쪽 작은 체크리스트)이 함께 쓰는 오늘 목록: { items, tips }
export function todayGearItems({ area, indexDays = [], forecastRows = [], warnings = [], setup, now = Date.now() }) {
  const conditions = todayConditions({ indexDays, forecastRows, warnings, tideLabel: tideCalendar(new Date(now), area?.tide_system === 7 ? 7 : 8).label });
  const extra = conditionalGear(conditions);
  return { items: gearListFor(setup, extra), tips: extra.filter((item) => item.tip) };
}
