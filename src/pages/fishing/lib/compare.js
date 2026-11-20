// 낚시 페이지: 즐겨찾는 포인트 한눈에 비교 (포인트별 바다낚시지수에서 오늘·내일 요약)
const GRADE_SCORE = { 매우좋음: 4, 좋음: 3, 보통: 2, 나쁨: 1, 매우나쁨: 0 };
const kst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
const parts = (time) => Object.fromEntries(kst.formatToParts(new Date(time)).map((p) => [p.type, p.value]));
const dateOf = (time) => { const p = parts(time); return `${p.year}-${p.month}-${p.day}`; };
const maxOf = (values) => { const list = values.filter((v) => Number.isFinite(v)); return list.length ? Math.max(...list) : null; };

// 하루 요약: 가장 좋은 등급, 파고·바람 최대, 물때. skipMorning=true면 끝난 오전 시간대는 뺍니다.
export function daySummary(day, { skipMorning = false } = {}) {
  if (!day) return null;
  const sessions = (day.sessions || []).filter((s) => !(skipMorning && s.session === '오전'));
  if (!sessions.length) return null;
  const grades = sessions.flatMap((s) => (s.species || []).map((item) => item.index)).filter((g) => g in GRADE_SCORE);
  const grade = grades.length ? grades.reduce((best, g) => (GRADE_SCORE[g] > GRADE_SCORE[best] ? g : best)) : '';
  return {
    grade,
    score: grade ? GRADE_SCORE[grade] : -1,
    waveMax: maxOf(sessions.map((s) => Number(s.wave_m?.max))),
    windMax: maxOf(sessions.map((s) => Number(s.wind_ms?.max))),
    tide: sessions.find((s) => s.tide_phase)?.tide_phase || '',
  };
}

// names 순서대로 행을 만들고, 오늘(없으면 내일) 지수가 가장 높은 포인트에 best 표시
export function compareRows(names = [], indexByName = {}, now = Date.now()) {
  const today = dateOf(now);
  const tomorrow = dateOf(now + 24 * 60 * 60 * 1000);
  const afternoon = Number(parts(now).hour) >= 12;
  const rows = names.map((name) => {
    const entry = indexByName[name];
    if (!entry || entry.status !== 'ready') return { name, status: entry?.status || 'loading' };
    const days = entry.index?.days || [];
    return {
      name, status: 'ready',
      today: daySummary(days.find((d) => d.date === today), { skipMorning: afternoon }),
      tomorrow: daySummary(days.find((d) => d.date === tomorrow)),
    };
  });
  const ready = rows.filter((row) => row.status === 'ready');
  const pick = (key) => {
    const scored = ready.filter((row) => row[key]?.score >= 2); // '보통' 이상만 추천
    if (!scored.length) return null;
    return scored.reduce((best, row) => (row[key].score > best[key].score
      || (row[key].score === best[key].score && (row[key].waveMax ?? 99) < (best[key].waveMax ?? 99)) ? row : best)).name;
  };
  const bestToday = pick('today');
  const bestTomorrow = pick('tomorrow');
  return { rows: rows.map((row) => ({ ...row, bestToday: row.name === bestToday, bestTomorrow: row.name === bestTomorrow })), bestToday, bestTomorrow };
}
