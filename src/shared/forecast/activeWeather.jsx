// 공통: 주간 예보에서 다른 날짜를 고르면, 그 날짜 기준으로 화면에 보여줄 날씨 값을 만듭니다.
import { getEmojiIcon } from './WeeklyForecast';

export function buildActiveWeather({ weatherData, weeklyData, selectedDateIdx, isMountainMode }) {
  if (selectedDateIdx === 0 || !weeklyData[selectedDateIdx]) return weatherData;
  const target = weeklyData[selectedDateIdx];
  const tempDrop = isMountainMode ? (weatherData.summitDrop || 5) : 0;
  
  return {
    ...weatherData,
    date: `${target.date} (${target.day})`,
    forecastDate: target.full_date || null,
    temp: target.temp_max,
    feelsLike: target.temp_max - (target.wind_speed >= 5 ? 3 : 0), 
    baseTemp: target.temp_max + tempDrop,
    condition: '주간 예보 기준',
    highLow: `최고 ${target.temp_max}° / 최저 ${target.temp_min}°`,
    icon: <span style={{ fontSize: '70px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }}>{getEmojiIcon(target.icon)}</span>,
    wind_speed: target.wind_speed || weatherData.wind_speed,
    humidity: target.humidity || weatherData.humidity,
    targetPop: target.pop,
    isFuture: true,
    weatherSources: isMountainMode ? {
      temperature: '주간 예보 기반 고도 보정 추정값',
      wind: '주간 예보 기반 고도·지형 보정 추정값',
      humidity: '주간 예보 기반 추정값',
    } : {
      temperature: 'OpenWeather 주간 예보',
      wind: 'OpenWeather 주간 예보',
      humidity: 'OpenWeather 주간 예보',
    },
    dataAsOf: null,
    dataNote: isMountainMode
      ? '선택 날짜의 주간 예보를 고도·지형 보정해 표시합니다. 정상 실측값이 아닙니다.'
      : '선택 날짜의 주간 예보입니다.'
  };
}
