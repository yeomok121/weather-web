// Display preferences and colours, independent of weather warning criteria.
export function preferredWeatherLayer(weather) {
  if (!weather?.hasData) return null;
  const wet = /비|눈|소나기|우박/.test(weather.condition || '');
  return !wet && Number.isFinite(weather.wind_speed) && weather.wind_speed >= 6 ? 'wind' : 'rain';
}

export function windColor(speed) {
  if (speed >= 10) return '#b53638';
  if (speed >= 6) return '#98600b';
  if (speed >= 3) return '#087c70';
  return '#226bac';
}

export function windDirectionLabel(degrees) {
  if (!Number.isFinite(degrees)) return '풍향 자료 없음';
  return `${['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Math.round(degrees / 45) % 8]}풍`;
}

export function windArrowRotation(degrees) {
  return Number.isFinite(degrees) ? (degrees + 180) % 360 : null;
}
