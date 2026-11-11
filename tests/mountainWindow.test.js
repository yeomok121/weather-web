import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMountainWindow } from '../src/lib/mountainWindow.js';
const makeRows = () => Array.from({ length: 7 }, (_, i) => ({ valid_at: new Date(Date.parse('2026-11-12T09:00:00+09:00') + i * 3600000).toISOString(), temp: 4-i, wind_speed: i+1, humidity: 70+i, pop: i === 2 ? 0.6 : 0, description: '맑음' }));

test('uses selected forecast interval and exposes worst conditions', () => {
  const result = summarizeMountainWindow({hourlyData: makeRows(), start: '2026-11-12T09:00:00+09:00', durationHours: 3, pm25: 20});
  assert.equal(result.status, 'complete');
  assert.equal(result.minTemp, 1);
  assert.equal(result.maxWind, 4);
  assert.equal(result.maxPop, 60);
  assert.equal(typeof result.assessment.weatherAssessment.score, 'number');
});

test('refuses a score for gaps, absent dust, and ranges beyond available forecast', () => {
  const rows = makeRows();
  assert.equal(summarizeMountainWindow({hourlyData: rows.filter((_, i) => i !== 1), start: rows[0].valid_at, durationHours: 3, pm25: 20}).status, 'partial');
  assert.equal(summarizeMountainWindow({hourlyData: rows, start: rows[0].valid_at, durationHours: 3, pm25: null}).status, 'partial');
  assert.equal(summarizeMountainWindow({hourlyData: rows, start: rows[5].valid_at, durationHours: 3, pm25: 20}).status, 'partial');
  assert.equal(summarizeMountainWindow({hourlyData: rows, start: 'not a date', durationHours: 3, pm25: 20}).status, 'invalid');
});
