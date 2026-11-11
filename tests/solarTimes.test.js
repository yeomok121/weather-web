import test from 'node:test';
import assert from 'node:assert/strict';
import { solarTimes } from '../src/pages/mountain/lib/solarTimes.js';

test('solar calculations use the selected Korean date and reject missing coordinates', () => {
  const first = solarTimes('2026-11-10T08:00:00+09:00', 37.662, 126.993);
  const second = solarTimes('2026-06-10T08:00:00+09:00', 37.662, 126.993);
  assert.ok(first.sunriseAt < first.sunsetAt);
  assert.notEqual(first.sunset, second.sunset);
  assert.equal(solarTimes('2026-11-10T08:00:00+09:00', null, 126.993), null);
  assert.equal(solarTimes('bad', 37, 127), null);
});
