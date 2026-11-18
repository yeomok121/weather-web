// 내 위치에서 가장 가까운 낚시 포인트 (직선거리, km)
const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// points: [{ id, lat, lon }] / here: { lat, lon } → { point, distanceKm } 또는 null
export function nearestPoint(points = [], here) {
  if (!here || !Number.isFinite(here.lat) || !Number.isFinite(here.lon)) return null;
  let best = null;
  for (const point of points) {
    const lat = Number(point.lat);
    const lon = Number(point.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const km = distanceKm(here, { lat, lon });
    if (!best || km < best.distanceKm) best = { point, distanceKm: km };
  }
  return best;
}
