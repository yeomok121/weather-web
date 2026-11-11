// 낚시 페이지: 음력 날짜와 물때 계산 (달의 위상으로 계산한 참고값)
// 음력 날짜 = 한국 시간 기준으로 직전 합삭(신월)이 있는 날을 1일로 셉니다.
// 물때 이름은 지역 관습에 따라 하루 정도 다르게 부를 수 있습니다.
import { getMoonIllumination } from 'suncalc';

const DAY = 86400000;
const SYNODIC_MONTH_DAYS = 29.530588;

// 신월을 0으로 하는 -0.5 ~ 0.5 범위의 위상 (신월 근처에서 연속)
const centeredPhase = (time) => ((getMoonIllumination(new Date(time)).phase + 0.5) % 1) - 0.5;

export function previousNewMoon(date) {
  const time = new Date(date).getTime();
  const phase = getMoonIllumination(new Date(time)).phase;
  const estimate = time - phase * SYNODIC_MONTH_DAYS * DAY;
  let lo = estimate - 2 * DAY;
  let hi = estimate + 2 * DAY;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (centeredPhase(mid) < 0) lo = mid; else hi = mid;
  }
  const newMoon = (lo + hi) / 2;
  // 추정이 기준 시각보다 뒤라면 한 달 전 신월을 다시 찾습니다.
  return newMoon > time ? previousNewMoon(newMoon - 3 * DAY) : newMoon;
}

const kstDayNumber = (time) => Math.floor((time + 9 * 3600000) / DAY);

// 음력 일(1~30). 합삭이 있는 날은 합삭 시각과 관계없이 그날 전체가 1일이므로 그날 자정 직전 기준으로 찾습니다.
export function lunarDay(date = new Date()) {
  const day = kstDayNumber(new Date(date).getTime());
  const endOfDay = (day + 1) * DAY - 9 * 3600000 - 1;
  return day - kstDayNumber(previousNewMoon(endOfDay)) + 1;
}

const LABELS = ['1물', '2물', '3물', '4물', '5물', '6물', '7물', '8물', '9물', '10물', '11물', '12물', '13물', '조금', '무시'];

// system 8: 8물때식(남해·동해), 음력 8·23일 조금 / system 7: 7물때식(서해), 하루 이르게 음력 7·22일 조금
export function tideDayLabel(day, system = 8) {
  const shifted = day + (system === 7 ? 1 : 0);
  return LABELS[(((shifted - 10) % 15) + 15) % 15];
}

export function tideDayHint(label) {
  if (label === '조금' || label === '무시') return '물 흐름이 가장 약한 때';
  if (['6물', '7물', '8물', '9물'].includes(label)) return '사리 무렵 · 물 흐름이 센 때';
  return '';
}

export function tideCalendar(date = new Date(), system = 8) {
  const day = lunarDay(date);
  const label = tideDayLabel(day, system);
  return { lunarDay: day, label, hint: tideDayHint(label), system };
}
