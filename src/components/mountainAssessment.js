// 산악 기상 점수는 공식 산행 허가나 안전 보증이 아닌, 제공된 기상요소를 조합한 참고 지표입니다.
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

// Hourly forecast rows start at the current floored hour. Select the closest
// forecast hour to the estimated summit arrival; do not invent interpolated values.
export function getHourlyForecastIndex({ now = new Date(), departureOffsetHours = 0, ascentMinutes = 0 } = {}) {
  const minutesFromForecastStart = now.getMinutes() + (departureOffsetHours * 60) + ascentMinutes;
  return Math.max(0, Math.round(minutesFromForecastStart / 60));
}

export function assessMountainWeather({ temp = 0, wind = 0, condition = '', targetPop = 0, pm25 = 15, humidity = 50 } = {}) {
  const text = String(condition || '');
  const popValue = Number(targetPop) || 0;
  const popPercent = popValue <= 1 ? popValue * 100 : popValue;
  const precipitation = /비|소나기|눈|우박/.test(text) || popPercent >= 60;
  const reasons = [];
  let score = 100;

  if (precipitation) { score -= 35; reasons.push(`강수·강설 위험(${Math.round(popPercent)}%)`); }
  if (wind >= 15) { score -= 40; reasons.push(`매우 강한 바람(${wind}m/s)`); }
  else if (wind >= 10) { score -= 28; reasons.push(`강한 바람(${wind}m/s)`); }
  else if (wind >= 7) { score -= 16; reasons.push(`바람 주의(${wind}m/s)`); }
  else if (wind >= 5) { score -= 7; reasons.push(`바람 확인(${wind}m/s)`); }

  if (temp <= -15 || temp >= 35) { score -= 22; reasons.push(`극단적 기온(${temp}°C)`); }
  else if (temp <= -5 || temp >= 30) { score -= 13; reasons.push(`기온 주의(${temp}°C)`); }
  else if (temp <= 0 || temp >= 27) { score -= 6; reasons.push(`기온 확인(${temp}°C)`); }

  if (pm25 >= 76) { score -= 15; reasons.push(`초미세먼지 매우 나쁨(${pm25})`); }
  else if (pm25 >= 36) { score -= 8; reasons.push(`초미세먼지 나쁨(${pm25})`); }
  if (humidity >= 95) { score -= 5; reasons.push(`높은 습도(${humidity}%)`); }

  score = clamp(score);
  let status = '기상 조건 양호(참고)';
  let color = '#16a34a';
  if ((precipitation && popPercent >= 70) || wind >= 15 || temp <= -15 || score < 45) {
    status = '산행 자제 검토'; color = '#dc2626';
  } else if (score < 70) {
    status = '위험요인 다수 · 주의'; color = '#dc2626';
  } else if (score < 85) {
    status = '기상 조건 확인 필요'; color = '#d97706';
  }
  return { score, status, color, reasons: reasons.length ? reasons : ['뚜렷한 기상 감점 요인 없음'], precipitation, popPercent };
}

export function estimateSummitView({ condition = '', humidity = 50, pm25 = 15, wind = 0 } = {}) {
  const text = String(condition || '');
  let score = 80;
  const reasons = [];
  if (/비|소나기|눈|우박/.test(text)) { score -= 35; reasons.push('강수·강설로 시야 저하 가능'); }
  else if (text.includes('흐림')) { score -= 20; reasons.push('흐린 하늘'); }
  else if (text.includes('구름')) { score -= 8; reasons.push('구름 영향'); }
  else reasons.push('현재 하늘 상태는 비교적 양호');

  if (humidity >= 90) { score -= 22; reasons.push(`고습도(${humidity}%) · 안개 가능성`); }
  else if (humidity >= 80) { score -= 12; reasons.push(`습도(${humidity}%) 높음`); }
  else reasons.push(`습도(${humidity}%)`);

  if (pm25 >= 76) { score -= 22; reasons.push(`초미세먼지 매우 나쁨(${pm25})`); }
  else if (pm25 >= 36) { score -= 12; reasons.push(`초미세먼지 나쁨(${pm25})`); }
  if (wind >= 15) { score -= 8; reasons.push('강풍에 따른 체감 시야 저하 가능'); }

  score = clamp(score);
  let gradeText = '조망 환경 양호 추정';
  let gradeColor = '#0284c7';
  if (score < 45) { gradeText = '조망 제한 가능성'; gradeColor = '#dc2626'; }
  else if (score < 70) { gradeText = '조망 환경 보통'; gradeColor = '#d97706'; }

  const seaOfCloudsHint = (!/비|소나기|눈|우박/.test(text) && humidity >= 85 && wind <= 3.5)
    ? '운해 형성 조건 일부 해당 · 실제 운해 여부는 현장 확인 필요'
    : null;
  return { score, gradeText, gradeColor, summaryReason: reasons.slice(0, 2).join(' · '), seaOfCloudsHint };
}
