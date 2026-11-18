// 낚시 페이지 맨 위: 오늘 바다 날씨 한 줄과 출조 판단(추천·보통·주의·비추천)
// 이미 받은 자료(해상예보·부이 관측·바다낚시지수·특보)로만 계산합니다. 판단은 참고용입니다.

const kstParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const parts = (time) => Object.fromEntries(kstParts.formatToParts(new Date(time)).map((p) => [p.type, p.value]));
const num = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

// 해상예보는 12시간 간격 → 지금 시각이 속한(가장 최근에 시작한) 예보 행
export function currentForecastRow(rows = [], now = Date.now()) {
  const p = parts(now);
  const stamp = `${p.year}${p.month}${p.day}${p.hour}`;
  const sorted = [...rows].filter((row) => row.TM_EF).sort((a, b) => a.TM_EF.localeCompare(b.TM_EF));
  return sorted.filter((row) => row.TM_EF.slice(0, 10) <= stamp).pop() || sorted[0] || null;
}

export function skyIcon(text = '') {
  if (/눈/.test(text)) return '🌨';
  if (/비|소나기/.test(text)) return '🌧';
  if (/흐림|흐리/.test(text)) return '☁';
  if (/구름/.test(text)) return '⛅';
  if (/맑/.test(text)) return '☀';
  return '🌊';
}

const NEAR_BUOY_KM = 60;

// 지금 바다 날씨: 하늘은 해상예보, 기온·바람·파고·수온은 가까운 부이 관측(없으면 예보 범위)
export function seaWeather({ forecastRows = [], buoyRows = [], indexDays = [], now = Date.now() } = {}) {
  const row = currentForecastRow(forecastRows, now);
  const buoy = buoyRows.find((item) => item.distance_km != null && item.distance_km <= NEAR_BUOY_KM) || null;
  const session = indexDays[0]?.sessions?.[0];
  const range = (a, b, unit) => (a == null && b == null ? null : `${a == null || b == null || a === b ? (a ?? b) : `${a}–${b}`}${unit}`);
  const sky = row?.WF || '';
  const result = {
    sky, icon: skyIcon(sky),
    airTemp: buoy && num(buoy.TA) != null ? `${num(buoy.TA)}°C` : session?.air_temp_c ? range(session.air_temp_c.min, session.air_temp_c.max, '°C') : null,
    wind: buoy && num(buoy.WS) != null ? `${num(buoy.WS)} m/s` : row ? range(num(row.WS1), num(row.WS2), ' m/s') : null,
    wave: buoy && num(buoy.WH) != null ? `${num(buoy.WH)} m` : row ? range(num(row.WH1), num(row.WH2), ' m') : null,
    waterTemp: buoy && num(buoy.TW) != null ? `${num(buoy.TW)}°C` : session?.water_temp_c ? range(session.water_temp_c.min, session.water_temp_c.max, '°C') : null,
    buoy: buoy ? { name: buoy.STN_KO, distance: buoy.distance_km, hour: String(buoy.TM || '').slice(8, 10) } : null,
  };
  return result.sky || result.airTemp || result.wind || result.wave ? result : null;
}

const GRADE_SCORE = { 매우좋음: 4, 좋음: 3, 보통: 2, 나쁨: 1, 매우나쁨: 0 };
const GRADE_LEVEL = { 매우좋음: 0, 좋음: 0, 보통: 1, 나쁨: 2, 매우나쁨: 3 };
export const VERDICTS = [
  { level: 0, tone: 'go', title: '오늘은 출조하기 좋은 날' },
  { level: 1, tone: 'okay', title: '오늘은 무난한 편' },
  { level: 2, tone: 'caution', title: '오늘은 출조 주의' },
  { level: 3, tone: 'stop', title: '오늘은 출조 비추천' },
];

// 오늘 남은 시간대(정오가 지나면 오전 제외) 중 가장 좋은 지수
export function todayBestGrade(indexDays = [], now = Date.now()) {
  const p = parts(now);
  const today = indexDays.find((day) => day.date === `${p.year}-${p.month}-${p.day}`);
  if (!today) return null;
  const grades = today.sessions
    .filter((session) => !(Number(p.hour) >= 12 && session.session === '오전'))
    .flatMap((session) => session.species.map((item) => item.index))
    .filter((grade) => grade in GRADE_SCORE);
  if (!grades.length) return null;
  return grades.reduce((best, grade) => (GRADE_SCORE[grade] > GRADE_SCORE[best] ? grade : best));
}

export function todayVerdict({ warnings = [], indexDays = [], forecastRows = [], buoyRows = [], now = Date.now() } = {}) {
  const reasons = [];
  const add = (level, text) => reasons.push({ level, text });
  const today = Number(parts(now).day);

  for (const item of warnings) {
    if (item.level === '경보' || item.level === '주의') add(3, `${item.title} 발효`);
    else if (item.level === '예비' && Number(String(item.effective).match(/^(\d{1,2})일/)?.[1]) === today) add(2, `${item.title} (${item.effective.replace(/^\d{1,2}일 /, '오늘 ')})`);
  }

  const grade = todayBestGrade(indexDays, now);
  if (grade) add(GRADE_LEVEL[grade], `오늘 낚시지수 ${grade}`);

  const row = currentForecastRow(forecastRows, now);
  const buoy = buoyRows.find((item) => item.distance_km != null && item.distance_km <= NEAR_BUOY_KM);
  const wave = Math.max(-Infinity, ...[num(row?.WH2), num(row?.WH1), num(buoy?.WH)].filter((v) => v != null));
  const wind = Math.max(-Infinity, ...[num(row?.WS2), num(row?.WS1), num(buoy?.WS)].filter((v) => v != null));
  if (wave >= 2.5) add(3, `파고 최대 ${wave} m`);
  else if (wave >= 1.5) add(2, `파고 최대 ${wave} m`);
  if (wind >= 14) add(3, `바람 최대 ${wind} m/s`);
  else if (wind >= 10) add(2, `바람 최대 ${wind} m/s`);

  if (!reasons.length) return null;
  const level = Math.max(...reasons.map((item) => item.level));
  const sorted = [...reasons].sort((a, b) => b.level - a.level);
  return { ...VERDICTS[level], reasons: sorted.slice(0, 3).map((item) => item.text) }; // 가장 심한 이유 3개까지
}
