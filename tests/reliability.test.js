import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, requestForecastJson } from '../src/lib/apiClient.js';
import { forecastKey, isUsableForecast, readForecastCache, writeForecastCache } from '../src/lib/forecastCache.js';
import { planDepartureAt, readHikingDraft, writeHikingDraft } from '../src/lib/hikingPlan.js';
import { assessHikingForecastWindow } from '../src/components/mountainAssessment.js';
import { readStoredJson } from '../src/lib/browserStorage.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const forecast = { current: { temp: 0, humidity: 0, wind_speed: 0 }, hourly: [] };

test('real zero is usable, missing temperature is not cached as zero', () => {
  assert.equal(isUsableForecast(forecast), true);
  assert.equal(isUsableForecast({ current: { temp: null } }), false);
  const store = storage();
  writeForecastCache('weather:zero', forecast, { storage: store, now: 1000 });
  writeForecastCache('weather:missing', { current: { temp: null } }, { storage: store, now: 1000 });
  assert.equal(readForecastCache('weather:missing', { storage: store, now: 1500 }), null);
  assert.equal(readForecastCache('weather:zero', { storage: store, now: 1500 }).data.current.temp, 0);
});

test('cached weather is location specific and expires', () => {
  const store = storage();
  const key = forecastKey({ kind: 'mountain', mountainName: '북한산' });
  writeForecastCache(key, forecast, { storage: store, now: 1000 });
  assert.equal(readForecastCache('mountain:설악산', { storage: store, now: 1500 }), null);
  assert.equal(readForecastCache(key, { storage: store, now: 3601001 }), null);
});

test('GET retries once on a transient failure and emits recovery state', async () => {
  let count = 0;
  const attempts = [];
  globalThis.fetch = async () => ++count === 1 ? new Response('{}', { status: 503 }) : Response.json(forecast);
  const value = await requestForecastJson('/api/weather/summary', { retryDelayMs: 1, onState: state => attempts.push(state.attempt) });
  assert.equal(value.current.temp, 0);
  assert.equal(count, 2);
  assert.deepEqual(attempts, [1, 2]);
});

test('writes are never automatically replayed and authorization errors do not retry', async () => {
  let count = 0;
  globalThis.fetch = async () => { count += 1; return Response.json({ detail: 'unavailable' }, { status: 503 }); };
  await assert.rejects(requestJson('/api/hiking/parties', { method: 'POST', body: '{}' }), error => error.status === 503);
  assert.equal(count, 1);
  count = 0;
  globalThis.fetch = async () => { count += 1; return Response.json({ detail: 'expired' }, { status: 401 }); };
  await assert.rejects(requestForecastJson('/api/weather/summary', { retryDelayMs: 1 }), error => error.status === 401);
  assert.equal(count, 1);
});

test('cancelled outdated requests do not retry', async () => {
  const controller = new AbortController();
  let count = 0;
  globalThis.fetch = async (_, { signal }) => {
    count += 1;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  };
  const pending = requestForecastJson('/api/weather/summary', { signal: controller.signal, retryDelayMs: 1 });
  controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError');
  assert.equal(count, 1);
});

test('custom checklist and checks survive reload without crossing account keys', () => {
  const store = storage();
  writeHikingDraft('hiking:draft:a', { gearList: ['간식', '보조배터리'], checklist: { 간식: true } }, store);
  assert.deepEqual(readHikingDraft('hiking:draft:a', store).checklist, { 간식: true });
  assert.equal(readHikingDraft('hiking:draft:b', store), null);
});

test('saved absolute departure does not drift on a later visit', () => {
  const saved = planDepartureAt({ referenceAt: Date.parse('2026-11-09T07:00:00+09:00'), offsetHours: 2 });
  assert.equal(planDepartureAt({ referenceAt: Date.parse('2026-11-09T08:00:00+09:00'), restoredAt: saved }), '2026-11-09T00:00:00.000Z');
});

test('malformed saved preferences do not prevent the app from starting', () => {
  const store = storage();
  store.setItem('recentSearches', '{broken');
  assert.deepEqual(readStoredJson('recentSearches', [], store), []);
  store.setItem('recentSearches', '{}');
  assert.deepEqual(readStoredJson('recentSearches', [], store), []);
});

test('missing wind or humidity does not produce a reassuring numerical hiking score', () => {
  const result = assessHikingForecastWindow({ now: new Date('2026-11-09T07:00:00+09:00'), fallbackWeather: { temp: 5, wind: null, humidity: null } });
  assert.equal(result.weatherAssessment.score, null);
  assert.equal(result.viewEstimate.score, null);
  assert.equal(result.weatherAssessment.status, '기상 자료 부족');
});

test('itinerary scores follow dated forecast hours across midnight and course changes', () => {
  const now = new Date('2026-11-09T23:00:00+09:00');
  const rows = Array.from({ length: 8 }, (_, index) => ({ time: `${(23 + index) % 24}시`, valid_at: new Date(now.getTime() + index * 3600000).toISOString(),
    temp: 10, pop: index < 3 ? 0 : .9, description: index < 3 ? '맑음' : '비', humidity: index < 3 ? 50 : 98, wind_speed: index < 3 ? 2 : 12 }));
  const input = { hourlyData: rows, now, fallbackWeather: { temp: 10, humidity: 50, wind: 2, condition: '맑음' } };
  const early = assessHikingForecastWindow({ ...input, departureOffsetHours: 0, durationMinutes: 60 });
  const delayed = assessHikingForecastWindow({ ...input, departureOffsetHours: 3, durationMinutes: 60 });
  const longer = assessHikingForecastWindow({ ...input, departureOffsetHours: 0, durationMinutes: 240 });
  assert.ok(early.weatherAssessment.score > delayed.weatherAssessment.score);
  assert.ok(early.viewEstimate.score > delayed.viewEstimate.score);
  assert.equal(longer.weatherAssessment.score, delayed.weatherAssessment.score);
  assert.equal(delayed.weatherWorstTime, '2시');
});
