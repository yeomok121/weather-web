// 낚시 페이지: 서버가 느리거나 막힐 때 대비
//  - 일시적인 실패(네트워크 차단·429·502·503·504)는 잠깐 쉬었다가 다시 요청합니다. (GET만)
//    Render 앞단이 429를 보내면 CORS 헤더가 없어 브라우저에는 '네트워크 오류'(status 0)로 보입니다.
//  - 마지막으로 받은 바다 정보·포인트 목록을 이 브라우저에 저장해 두고, 다음에 열 때 먼저 보여줍니다.

export const RETRY_DELAYS_MS = [2000, 5000];
const RETRY_STATUS = new Set([0, 429, 502, 503, 504]);

export function shouldRetry(error) {
  if (!error || error.name === 'AbortError' || error.timeout) return false; // 시간 초과는 이미 오래 기다렸으므로 다시 묻지 않음
  return RETRY_STATUS.has(Number(error.status ?? 0));
}

export async function withRetry(run, { signal, delays = RETRY_DELAYS_MS, wait = sleep } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await run(attempt);
    } catch (error) {
      if (signal?.aborted || attempt >= delays.length || !shouldRetry(error)) throw error;
      await wait(delays[attempt], signal);
    }
  }
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('취소됨', 'AbortError')); }, { once: true });
  });
}

// ── 마지막 자료 저장 (브라우저 저장소) ──
export const SUMMARY_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12시간이 지난 바다 정보는 보여주지 않음 (오늘 판단이 틀릴 수 있어서)
const SUMMARY_KEY = 'fishing:summary-cache:v1';
const SUMMARY_LIMIT = 8;
export const POINTS_KEY = 'fishing:points-cache:v1';
export const POINTS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const read = (storage, key) => {
  try { return JSON.parse(storage?.getItem(key) || 'null'); } catch { return null; }
};
const write = (storage, key, value) => {
  try { storage?.setItem(key, JSON.stringify(value)); } catch { /* 저장 공간이 없거나 막혀도 화면은 그대로 동작 */ }
};
const defaultStorage = () => (typeof localStorage === 'undefined' ? null : localStorage);

export function readCachedSummary(areaId, { now = Date.now(), storage = defaultStorage() } = {}) {
  const entry = read(storage, SUMMARY_KEY)?.[areaId];
  if (!entry || typeof entry.savedAt !== 'number' || !entry.data || now - entry.savedAt > SUMMARY_MAX_AGE_MS) return null;
  return entry;
}

export function saveCachedSummary(areaId, data, { now = Date.now(), storage = defaultStorage() } = {}) {
  const all = read(storage, SUMMARY_KEY);
  const entries = all && typeof all === 'object' ? all : {};
  entries[areaId] = { savedAt: now, data };
  // 오래된 것부터 지워 최근 포인트 몇 곳만 남김
  const kept = Object.entries(entries).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, SUMMARY_LIMIT);
  write(storage, SUMMARY_KEY, Object.fromEntries(kept));
}

export function readCachedPoints({ now = Date.now(), storage = defaultStorage() } = {}) {
  const entry = read(storage, POINTS_KEY);
  if (!entry || !Array.isArray(entry.points) || !entry.points.length || now - entry.savedAt > POINTS_MAX_AGE_MS) return null;
  return entry.points;
}

export function saveCachedPoints(points, { now = Date.now(), storage = defaultStorage() } = {}) {
  write(storage, POINTS_KEY, { savedAt: now, points });
}
