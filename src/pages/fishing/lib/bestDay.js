// 낚시 페이지: 바다낚시지수 7일치에서 이번 주 가장 좋은 날(시간대)을 고릅니다.
const GRADE_SCORE = { 매우좋음: 4, 좋음: 3, 보통: 2, 나쁨: 1, 매우나쁨: 0 };
const SESSION_HOURS = { 오전: [0, 12], 오후: [12, 24], 일: [0, 24] };
const kstParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });

function kstNow(now) {
  const parts = Object.fromEntries(kstParts.formatToParts(new Date(now)).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

const score = (grade) => GRADE_SCORE[grade] ?? -1;

// 지난 시간대(오늘 오전이 끝났으면 오늘 오전 등)는 빼고, 가장 좋은 지수 → 좋음 이상 어종 수 → 파고 → 풍속 → 이른 날짜 순으로 고릅니다.
export function bestFishingDay(days = [], { now = Date.now(), minimumGrade = '보통' } = {}) {
  const today = kstNow(now);
  const candidates = [];
  for (const day of days) {
    if (day.date < today.date) continue;
    for (const session of day.sessions || []) {
      const end = (SESSION_HOURS[session.session] || [0, 24])[1];
      if (day.date === today.date && today.hour >= end) continue;
      const species = session.species || [];
      const top = Math.max(-1, ...species.map((item) => score(item.index)));
      if (top < 0) continue;
      candidates.push({
        date: day.date, session, top,
        topGrade: Object.keys(GRADE_SCORE).find((grade) => GRADE_SCORE[grade] === top),
        topSpecies: species.filter((item) => score(item.index) === top).map((item) => item.name),
        goodCount: species.filter((item) => score(item.index) >= GRADE_SCORE['좋음']).length,
        wave: session.wave_m?.max ?? Infinity,
        wind: session.wind_ms?.max ?? Infinity,
      });
    }
  }
  candidates.sort((a, b) => b.top - a.top || b.goodCount - a.goodCount || a.wave - b.wave || a.wind - b.wind || a.date.localeCompare(b.date));
  const best = candidates[0];
  if (!best || best.top < GRADE_SCORE[minimumGrade]) return { best: null, checked: candidates.length };
  return { best, checked: candidates.length };
}

// 발효 중인 주의보·경보가 있으면 해제 예고일(예: "21일 오전")까지는 추천에서 뺍니다. 해제 예고가 없으면 오늘만 뺍니다.
export function warningBlockedDates(days = [], warnings = [], { now = Date.now() } = {}) {
  const active = warnings.filter((item) => item.level === '주의' || item.level === '경보');
  if (!active.length) return new Set();
  const today = kstNow(now).date;
  let lastDay = today;
  for (const item of active) {
    const day = Number(String(item.release_hint || '').match(/(\d{1,2})일/)?.[1]);
    if (!day) continue;
    // "21일"은 이번 달 21일, 오늘보다 앞선 날짜면 다음 달 (자료 범위 밖이어도 그날까지 뺍니다)
    const [year, month, todayDay] = today.split('-').map(Number);
    const releaseMonth = day >= todayDay ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, month, 1));
    const release = `${releaseMonth.getUTCFullYear()}-${String(releaseMonth.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (release > lastDay) lastDay = release;
  }
  return new Set(days.map((d) => d.date).filter((date) => date >= today && date <= lastDay));
}

// 특보 기간을 피해서 고르고, 그 밖에 좋은 날이 없을 때만 특보 기간 안에서 고릅니다.
export function recommendFishingDay(days = [], warnings = [], { now = Date.now() } = {}) {
  const blocked = warningBlockedDates(days, warnings, { now });
  const open = bestFishingDay(days.filter((day) => !blocked.has(day.date)), { now });
  if (open.best) return { ...open, blockedDates: blocked, insideWarning: false };
  const fallback = bestFishingDay(days, { now });
  return { ...fallback, blockedDates: blocked, insideWarning: Boolean(fallback.best && blocked.has(fallback.best.date)) };
}
