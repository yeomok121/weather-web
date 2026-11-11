import { getTimes } from 'suncalc';
import { koreanDate } from './hikingPlan.js';

// 태양 고도 기반 계산값이며 지형에 가려지는 실제 일출·일몰과 다를 수 있습니다.
export function solarTimes(departureAt, lat, lon) {
  const departure = new Date(departureAt);
  if (!Number.isFinite(departure.getTime()) || lat == null || lon == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
  const date = koreanDate(departure);
  const times = getTimes(new Date(`${date}T12:00:00+09:00`), Number(lat), Number(lon));
  if (!Number.isFinite(times.sunrise.getTime()) || !Number.isFinite(times.sunset.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul', hour:'2-digit', minute:'2-digit', hourCycle:'h23'});
  return { sunrise: fmt.format(times.sunrise), sunset: fmt.format(times.sunset), sunriseAt: times.sunrise.getTime(), sunsetAt: times.sunset.getTime() };
}

