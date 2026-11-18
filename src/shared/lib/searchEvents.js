import { API } from './config';

export function recordSearch(service, term, outcome) {
  term = term.trim().replace(/\s+/g, ' ');
  const allowedTerm = service === 'fishing' ? /^[가-힣 ]{2,24}(?:\([0-9]{1,3}km\))?$/ : /^[가-힣 ]{2,24}$/;
  if (!allowedTerm.test(term)) return;
  if ((outcome === 'not_found' || outcome === 'error') && !(service === 'mountain' ? /(산|봉|악|오름)$/ : /(시|군|구|읍|면|동|리|도)$/).test(term)) return;
  void fetch(`${API}/api/search-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, term, outcome }),
    keepalive: true,
  }).catch(() => {});
}
