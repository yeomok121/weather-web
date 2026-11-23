import test from 'node:test';
import assert from 'node:assert/strict';
import { describeEcho, radarPixel } from '../src/pages/weather/radarObservation.js';

test('radar samples north-up Mercator pixels and rejects points outside the image', () => {
  const bounds = [[30, 118], [44, 134]];
  assert.deepEqual(radarPixel(bounds, 2048, 2048, 44, 118), [0, 0]);
  assert.equal(radarPixel(bounds, 2048, 2048, 37, 126)[0], 1024);
  assert.ok(radarPixel(bounds, 2048, 2048, 37, 126)[1] > 1024);
  assert.equal(radarPixel(bounds, 2048, 2048, 37, 134), null);
});

test('missing pixels, transparent cells and weak echoes have distinct summaries', () => {
  const encoding = { clear: 0, missing: [48, 96], echo: [80, 115] };
  const legend = [{ value: 0 }, { value: 10 }];
  for (const alpha of encoding.missing) assert.match(describeEcho(alpha, encoding, legend), /자료가 없/);
  assert.match(describeEcho(0, encoding, legend), /신호가 없/);
  assert.match(describeEcho(80, encoding, legend), /0~10 미만/);
  assert.match(describeEcho(115, encoding, legend), /10 이상/);
  assert.equal(describeEcho(255, encoding, legend), '');
});
