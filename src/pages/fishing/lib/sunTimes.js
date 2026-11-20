// 낚시 페이지: 일출·일몰과 박명(해 뜨기 전·진 뒤 밝은 시간) 계산 (suncalc, 위치 기준 계산값)
import { getTimes } from 'suncalc';

const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const kstDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
const time = (value) => (value instanceof Date && Number.isFinite(value.getTime()) ? fmt.format(value) : '—');

export function sunTimesFor(date, lat, lon) {
  if (lat == null || lon == null || lat === '' || lon === '' || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
  const noon = new Date(`${kstDate.format(new Date(date))}T12:00:00+09:00`);
  const t = getTimes(noon, Number(lat), Number(lon));
  return {
    dawn: time(t.dawn), sunrise: time(t.sunrise), sunset: time(t.sunset), dusk: time(t.dusk),
    sunriseAt: t.sunrise?.getTime(), sunsetAt: t.sunset?.getTime(), dawnAt: t.dawn?.getTime(), duskAt: t.dusk?.getTime(),
  };
}

// 오늘 해질녘과 다음 새벽 (오늘 일출 전이면 오늘 새벽)
export function fishingLightWindows(now, lat, lon) {
  const today = sunTimesFor(now, lat, lon);
  if (!today) return null;
  const beforeSunrise = Number.isFinite(today.sunriseAt) && now < today.sunriseAt;
  const nextMorning = beforeSunrise ? today : sunTimesFor(now + 86400000, lat, lon);
  return { today, nextMorning, morningIsToday: beforeSunrise };
}
