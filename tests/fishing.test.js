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
