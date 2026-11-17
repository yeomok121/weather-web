// 낚시 페이지: 바다낚시 준비물 목록. 기본 준비물 + 오늘 바다 조건에 따라 더할 것.
export const BASE_GEAR = [
  { id: 'lifejacket', name: '구명조끼', note: '갯바위·방파제·선상 모두 필수' },
  { id: 'shoes', name: '미끄럼 방지 신발', note: '갯바위는 스파이크·펠트 바닥' },
  { id: 'rod', name: '낚싯대·릴·채비', note: '대상 어종에 맞는 바늘·찌·봉돌' },
  { id: 'bait', name: '미끼·밑밥', note: '현지 낚시점에서 구매 가능' },
  { id: 'gloves', name: '장갑', note: '고기·바늘 다룰 때' },
  { id: 'water', name: '물·간식' },
  { id: 'phone', name: '휴대폰 방수팩·보조배터리', note: '해경 122 신고용' },
  { id: 'firstaid', name: '응급약·밴드' },
  { id: 'trash', name: '쓰레기봉투', note: '밑밥·채비 쓰레기 되가져오기' },
];

const maxOf = (values) => Math.max(-Infinity, ...values.filter((value) => Number.isFinite(value)));
const minOf = (values) => Math.min(Infinity, ...values.filter((value) => Number.isFinite(value)));

// conditions: { windMax, airTempMin, airTempMax, waveMax, rain, warningKinds: [], tideLabel }
export function conditionalGear(conditions = {}) {
  const items = [];
  const { windMax, airTempMin, airTempMax, waveMax, rain, warningKinds = [], tideLabel } = conditions;
  if (warningKinds.includes('풍랑') || warningKinds.includes('강풍') || windMax >= 8) items.push({ id: 'windbreaker', name: '방풍 재킷·모자 고정끈', reason: warningKinds.length ? `${warningKinds.join('·')} 특보` : `바람 최대 ${windMax} m/s` });
  if (airTempMin <= 10) items.push({ id: 'warm', name: '방한복·핫팩', reason: `기온 최저 ${airTempMin}°C` });
  if (airTempMax >= 25) items.push({ id: 'sun', name: '선크림·선글라스·챙 모자', reason: `기온 최고 ${airTempMax}°C` });
  if (rain) items.push({ id: 'rain', name: '우비·방수 가방', reason: '해상예보에 비·눈' });
  if (waveMax >= 1.5) items.push({ id: 'wave', name: '높은 파도 주의', reason: `파고 최대 ${waveMax} m · 갯바위 낮은 자리 피하기`, tip: true });
  if (['6물', '7물', '8물', '9물'].includes(tideLabel)) items.push({ id: 'current', name: '무거운 봉돌·여유 채비', reason: `${tideLabel} · 물살이 센 때` });
  items.push({ id: 'lamp', name: '헤드랜턴', reason: '새벽·해질녘 이동' });
  return items;
}

// 화면 데이터에서 오늘 조건을 뽑습니다. (바다낚시지수 오늘 자료 + 해상예보 + 특보)
export function todayConditions({ indexDays = [], forecastRows = [], warnings = [], tideLabel = '' } = {}) {
  const sessions = indexDays[0]?.sessions || [];
  const forecastWind = forecastRows.slice(0, 2).map((row) => Number(row.WS2 ?? row.WS1));
  return {
    windMax: maxOf([...sessions.map((s) => s.wind_ms?.max), ...forecastWind]),
    airTempMin: minOf(sessions.map((s) => s.air_temp_c?.min)),
    airTempMax: maxOf(sessions.map((s) => s.air_temp_c?.max)),
    waveMax: maxOf([...sessions.map((s) => s.wave_m?.max), ...forecastRows.slice(0, 2).map((row) => Number(row.WH2 ?? row.WH1))]),
    rain: forecastRows.slice(0, 2).some((row) => row.PREP && row.PREP !== '0'),
    warningKinds: [...new Set((warnings || []).map((item) => item.kind).filter((kind) => kind === '풍랑' || kind === '강풍'))],
    tideLabel,
  };
}
