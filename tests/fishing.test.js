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
