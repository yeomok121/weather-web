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
