import { useEffect, useRef } from 'react';
import { API } from './config';

const browserKey = 'weather-plus-usage-browser';
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicPageView(pathname, defaultMountain) {
  const path = pathname.replace(/\/+$/, '');
  if (!path) return { page: 'weather' };
  if (path === '/fishing') return { page: 'fishing' };
  if (path === '/fishing/community') return { page: 'community' };
  if (path === '/mountain') return { page: 'mountain', mountain: defaultMountain };
  const match = /^\/mountain\/([^/]+)$/.exec(path);
  if (match) {
    try {
      const mountain = decodeURIComponent(match[1]);
      if (/^[가-힣 ]{2,24}$/.test(mountain)) return { page: 'mountain', mountain };
    } catch {
      // Ignore malformed URLs.
    }
  }
  return null;
}

export function usePageViews(pathname, defaultMountain) {
  const previous = useRef(null);
  useEffect(() => {
    const event = publicPageView(pathname, defaultMountain);
    const key = event ? `${event.page}:${event.mountain || ''}` : null;
    if (previous.current === key) return;
    previous.current = key;
    if (!event || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
    try {
      let browserId = localStorage.getItem(browserKey);
      if (!uuidV4.test(browserId || '')) {
        browserId = crypto.randomUUID();
        localStorage.setItem(browserKey, browserId);
      }
      void fetch(`${API}/api/page-views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...event, browser_id: browserId, event_id: crypto.randomUUID() }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Analytics should never block navigation or require browser storage.
    }
  }, [pathname, defaultMountain]);
}
