import { API } from '../config.js';

export class ApiError extends Error {
  constructor(message, { status = 0, requestId = '', timeout = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
    this.timeout = timeout;
  }
}

export async function requestJson(path, { timeoutMs = 15000, signal, ...options } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
      ...options, signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(typeof data?.detail === 'string' ? data.detail : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', {
        status: response.status, requestId: response.headers.get('x-request-id') || '',
      });
    }
    if (data === null) throw new ApiError('서버 응답을 읽지 못했습니다.', { status: 502 });
    return data;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('요청이 취소되었습니다.', 'AbortError');
    if (timedOut) throw new ApiError('서버 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.', { timeout: true });
    if (error instanceof ApiError) throw error;
    throw new ApiError('서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('취소됨', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}

// GET only: one bounded retry after a transient failure. Writes are never replayed.
export async function requestForecastJson(path, { signal, onState, firstTimeoutMs = 90000, retryTimeoutMs = 20000, retryDelayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    onState?.({ phase: attempt === 1 ? 'connecting' : 'retrying', attempt });
    const slowTimer = setTimeout(() => onState?.({ phase: 'slow', attempt }), 8000);
    try {
      return await requestJson(path, { signal, timeoutMs: attempt === 1 ? firstTimeoutMs : retryTimeoutMs });
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') throw error;
      if (attempt === 2 || (error.status > 0 && error.status < 500)) throw error;
    } finally {
      clearTimeout(slowTimer);
    }
    await delay(retryDelayMs, signal);
  }
}
