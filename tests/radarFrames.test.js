import test from 'node:test';
import assert from 'node:assert/strict';
import { createRadarFrames } from '../src/pages/weather/radarFrames.js';

test('playback shares an in-flight prefetch and reuses the completed image', async () => {
  let calls = 0;
  let finish;
  const response = new Promise(resolve => { finish = resolve; });
  const cache = createRadarFrames('', () => { calls += 1; return response; });
  const frame = { path: '/frame.png' };
  const first = cache.load(frame);
  const second = cache.load(frame);
  assert.equal(first, second);
  finish(new Response(new Blob(['png'], { type: 'image/png' })));
  assert.equal(await first, await cache.load(frame));
  assert.equal(calls, 1);
  cache.clear();
});

test('failed background download can be retried and disposal aborts pending work', async () => {
  let calls = 0;
  const cache = createRadarFrames('', async () => {
    calls += 1;
    return calls === 1 ? new Response('{}', { status: 503 })
      : new Response(new Blob(['png'], { type: 'image/png' }));
  });
  const frame = { path: '/frame.png' };
  await assert.rejects(cache.load(frame));
  await cache.load(frame);
  assert.equal(calls, 2);
  cache.clear();

  const pending = createRadarFrames('', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const request = pending.load(frame);
  pending.clear();
  await assert.rejects(request, { name: 'AbortError' });
});
