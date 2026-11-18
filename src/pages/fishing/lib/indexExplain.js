// 낚시 페이지: 바다낚시지수가 왜 좋고 나쁜지 해양 조건으로 풀어 설명합니다.
// 기관(국립해양조사원)은 등급만 주므로, 아래 기준은 Weather+가 일반적인 갯바위 낚시 기준으로 덧붙인 참고 해석입니다.

const fmt = (value, digits = 1) => (Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : null);
const high = (range) => (range && Number.isFinite(Number(range.max)) ? Number(range.max) : null);
const low = (range) => (range && Number.isFinite(Number(range.min)) ? Number(range.min) : null);
const span = (range, unit, digits = 1) => {
  const a = fmt(range?.min, digits); const b = fmt(range?.max, digits);
  if (a === null && b === null) return '—';
  return `${a === b || a === null || b === null ? (a ?? b) : `${a}–${b}`}${unit}`;
};

export function judgeWave(max) {
  if (max === null) return null;
  if (max <= 0.5) return { tone: 'good', label: '잔잔함' };
  if (max <= 1.0) return { tone: 'normal', label: '보통' };
  if (max <= 1.5) return { tone: 'caution', label: '다소 높음' };
  if (max <= 2.5) return { tone: 'bad', label: '높음' };
  return { tone: 'bad', label: '매우 높음' };
}

export function judgeWind(max) {
  if (max === null) return null;
  if (max <= 4) return { tone: 'good', label: '약함' };
  if (max <= 7) return { tone: 'normal', label: '보통' };
  if (max <= 10) return { tone: 'caution', label: '강함' };
  return { tone: 'bad', label: '매우 강함' };
}

const TIDE_NOTES = {
  소조기: { label: '물살 약함', note: '조류가 약해 채비가 안정적이지만 입질이 적을 수 있습니다' },
  중조기: { label: '물살 보통', note: '조류가 적당해 대부분의 어종에 무난합니다' },
  대조기: { label: '물살 셈', note: '조류가 세서 채비가 흘러가기 쉽고 갯바위 파도도 높아질 수 있습니다' },
};

// 시간대 하나의 조건별 판단 목록
export function explainFactors(session) {
  const wave = judgeWave(high(session.wave_m));
  const wind = judgeWind(high(session.wind_ms));
  const airLow = low(session.air_temp_c);
  const tide = TIDE_NOTES[session.tide_phase];
  return [
    { id: 'wave', name: '파고', value: span(session.wave_m, ' m'), ...(wave || { tone: 'normal', label: '자료 없음' }), note: '파도가 높을수록 갯바위가 위험하고 채비 운용이 어렵습니다' },
    { id: 'wind', name: '풍속', value: span(session.wind_ms, ' m/s'), ...(wind || { tone: 'normal', label: '자료 없음' }), note: '바람이 강하면 캐스팅·입질 파악이 어렵고 체감온도가 떨어집니다' },
    { id: 'water', name: '수온', value: span(session.water_temp_c, '°C'), tone: 'normal', label: '어종별 기준', note: '어종마다 좋아하는 수온이 달라 어종별 지수가 갈립니다' },
    { id: 'air', name: '기온', value: span(session.air_temp_c, '°C'), tone: airLow !== null && airLow <= 5 ? 'caution' : 'normal', label: airLow !== null && airLow <= 5 ? '추움' : '참고', note: '추우면 방한 준비가 필요합니다' },
    { id: 'current', name: '유속', value: span(session.current_speed, '', 2), tone: 'normal', label: '물살 세기', note: '값이 클수록 물살이 빠릅니다' },
    ...(tide ? [{ id: 'tide', name: '물때', value: session.tide_phase, tone: 'normal', label: tide.label, note: tide.note }] : []),
  ];
}

const GRADE_SCORE = { 매우좋음: 4, 좋음: 3, 보통: 2, 나쁨: 1, 매우나쁨: 0 };

// 한 줄 이유: 가장 좋은 어종 지수와 거친 조건(파도·바람·추위)을 엮어 설명
export function explainReason(session) {
  const best = Math.max(-1, ...(session.species || []).map((item) => GRADE_SCORE[item.index] ?? -1));
  if (best < 0) return '지수 자료가 없습니다.';
  const rough = explainFactors(session).filter((item) => ['wave', 'wind', 'air'].includes(item.id) && (item.tone === 'bad' || item.tone === 'caution'));
  // 앞쪽 조건은 '~고', 마지막 조건은 '~아서/~해서'로 이어 붙입니다.
  const clause = (item, last) => ({
    wave: `파도가 ${item.label === '다소 높음' ? '다소 ' : ''}${last ? '높아서' : '높고'}(최대 ${fmt(high(session.wave_m))} m)`,
    wind: `바람이 ${item.label === '강함' ? '' : '매우 '}${last ? '강해서' : '강하고'}(최대 ${fmt(high(session.wind_ms))} m/s)`,
    air: `기온이 ${last ? '낮아서' : '낮고'}(최저 ${fmt(low(session.air_temp_c))}°C)`,
  })[item.id];
  const because = rough.map((item, index) => clause(item, index === rough.length - 1));
  const facts = rough.map((item) => ({
    wave: `파도 최대 ${fmt(high(session.wave_m))} m`, wind: `바람 최대 ${fmt(high(session.wind_ms))} m/s`, air: `최저 기온 ${fmt(low(session.air_temp_c))}°C`,
  })[item.id]);
  if (best >= GRADE_SCORE['좋음']) {
    if (rough.length) return `${facts.join(', ')}로 다소 거칠지만 어종에 따라서는 좋은 조건입니다.`;
    const calm = explainFactors(session).filter((item) => item.id === 'wave' || item.id === 'wind').every((item) => item.tone === 'good');
    return calm ? '파도와 바람이 잔잔해 낚시하기 좋은 조건입니다.' : '파도와 바람이 무난해 낚시하기 좋은 조건입니다.';
  }
  if (rough.length) return `${because.join(', ')} 지수가 낮습니다.`;
  return '파도·바람은 무난하지만 수온·물때 등 어종별 조건이 맞지 않아 지수가 낮습니다.';
}
