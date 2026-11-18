// Share each download between playback and background warming.
export function createRadarFrames(api, fetchImage = fetch) {
  const entries = new Map();

  function load(frame) {
    if (entries.has(frame.path)) return entries.get(frame.path).promise;
    const controller = new AbortController();
    const entry = { controller, url: null, promise: null };
    entry.promise = (async () => {
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetchImage(`${api}${frame.path}`, { signal: controller.signal });
        if (!response.ok) {
          const failure = await response.json().catch(() => null);
          throw new Error(failure?.error_code === 'expired_time'
            ? '관측 목록이 오래되었습니다. 새로고침해 주세요.'
            : failure?.detail || '레이더 영상을 받지 못했습니다. 다시 시도해 주세요.');
        }
        if (!response.headers.get('content-type')?.includes('image/png')) {
          throw new Error('레이더 영상 형식을 확인하지 못했습니다.');
        }
        const blob = await response.blob();
        controller.signal.throwIfAborted();
        entry.url = URL.createObjectURL(blob);
        return entry.url;
      } catch (error) {
        if (entries.get(frame.path) === entry) entries.delete(frame.path);
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    })();
    entries.set(frame.path, entry);
    return entry.promise;
  }

  function discard(frame) {
    const entry = entries.get(frame.path);
    if (!entry) return;
    entry.controller.abort();
    if (entry.url) URL.revokeObjectURL(entry.url);
    entries.delete(frame.path);
  }

  return {
    load,
    discard,
    clear() {
      for (const path of entries.keys()) discard({ path });
    },
  };
}
