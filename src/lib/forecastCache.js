const CACHE_KEY = 'weather:forecast-cache:v1';
const MAX_RECORDS = 5;
export const isWeatherNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

export function isUsableForecast(data) {
  return !!data?.current && isWeatherNumber(data.current.temp);
}

export function forecastKey(request) {
  return request.kind === 'mountain'
    ? `mountain:${request.mountainName}`
    : `weather:${Number(request.lat).toFixed(4)},${Number(request.lon).toFixed(4)}`;
}

function records(storage) {
  try { return JSON.parse(storage.getItem(CACHE_KEY) || '{}') || {}; } catch { return {}; }
}

export function readForecastCache(key, { storage = localStorage, now = Date.now(), maxAgeMs = 60 * 60 * 1000 } = {}) {
  try {
    const saved = records(storage)[key];
    if (!saved || !isUsableForecast(saved.data) || !Number.isFinite(saved.savedAt) || now < saved.savedAt || now - saved.savedAt > maxAgeMs) return null;
    return saved;
  } catch { return null; }
}

export function writeForecastCache(key, data, { storage = localStorage, now = Date.now() } = {}) {
  if (!isUsableForecast(data)) return;
  try {
    const next = { ...records(storage), [key]: { savedAt: now, data } };
    storage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(
      Object.entries(next).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, MAX_RECORDS),
    )));
  } catch { /* Full or blocked storage must not block weather lookup. */ }
}
