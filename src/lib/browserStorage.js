export function readStoredJson(key, fallback, storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    if (value === null || (Array.isArray(fallback) && !Array.isArray(value))) return fallback;
    return value;
  } catch { return fallback; }
}

export function writeStoredJson(key, value, storage = localStorage) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* Server features remain usable when browser storage is unavailable. */ }
}
