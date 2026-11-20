import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastCards, forecastOutlook, formatKmaTime, prettyKey, rangeHigh, upcomingTides } from '../src/pages/fishing/fishingFormat.js';

test('formats KMA timestamps and keeps unknown values', () => {
  assert.equal(formatKmaTime('202611111500'), '11/11 15시');
  assert.equal(formatKmaTime(''), '—');
  assert.equal(formatKmaTime('abc'), 'abc');
});

test('labels known fields and humanizes unknown ones', () => {
  assert.equal(prettyKey('WH'), '유의파고');
  assert.equal(prettyKey('WS2'), '풍속 범위');
  assert.equal(prettyKey('NEW_FIELD'), 'NEW FIELD');
});

test('finds the largest wave and wind ranges in the forecast', () => {
  const rows = [
    { TM_EF: '2026111109', WH1: '0.5', WH2: '1.0', WS1: '4', WS2: '8' },
    { TM_EF: '2026111115', WH1: '1.5', WH2: '2.5', WS1: '3', WS2: '5' },
    { TM_EF: '2026111121', WH1: '-', WS1: '9', WS2: '13' },
  ];
  assert.equal(rangeHigh(rows[1], 'WH'), 2.5);
  const { waveRow, windRow } = forecastOutlook(rows);
  assert.equal(waveRow.TM_EF, '2026111115');
  assert.equal(windRow.TM_EF, '2026111121');
  assert.deepEqual(forecastOutlook([]), { waveRow: undefined, windRow: undefined });
});

test('forecast cards translate precipitation codes', () => {
  const cards = Object.fromEntries(forecastCards({ TM_EF: '2026111115', WF: '비', WH1: '1', WH2: '2', W1: 'N', W2: 'NE', WS1: '5', WS2: '9', PREP: '1' }));
  assert.equal(cards['강수'], '비');
  assert.equal(cards['파고'], '1–2 m');
  assert.equal(cards['풍향'], 'N → NE');
});

test('upcoming tides skip past hours and accept a single item object', () => {
  const now = Date.parse('2026-11-11T12:30:00+09:00');
  const list = { body: { items: { item: [
    { obsvtrNm: '추자도', obsrvnDt: '2026-11-11 12:00', obsrvnHgt: '100' },
    { obsvtrNm: '추자도', obsrvnDt: '2026-11-11 13:00', obsrvnHgt: '150' },
  ] } } };
  assert.deepEqual(upcomingTides(list, { now }).rows.map((row) => row.obsrvnHgt), ['150']);
  assert.equal(upcomingTides(list, { now }).station, '추자도');
  const single = { body: { items: { item: { obsvtrNm: '부산', obsrvnDt: '2026-11-11 13:00', obsrvnHgt: '50' } } } };
  assert.equal(upcomingTides(single, { now }).rows.length, 1);
  assert.deepEqual(upcomingTides(null), { rows: [], station: undefined });
});

import { lunarDay, tideCalendar, tideDayLabel } from '../src/pages/fishing/lib/tideCalendar.js';
import { formatTideTime, tideTimeline } from '../src/pages/fishing/fishingFormat.js';

test('lunar day matches known Korean holidays (설날 1일, 추석 15일)', () => {
  const at = (d) => new Date(`${d}T12:00:00+09:00`);
  assert.equal(lunarDay(at('2025-01-29')), 1);
  assert.equal(lunarDay(at('2025-10-06')), 15);
  assert.equal(lunarDay(at('2026-02-17')), 1); // 합삭이 저녁이어도 그날이 1일
  assert.equal(lunarDay(at('2026-02-16')), 29);
  assert.equal(lunarDay(at('2026-09-25')), 15);
});

test('lunar days advance one per day without gaps for two years', () => {
  let prev = null;
  for (let t = Date.parse('2026-01-01T06:00:00+09:00'); t < Date.parse('2028-01-01T00:00:00+09:00'); t += 86400000) {
    const day = lunarDay(new Date(t));
    if (prev !== null) assert.ok(day === prev + 1 || (day === 1 && (prev === 29 || prev === 30)), `${new Date(t).toISOString()} ${prev}→${day}`);
    prev = day;
  }
});

test('tide day labels for 8물때식 and 7물때식', () => {
  assert.deepEqual([1, 8, 9, 10, 15, 16, 23, 24, 25, 30].map((d) => tideDayLabel(d, 8)), ['7물', '조금', '무시', '1물', '6물', '7물', '조금', '무시', '1물', '6물']);
  assert.equal(tideDayLabel(7, 7), '조금');
  assert.equal(tideDayLabel(9, 7), '1물');
  assert.equal(tideCalendar(new Date('2026-02-24T12:00:00+09:00'), 8).hint, '물 흐름이 가장 약한 때');
});

test('tide times show 내일 for the next day in Korea time', () => {
  const now = Date.parse('2026-11-11T22:00:00+09:00');
  assert.equal(formatTideTime('2026-11-11T23:40+09:00', now), '23:40');
  assert.equal(formatTideTime('2026-11-12T05:10+09:00', now), '내일 05:10');
  assert.equal(formatTideTime('bad', now), '—');
});

test('tide timeline keeps recent points and upcoming extremes only', () => {
  const now = Date.parse('2026-11-11T12:00:00+09:00');
  const source = {
    station: '추자도',
    predictions: [8, 10, 12, 14].map((h, i) => ({ time: `2026-11-11T${String(h).padStart(2, '0')}:00+09:00`, height_cm: 100 + i })),
    extremes: [{ type: 'low', time: '2026-11-11T09:30+09:00', height_cm: 40 }, { type: 'high', time: '2026-11-11T15:20+09:00', height_cm: 300 }],
  };
  const timeline = tideTimeline(source, { now });
  assert.deepEqual(timeline.points.map((p) => p.height), [101, 102, 103]);
  assert.deepEqual(timeline.upcoming.map((e) => e.type), ['high']);
  assert.deepEqual(tideTimeline(undefined), { points: [], upcoming: [], station: '' });
});

import { formatRange, gradeTone, indexDayLabel } from '../src/pages/fishing/fishingFormat.js';

test('fishing index helpers format ranges, grades and day labels', () => {
  assert.equal(formatRange({ min: 0.6, max: 0.9 }, ' m'), '0.6–0.9 m');
  assert.equal(formatRange({ min: 16, max: 16 }, '°C'), '16.0°C');
  assert.equal(formatRange({ min: null, max: 0.6 }, '', 2), '0.60');
  assert.equal(formatRange(null), '—');
  assert.equal(gradeTone('매우좋음'), 'best');
  assert.equal(gradeTone('나쁨'), 'bad');
  assert.equal(gradeTone('?'), 'unknown');
  const now = Date.parse('2026-11-17T09:00:00+09:00');
  assert.equal(indexDayLabel('2026-11-17', now), '오늘');
  assert.equal(indexDayLabel('2026-11-18', now), '내일');
  assert.equal(indexDayLabel('2026-11-19', now), '11/19 (목)');
});

import { sessionLabel } from '../src/pages/fishing/fishingFormat.js';

test('fishing index day-long sessions are labeled', () => {
  assert.equal(sessionLabel('일'), '하루 전체');
  assert.equal(sessionLabel('오전'), '오전');
  assert.equal(sessionLabel(''), '—');
});

import { bestFishingDay, recommendFishingDay, warningBlockedDates } from '../src/pages/fishing/lib/bestDay.js';
import { fishingLightWindows, sunTimesFor } from '../src/pages/fishing/lib/sunTimes.js';
import { conditionalGear, todayConditions } from '../src/pages/fishing/lib/gear.js';

const session = (name, grades, wave = 1, wind = 5) => ({ session: name, tide_phase: '중조기', wave_m: { min: wave, max: wave }, wind_ms: { min: wind, max: wind },
  species: grades.map(([n, g]) => ({ name: n, index: g })) });

test('best day picks the highest grade, then more good species, then calmer sea', () => {
  const now = Date.parse('2026-11-17T09:00:00+09:00');
  const days = [
    { date: '2026-11-17', sessions: [session('오전', [['볼락', '보통']]), session('오후', [['감성돔', '매우나쁨']])] },
    { date: '2026-11-22', sessions: [session('일', [['감성돔', '좋음'], ['농어', '좋음']], 0.8, 2.8)] },
    { date: '2026-11-23', sessions: [session('일', [['감성돔', '매우좋음'], ['기타어종', '매우좋음'], ['볼락', '좋음']], 0.2, 3.9)] },
    { date: '2026-11-24', sessions: [session('일', [['돌돔', '매우좋음']], 1.5, 8)] },
  ];
  const { best } = bestFishingDay(days, { now });
  assert.equal(best.date, '2026-11-23');
  assert.equal(best.topGrade, '매우좋음');
  assert.deepEqual(best.topSpecies, ['감성돔', '기타어종']);
});

test('best day skips past sessions and reports none when everything is bad', () => {
  const afternoon = Date.parse('2026-11-17T15:00:00+09:00');
  const days = [{ date: '2026-11-17', sessions: [session('오전', [['볼락', '좋음']]), session('오후', [['볼락', '나쁨']])] }];
  assert.equal(bestFishingDay(days, { now: afternoon }).best, null);
  assert.equal(bestFishingDay(days, { now: Date.parse('2026-11-17T08:00:00+09:00') }).best.session.session, '오전');
  assert.deepEqual(bestFishingDay([], {}), { best: null, checked: 0 });
});

test('sun times give dawn before sunrise and dusk after sunset in Korea time', () => {
  const t = sunTimesFor(Date.parse('2026-11-17T12:00:00+09:00'), 33.96, 126.44);
  assert.match(t.sunrise, /^07:\d\d$/);
  assert.match(t.sunset, /^17:\d\d$/);
  assert.ok(t.dawn < t.sunrise && t.dusk > t.sunset);
  assert.equal(sunTimesFor(Date.now(), null, 126), null);
  const evening = fishingLightWindows(Date.parse('2026-11-17T20:00:00+09:00'), 33.96, 126.44);
  assert.equal(evening.morningIsToday, false);
  const early = fishingLightWindows(Date.parse('2026-11-17T04:00:00+09:00'), 33.96, 126.44);
  assert.equal(early.morningIsToday, true);
});

test('gear adds items from today\'s sea conditions', () => {
  const conditions = todayConditions({
    indexDays: [{ date: '2026-11-17', sessions: [session('오전', [['볼락', '보통']], 0.7, 13.7)] }].map((d) => ({ ...d, sessions: d.sessions.map((s) => ({ ...s, air_temp_c: { min: 8.5, max: 12 } })) })),
    forecastRows: [{ WS1: '10', WS2: '16', WH1: '1.5', WH2: '4.0', PREP: '1' }],
    warnings: [{ kind: '풍랑', level: '주의' }, { kind: '호우', level: '주의' }],
    tideLabel: '7물',
  });
  assert.equal(conditions.windMax, 16);
  assert.equal(conditions.waveMax, 4);
  assert.deepEqual(conditions.warningKinds, ['풍랑']);
  const ids = conditionalGear(conditions).map((item) => item.id);
  assert.deepEqual(ids, ['windbreaker', 'warm', 'rain', 'wave', 'current', 'lamp']);
  assert.deepEqual(conditionalGear({}).map((item) => item.id), ['lamp']);
});

test('days until a warning is lifted are skipped from the recommendation', () => {
  const now = Date.parse('2026-11-17T09:00:00+09:00');
  const days = ['2026-11-17', '2026-11-18', '2026-11-21', '2026-11-22', '2026-11-23'].map((date, i) => ({ date,
    sessions: [session('일', [['감성돔', i < 3 ? '매우좋음' : i === 3 ? '좋음' : '보통']])] }));
  const warnings = [{ level: '주의', title: '풍랑주의보', release_hint: '21일 오전(09시~12시)' }, { level: '예비', title: '강풍 예비특보', release_hint: '' }];
  assert.deepEqual([...warningBlockedDates(days, warnings, { now })], ['2026-11-17', '2026-11-18', '2026-11-21']);
  const result = recommendFishingDay(days, warnings, { now });
  assert.equal(result.best.date, '2026-11-22');
  assert.equal(result.insideWarning, false);
  // 예비특보만 있으면 빼지 않음
  assert.equal(recommendFishingDay(days, [warnings[1]], { now }).best.date, '2026-11-17');
  // 해제 예고가 없으면 오늘만 뺌
  assert.deepEqual([...warningBlockedDates(days, [{ level: '경보', release_hint: '' }], { now })], ['2026-11-17']);
  // 특보 기간 밖에 좋은 날이 없으면 특보 기간 안에서 고르고 표시
  const onlyBlocked = recommendFishingDay(days.slice(0, 3), warnings, { now });
  assert.equal(onlyBlocked.insideWarning, true);
  // 해제 예고일이 자료 범위 밖이어도 그날까지의 자료는 모두 뺌
  assert.deepEqual([...warningBlockedDates(days.slice(0, 2), warnings, { now })], ['2026-11-17', '2026-11-18']);
  // 월말: 30일 기준 "2일"은 다음 달 2일
  const monthEnd = Date.parse('2026-11-30T09:00:00+09:00');
  const decDays = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03'].map((date) => ({ date, sessions: [session('일', [['감성돔', '좋음']])] }));
  assert.deepEqual([...warningBlockedDates(decDays, [{ level: '주의', release_hint: '2일 밤(21시~24시)' }], { now: monthEnd })], ['2026-11-30', '2026-12-01', '2026-12-02']);
});

import { mergeFavoritePoints, MAX_FAVORITE_POINTS } from '../src/pages/fishing/lib/favorites.js';

test('favorite points merge keeps account order, appends new browser ones, caps at 10', () => {
  assert.deepEqual(mergeFavoritePoints(['추자도', '모항항'], ['모항항', '김녕']), ['추자도', '모항항', '김녕']);
  assert.deepEqual(mergeFavoritePoints([], []), []);
  const many = Array.from({ length: 12 }, (_, i) => `p${i}`);
  assert.equal(mergeFavoritePoints(many.slice(0, 8), many.slice(8)).length, MAX_FAVORITE_POINTS);
});

import { explainFactors, explainReason, judgeWave, judgeWind } from '../src/pages/fishing/lib/indexExplain.js';

const conditionSession = (wave, wind, air, grades, tide = '소조기') => ({ tide_phase: tide, wave_m: { min: wave, max: wave }, wind_ms: { min: wind - 1, max: wind },
  air_temp_c: { min: air, max: air + 1 }, water_temp_c: { min: 17, max: 17.2 }, current_speed: { min: 0.2, max: 0.4 }, species: grades.map((g, i) => ({ name: `어종${i}`, index: g })) });

test('wave and wind thresholds', () => {
  assert.deepEqual([0.4, 0.9, 1.3, 2.0, 3.0].map((v) => judgeWave(v).tone), ['good', 'normal', 'caution', 'bad', 'bad']);
  assert.deepEqual([3, 6, 9, 13].map((v) => judgeWind(v).label), ['약함', '보통', '강함', '매우 강함']);
  assert.equal(judgeWave(null), null);
});

test('reason sentence explains why the index is low or high (real 2026-11-18 추자도 values)', () => {
  assert.equal(explainReason(conditionSession(1.3, 13.7, 13.1, ['매우나쁨'])), '파도가 다소 높고(최대 1.3 m), 바람이 매우 강해서(최대 13.7 m/s) 지수가 낮습니다.');
  assert.equal(explainReason(conditionSession(0.9, 9, 13, ['나쁨'])), '바람이 강해서(최대 9.0 m/s) 지수가 낮습니다.');
  assert.equal(explainReason(conditionSession(0.4, 3, 13, ['매우좋음'])), '파도와 바람이 잔잔해 낚시하기 좋은 조건입니다.');
  assert.equal(explainReason(conditionSession(0.9, 6, 13, ['매우좋음'])), '파도와 바람이 무난해 낚시하기 좋은 조건입니다.');
  assert.equal(explainReason(conditionSession(1.3, 9, 13, ['좋음'])), '파도 최대 1.3 m, 바람 최대 9.0 m/s로 다소 거칠지만 어종에 따라서는 좋은 조건입니다.');
  assert.equal(explainReason(conditionSession(0.4, 3, 13, ['나쁨'])), '파도·바람은 무난하지만 수온·물때 등 어종별 조건이 맞지 않아 지수가 낮습니다.');
  assert.equal(explainReason({ species: [] }), '지수 자료가 없습니다.');
});

test('factor list covers each condition with tide explanation', () => {
  const factors = explainFactors(conditionSession(2.4, 16.3, 3, ['매우나쁨'], '대조기'));
  assert.deepEqual(factors.map((f) => f.id), ['wave', 'wind', 'water', 'air', 'current', 'tide']);
  assert.equal(factors.find((f) => f.id === 'air').label, '추움');
  assert.equal(factors.find((f) => f.id === 'tide').label, '물살 셈');
  assert.equal(factors.find((f) => f.id === 'wave').value, '2.4 m');
});

import { currentForecastRow, seaWeather, skyIcon, todayBestGrade, todayVerdict } from '../src/pages/fishing/lib/seaToday.js';

// 2026-11-18 11:22 배포 서버 추자도 실제 응답 일부
const REAL_NOW = Date.parse('2026-11-18T11:22:00+09:00');
const REAL_FORECAST = [
  { TM_EF: '202611181200', WF: '구름많고 가끔 비', WS1: '9', WS2: '15', WH1: '1.5', WH2: '3.5' },
  { TM_EF: '202611190000', WF: '구름많고 한때 비', WS1: '10', WS2: '15', WH1: '2.0', WH2: '3.5' },
];
const REAL_BUOYS = [{ STN_KO: '추자도', TM: '202611181100', WH: '1.7', WS: '9.0', TW: '19.5', TA: '13.5', distance_km: 23.8 }];
const realSession = (name, grade) => ({ session: name, tide_phase: '소조기', wave_m: { min: 1.3, max: 1.3 }, wind_ms: { min: 9.7, max: 11.1 },
  air_temp_c: { min: 13.1, max: 13.5 }, water_temp_c: { min: 17.1, max: 17.1 }, species: [{ name: '감성돔', index: grade }] });
const REAL_DAYS = [{ date: '2026-11-18', sessions: [realSession('오전', '매우나쁨'), realSession('오후', '매우나쁨')] },
  { date: '2026-11-22', sessions: [realSession('일', '보통')] }];
const REAL_WARNINGS = [
  { title: '풍랑주의보', level: '주의', effective: '17일 19:00', release_hint: '21일 오전(09시~12시)' },
  { title: '강풍 예비특보', level: '예비', effective: '18일 오후(12시~18시)', release_hint: '' },
];

test('sea weather line uses the near buoy for live values and the forecast for the sky', () => {
  assert.equal(currentForecastRow(REAL_FORECAST, REAL_NOW).TM_EF, '202611181200'); // 아직 12시 전이면 첫 예보
  assert.equal(currentForecastRow(REAL_FORECAST, Date.parse('2026-11-19T03:00:00+09:00')).TM_EF, '202611190000');
  const weather = seaWeather({ forecastRows: REAL_FORECAST, buoyRows: REAL_BUOYS, indexDays: REAL_DAYS, now: REAL_NOW });
  assert.deepEqual([weather.sky, weather.icon, weather.airTemp, weather.wind, weather.wave, weather.waterTemp], ['구름많고 가끔 비', '🌧', '13.5°C', '9 m/s', '1.7 m', '19.5°C']);
  assert.deepEqual(weather.buoy, { name: '추자도', distance: 23.8, hour: '11' });
  const far = seaWeather({ forecastRows: REAL_FORECAST, buoyRows: [{ ...REAL_BUOYS[0], distance_km: 100 }], indexDays: REAL_DAYS, now: REAL_NOW });
  assert.deepEqual([far.wind, far.wave, far.airTemp, far.buoy], ['9–15 m/s', '1.5–3.5 m', '13.1–13.5°C', null]);
  assert.equal(seaWeather({}), null);
  assert.deepEqual(['맑음', '구름많음', '흐림', '비', '눈'].map(skyIcon), ['☀', '⛅', '☁', '🌧', '🌨']);
});

test('today verdict: real 추자도 day is 비추천 with the strongest reasons first', () => {
  const verdict = todayVerdict({ warnings: REAL_WARNINGS, indexDays: REAL_DAYS, forecastRows: REAL_FORECAST, buoyRows: REAL_BUOYS, now: REAL_NOW });
  assert.equal(verdict.tone, 'stop');
  assert.equal(verdict.title, '오늘은 출조 비추천');
  assert.deepEqual(verdict.reasons, ['풍랑주의보 발효', '오늘 낚시지수 매우나쁨', '파고 최대 3.5 m']);
});

test('today verdict levels from index, wave, wind and preliminary warnings', () => {
  const calm = [{ TM_EF: '202611221200', WF: '맑음', WS1: '2', WS2: '4', WH1: '0.5', WH2: '0.5' }];
  const day = (grade) => [{ date: '2026-11-22', sessions: [realSession('일', grade)] }];
  const at = Date.parse('2026-11-22T13:00:00+09:00');
  assert.equal(todayVerdict({ indexDays: day('좋음'), forecastRows: calm, now: at }).tone, 'go');
  assert.equal(todayVerdict({ indexDays: day('보통'), forecastRows: calm, now: at }).tone, 'okay');
  assert.equal(todayVerdict({ indexDays: day('좋음'), forecastRows: [{ ...calm[0], WS2: '11' }], now: at }).tone, 'caution');
  const pre = todayVerdict({ indexDays: day('좋음'), forecastRows: calm, now: at, warnings: [{ title: '강풍 예비특보', level: '예비', effective: '22일 오후(12시~18시)' }] });
  assert.deepEqual([pre.tone, pre.reasons[0]], ['caution', '강풍 예비특보 (오늘 오후(12시~18시))']);
  assert.equal(todayVerdict({}), null);
  // 정오가 지나면 끝난 오전 지수는 보지 않음
  assert.equal(todayBestGrade([{ date: '2026-11-22', sessions: [realSession('오전', '매우좋음'), realSession('오후', '나쁨')] }], at), '나쁨');
});

import { BASE_GEAR, EMPTY_GEAR_SETUP, addGearItem, cleanGearSetup, gearListFor, newGearId } from '../src/pages/fishing/lib/gear.js';

test('my gear setup: add, validate, hide base items but never the life jacket', () => {
  let setup = EMPTY_GEAR_SETUP;
  const first = addGearItem(setup, { name: '  루어 박스 ', note: '스푼·지그' }, 'my-a1');
  setup = first.setup;
  assert.deepEqual(setup.items, [{ id: 'my-a1', name: '루어 박스', note: '스푼·지그' }]);
  assert.equal(addGearItem(setup, { name: '루어 박스' }).error, '이미 목록에 있는 준비물이에요.');
  assert.equal(addGearItem(setup, { name: '구명조끼' }).error, '이미 목록에 있는 준비물이에요.');
  assert.equal(addGearItem(setup, { name: '   ' }).error, '준비물 이름을 입력해 주세요.');
  assert.match(addGearItem(setup, { name: '가'.repeat(31) }).error, /30자/);
  const full = { items: Array.from({ length: 30 }, (_, i) => ({ id: `my-${i}`, name: `항목${i}`, note: '' })), hidden: [] };
  assert.match(addGearItem(full, { name: '하나 더' }).error, /최대 30개/);

  // 서버에서 온 값 정리: 잘못된 id·중복·없는 기본 id·구명조끼 숨김은 버림
  const cleaned = cleanGearSetup({ items: [...setup.items, { id: 'x', name: '나쁜 id' }, { id: 'my-b', name: '루어 박스' }],
    hidden: ['bait', 'bait', 'lifejacket', 'nope'] });
  assert.deepEqual(cleaned, { items: setup.items, hidden: ['bait'] });
  assert.deepEqual(cleanGearSetup(null), { items: [], hidden: [] });

  // 화면 순서: 오늘 조건 → 내 항목 → 기본(숨긴 것 제외)
  const list = gearListFor(cleaned, [{ id: 'lamp', name: '헤드랜턴', reason: '새벽' }, { id: 'wave', name: '높은 파도', tip: true }]);
  assert.deepEqual(list.slice(0, 2).map((item) => item.id), ['lamp', 'my-a1']);
  assert.equal(list[1].mine, true);
  assert.equal(list.some((item) => item.id === 'bait'), false);
  assert.equal(list.length, 2 + BASE_GEAR.length - 1);
  assert.match(newGearId(), /^my-[a-z0-9]{1,24}$/);
});

import { FISHING_TABS, tabFromQuery } from '../src/pages/fishing/lib/tabs.js';

test('fishing tabs come from the address and fall back to the first tab', () => {
  assert.deepEqual(FISHING_TABS.map((tab) => tab.id), ['index', 'forecast', 'sea', 'gear', 'species']);
  assert.equal(tabFromQuery('gear'), 'gear');
  assert.equal(tabFromQuery(null), 'index');
  assert.equal(tabFromQuery('<script>'), 'index');
});

import { distanceKm, nearestPoint } from '../src/pages/fishing/lib/nearest.js';

test('nearest fishing point to the user location', () => {
  const points = [
    { id: '가거도', lat: 34.07308, lon: 125.08805 }, { id: '추자도', lat: 33.9541, lon: 126.3108 },
    { id: '김녕', lat: 33.5609, lon: 126.74018 }, { id: '생도', lat: 35.0386, lon: 129.0904 }, { id: '좌표없음', lat: null, lon: null },
  ];
  assert.ok(Math.abs(distanceKm({ lat: 37.5665, lon: 126.978 }, { lat: 35.1796, lon: 129.0756 }) - 325) < 5); // 서울–부산 약 325 km
  const busan = nearestPoint(points, { lat: 35.1, lon: 129.04 });
  assert.equal(busan.point.id, '생도');
  assert.ok(busan.distanceKm > 7 && busan.distanceKm < 9);
  assert.equal(nearestPoint(points, { lat: 33.5, lon: 126.53 }).point.id, '김녕'); // 제주시
  assert.equal(nearestPoint(points, null), null);
  assert.equal(nearestPoint([], { lat: 35, lon: 129 }), null);
});

import { hasSpeciesName, namedSpecies } from '../src/pages/fishing/fishingFormat.js';

test("species '-' from KHOA is treated as no species name", () => {
  assert.deepEqual(['감성돔', '기타어종', '-', ' - ', '—', '', null, undefined].map(hasSpeciesName), [true, true, false, false, false, false, false, false]);
  assert.deepEqual(namedSpecies([{ name: '-', index: '매우나쁨' }]), []);
  assert.deepEqual(namedSpecies([{ name: '-', index: '보통' }, { name: '우럭', index: '좋음' }]).map((item) => item.name), ['우럭']);
});

import { readCachedPoints, readCachedSummary, saveCachedPoints, saveCachedSummary, shouldRetry, withRetry } from '../src/pages/fishing/lib/resilience.js';

const memoryStorage = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)) }; };

test('fishing requests retry only on temporary failures', async () => {
  assert.deepEqual([{ status: 0 }, { status: 429 }, { status: 503 }, { status: 404 }, { status: 401 }, { status: 0, timeout: true }, { name: 'AbortError' }].map(shouldRetry),
    [true, true, true, false, false, false, false]);
  let calls = 0;
  const waits = [];
  const ok = await withRetry(async () => { calls += 1; if (calls < 3) throw { status: 429 }; return 'ok'; }, { wait: async (ms) => waits.push(ms) });
  assert.equal(ok, 'ok'); assert.equal(calls, 3); assert.deepEqual(waits, [2000, 5000]);
  calls = 0;
  await assert.rejects(withRetry(async () => { calls += 1; throw { status: 404 }; }, { wait: async () => {} }));
  assert.equal(calls, 1); // 404는 다시 묻지 않음
  calls = 0;
  await assert.rejects(withRetry(async () => { calls += 1; throw { status: 0 }; }, { wait: async () => {} }));
  assert.equal(calls, 3); // 처음 + 두 번까지
});

test('last fishing data is kept per point for 12 hours', () => {
  const storage = memoryStorage();
  const t0 = Date.parse('2026-11-20T09:00:00+09:00');
  saveCachedSummary('point:추자도', { region_name: '남해서부서쪽먼바다' }, { now: t0, storage });
  assert.equal(readCachedSummary('point:추자도', { now: t0 + 60 * 60 * 1000, storage }).data.region_name, '남해서부서쪽먼바다');
  assert.equal(readCachedSummary('point:추자도', { now: t0 + 13 * 60 * 60 * 1000, storage }), null); // 너무 오래된 자료는 안 보여줌
  assert.equal(readCachedSummary('point:김녕', { now: t0, storage }), null);
  for (let i = 0; i < 10; i += 1) saveCachedSummary(`point:p${i}`, { i }, { now: t0 + i, storage });
  assert.equal(readCachedSummary('point:추자도', { now: t0, storage }), null); // 최근 8곳만 남김
  assert.equal(readCachedSummary('point:p9', { now: t0, storage }).data.i, 9);
  assert.equal(readCachedSummary('x', { storage: { getItem: () => '{broken' } }), null);
  saveCachedPoints([{ id: '추자도' }], { now: t0, storage });
  assert.deepEqual(readCachedPoints({ now: t0, storage }), [{ id: '추자도' }]);
  assert.equal(readCachedPoints({ now: t0 + 8 * 24 * 60 * 60 * 1000, storage }), null);
});

import { compareRows, daySummary } from '../src/pages/fishing/lib/compare.js';

test('compare favorite points: today/tomorrow best grade and recommendation', () => {
  const session = (name, grade, wave, wind) => ({ session: name, tide_phase: '소조기', wave_m: { min: 0.3, max: wave }, wind_ms: { min: 2, max: wind }, species: [{ name: '감성돔', index: grade }, { name: '-', index: '나쁨' }] });
  const index = (todayAm, todayPm, tomorrow) => ({ status: 'ready', index: { days: [
    { date: '2026-11-20', sessions: [session('오전', ...todayAm), session('오후', ...todayPm)] },
    { date: '2026-11-21', sessions: [session('일', ...tomorrow)] }] } });
  const pm = Date.parse('2026-11-20T14:00:00+09:00');
  const byName = {
    추자도: index(['매우좋음', 0.5, 4], ['나쁨', 1.8, 11], ['좋음', 0.9, 6]),
    김녕: index(['보통', 0.6, 5], ['보통', 0.6, 5], ['좋음', 0.5, 4]),
    가거도: { status: 'failed' },
  };
  const { rows, bestToday, bestTomorrow } = compareRows(['추자도', '김녕', '가거도', '모항항'], byName, pm);
  // 오후 2시: 추자도 오전 '매우좋음'은 끝났으니 오후 '나쁨'만 봄
  assert.deepEqual([rows[0].today.grade, rows[0].today.waveMax, rows[0].today.windMax], ['나쁨', 1.8, 11]);
  assert.equal(bestToday, '김녕');
  assert.equal(bestTomorrow, '김녕'); // 둘 다 '좋음'이면 파고가 낮은 곳
  assert.deepEqual(rows.map((r) => r.status), ['ready', 'ready', 'failed', 'loading']);
  assert.equal(compareRows(['추자도'], byName, Date.parse('2026-11-20T09:00:00+09:00')).bestToday, '추자도'); // 오전에는 오전 지수 포함
  assert.equal(daySummary(undefined), null);
  assert.equal(compareRows(['추자도'], { 추자도: index(['나쁨', 2, 12], ['나쁨', 2, 12], ['매우나쁨', 3, 15]) }, pm).bestToday, null);
});

import { fishingWindows, parseExtremes, recommendedWindows, safetyNotes, windowReason, clock } from '../src/pages/fishing/lib/fishingTime.js';

// 2026-11-20 추자도 실제 조위 극값(TideBED)
const CHUJA_EXTREMES = parseExtremes([
  { type: 'high', time: '2026-11-20T01:11+09:00' }, { type: 'low', time: '2026-11-20T07:23+09:00' },
  { type: 'high', time: '2026-11-20T13:37+09:00' }, { type: 'low', time: '2026-11-20T19:49+09:00' },
  { type: 'high', time: '2026-11-21T02:01+09:00' }, { type: 'low', time: '2026-11-21T08:14+09:00' },
  { type: 'high', time: '2026-11-21T14:27+09:00' }, { type: 'low', time: '2026-11-21T20:40+09:00' },
]);
const CHUJA = { lat: 33.9541, lon: 126.3108 };

test('golden time: tide windows overlapping dawn/dusk, never at night', () => {
  const from = Date.parse('2026-11-20T05:00:00+09:00');
  const windows = fishingWindows({ extremes: CHUJA_EXTREMES, ...CHUJA, from, to: Date.parse('2026-11-21T00:00:00+09:00') });
  const golden = windows.filter((w) => w.score === 2);
  assert.deepEqual(golden.map((w) => [clock(w.start), clock(w.end), windowReason(w)]), [['07:50', '08:10', '초들물 + 새벽']]);
  assert.ok(windows.filter((w) => w.light === '밤').every((w) => w.score === 0)); // 20:19 초들물은 밤이라 추천 안 함
  const rec = recommendedWindows(windows);
  assert.deepEqual(rec.map((w) => `${clock(w.start)}-${clock(w.end)} ${windowReason(w)}`), ['07:50-08:10 초들물 + 새벽', '08:10-09:50 초들물', '11:40-14:40 만조 전후']);
});

test('golden time is not recommended when the forecast is rough', () => {
  const rough = [{ TM_EF: '202611200000', WH1: '2.0', WH2: '3.0', WS1: '9', WS2: '12' }];
  const windows = fishingWindows({ extremes: CHUJA_EXTREMES, ...CHUJA, from: Date.parse('2026-11-20T05:00:00+09:00'), to: Date.parse('2026-11-21T00:00:00+09:00'), forecastRows: rough });
  assert.equal(recommendedWindows(windows).length, 0);
  assert.ok(windows.every((w) => w.rough));
});

test('rocky shore safety notes from tide state, sea and warnings', () => {
  const rising = safetyNotes({ extremes: CHUJA_EXTREMES, now: Date.parse('2026-11-20T10:00:00+09:00'), tideLabel: '7물', waveMax: 1.8 });
  assert.deepEqual(rising.map((n) => `${n.level} ${n.title}`), ['warn 파도 주의 (최대 1.8 m)', 'warn 지금 들물 · 만조 13:37', 'warn 사리 물때 (7물)', 'info 구명조끼 · 해양 사고 신고 122']);
  assert.match(rising[1].text, /12:37까지/); // 만조 1시간 전 철수
  const falling = safetyNotes({ extremes: CHUJA_EXTREMES, now: Date.parse('2026-11-20T15:00:00+09:00'), sunsetAt: Date.parse('2026-11-20T17:28:00+09:00') });
  assert.equal(falling[0].title, '지금 날물 · 간조 19:49');
  const storm = safetyNotes({ extremes: CHUJA_EXTREMES, now: Date.parse('2026-11-20T16:40:00+09:00'), waveMax: 3.5, windMax: 15, warnings: [{ title: '풍랑주의보', level: '주의' }, { title: '강풍 예비특보', level: '예비' }],
    sunsetAt: Date.parse('2026-11-20T17:28:00+09:00') });
  assert.deepEqual(storm.filter((n) => n.level === 'danger').map((n) => n.title), ['풍랑주의보 발효 중', '높은 파도 (최대 3.5 m)', '강한 바람 (최대 15 m/s)']);
  assert.ok(storm.some((n) => n.title === '어두워지는 시간')); // 일몰 1시간 전부터
  assert.equal(storm.at(-1).call, '122');
});

import { timingSummary } from '../src/pages/fishing/lib/fishingTime.js';

test('no fishing time is recommended while a marine warning is active', () => {
  const tideSource = { extremes: [{ type: 'high', time: '2026-11-20T13:37+09:00' }, { type: 'low', time: '2026-11-20T19:49+09:00' }] };
  const base = { tideSource, ...CHUJA, now: Date.parse('2026-11-20T10:00:00+09:00') };
  assert.ok(timingSummary(base).recommended.length > 0);
  const stormy = timingSummary({ ...base, warnings: [{ title: '풍랑주의보', level: '주의' }] });
  assert.deepEqual([stormy.recommended.length, stormy.blockedBy], [0, '풍랑주의보']);
  assert.ok(stormy.windows.every((w) => w.rough));
  assert.equal(timingSummary({ ...base, warnings: [{ title: '강풍 예비특보', level: '예비' }] }).blockedBy, ''); // 예비특보는 막지 않음
});

import { SPECIES, daysUntilClosed, findSpecies, isClosedNow, speciesStatus } from '../src/pages/fishing/lib/speciesRules.js';

test('species rules match the law tables checked on law.go.kr (2026-11-20)', () => {
  const size = Object.fromEntries(SPECIES.map((s) => [s.name, s.minSizeCm]));
  assert.deepEqual(size, { 감성돔: 25, 참돔: 24, 돌돔: 24, 벵에돔: null, 농어: 30, 우럭: 23, 볼락: 15, 광어: 35, 쥐노래미: 20 });
  assert.equal(findSpecies('조피볼락').name, '우럭');
  assert.equal(findSpecies('넙치').name, '광어');
  assert.equal(findSpecies('기타어종'), null);
  assert.equal(findSpecies('노래미'), null); // 쥐노래미와 다른 종
  const at = (iso) => Date.parse(`${iso}T12:00:00+09:00`);
  const porgy = findSpecies('감성돔');
  assert.deepEqual([isClosedNow(porgy, at('2026-04-30')), isClosedNow(porgy, at('2026-05-01')), isClosedNow(porgy, at('2026-05-31')), isClosedNow(porgy, at('2026-06-01'))], [false, true, true, false]);
  assert.equal(daysUntilClosed(porgy, at('2026-04-21')), 10);
  assert.deepEqual(speciesStatus(porgy, at('2026-04-21')), { kind: 'soon', text: '금어기 10일 전' });
  const greenling = findSpecies('쥐노래미');
  assert.deepEqual(speciesStatus(greenling, at('2026-11-20')), { kind: 'closed', text: '지금 금어기' }); // 오늘 실제로 금어기
  assert.equal(isClosedNow(greenling, at('2026-10-31')), false);
  assert.equal(isClosedNow(greenling, at('2027-01-01')), false);
  assert.deepEqual(speciesStatus(findSpecies('참돔'), at('2026-05-10')), { kind: 'open', text: '금어기 없음' });
});

import { draftProblem, timeAgo } from '../src/pages/fishing/lib/communityRules.js';

test('community draft checks, including closed season and minimum size', () => {
  const nov = Date.parse('2026-11-20T12:00:00+09:00');
  const brag = { category: '자랑', title: '감성돔', photos: ['x'], species: '감성돔', length_cm: 32 };
  assert.equal(draftProblem(brag, { now: nov }), '');
  assert.equal(draftProblem({ ...brag, length_cm: 25 }, { now: nov }), '감성돔은 전장 25cm 이하는 잡으면 안 돼요(금지체장). 놓아주세요.'); // 25cm '이하' 금지
  assert.match(draftProblem({ ...brag, species: '농어', length_cm: 20 }, { now: nov }), /^농어는 /);
  assert.match(draftProblem({ ...brag, species: '쥐노래미', length_cm: 30 }, { now: nov }), /지금 금어기/);
  assert.match(draftProblem({ ...brag, photos: [] }, { now: nov }), /사진을 한 장 이상/);
  assert.equal(draftProblem({ ...brag, species: '벵에돔', length_cm: 10 }, { now: nov }), ''); // 금지체장 없는 어종
  assert.equal(draftProblem({ category: '팁', title: '채비', body: '' }), '내용을 입력해 주세요.');
  assert.equal(draftProblem({ category: '공지', title: '규칙', body: 'b' }), '분류를 골라 주세요.');
  assert.equal(draftProblem({ category: '공지', title: '규칙', body: 'b' }, { isAdmin: true }), '');
  const now = Date.parse('2026-11-20T12:00:00Z');
  assert.deepEqual(['2026-11-20T11:59:40Z', '2026-11-20T11:05:00Z', '2026-11-20T09:00:00Z', '2026-11-19T10:00:00Z', '2026-11-15T03:00:00Z'].map((t) => timeAgo(t, now)),
    ['방금', '55분 전', '3시간 전', '어제', '11/15']);
});
