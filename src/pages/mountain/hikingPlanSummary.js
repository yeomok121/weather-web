// 산악 페이지: 선택한 코스·속도·출발 시각으로 산행 일정과 위험도를 계산합니다.
// (기존 App.jsx의 hikingPlanSummary useMemo 본문을 그대로 옮긴 순수 함수)
import { PACE_OPTIONS } from '../../shared/forecast/HourlyForecast';
import { isWeatherNumber } from '../../shared/lib/forecastCache';
import { assessHikingForecastWindow, getHourlyForecastIndex } from './components/mountainAssessment';
import { koreanDate, planDepartureAt } from './lib/hikingPlan';
import { solarTimes } from './lib/solarTimes';

export function buildHikingPlanSummary({
  isMountainMode, activeWeather, mountainInfo, effectiveMountainInfo, hourlyData,
  selectedCourseIdx, paceType, departureOffsetHours, planReferenceAt, restoredDepartureAt, customGearList,
}) {
  if (!isMountainMode || !activeWeather.hasData || effectiveMountainInfo?.course_available === false) return null;
  const courses = effectiveMountainInfo?.courses || [{ name: '기본 탐방로', distance: '5km', time: 180, diff: '중' }];
  const selectedCourse = courses[selectedCourseIdx] || courses[0];
  const paceObj = PACE_OPTIONS.find(p => p.key === paceType) || PACE_OPTIONS[1];
  const totalMins = Math.max(20, Math.round((selectedCourse.time * paceObj.multiplier) / 10) * 10);
  const ascentMins = Math.max(15, Math.round((totalMins * 0.55) / 5) * 5);

  const parseTime = (str, fallback = 1080) => {
    if (!str || !str.includes(':')) return fallback;
    const [h, m] = str.split(':').map(Number);
    return (Number.isFinite(h) ? h : 18) * 60 + (Number.isFinite(m) ? m : 0);
  };
  const formatTime = (mins) => {
    const normalized = ((mins % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
  };

  const now = new Date();
  const departureAt = planDepartureAt({ referenceAt: planReferenceAt, date: activeWeather.forecastDate,
    isFuture: activeWeather.isFuture, offsetHours: departureOffsetHours, restoredAt: restoredDepartureAt });
  const departureDate = new Date(departureAt);
  const todayMidnight = Date.parse(`${koreanDate(now)}T00:00:00+09:00`);
  const depMins = Math.floor((departureDate.getTime() - todayMidnight) / 60000);
  const forecastOffsetHours = (departureDate.getTime() - now.getTime()) / 3600000;

  const summitArrivalMins = depMins + ascentMins;
  const descentFinishMins = depMins + totalMins;
  const isNextDayPlan = !activeWeather.isFuture && Math.floor(depMins / 1440) > 0;
  const solar = solarTimes(departureAt, mountainInfo?.lat, mountainInfo?.lon);
  const sameFinishDate = koreanDate(new Date(departureDate.getTime() + totalMins * 60000)) === koreanDate(departureDate);

  const safeDescentMins = parseTime(activeWeather.safeDescentTime || '15:30', 930);
  const sunsetMins = parseTime(activeWeather.sunset || '18:00', 1080);
  // safeDescentTime은 '하산 완료'가 아니라 '하산을 시작하도록 권장하는 시각'입니다.
  const descentStartMins = summitArrivalMins;
  const recommendedDepDeadlineMins = safeDescentMins - ascentMins;

  const temp = Number(activeWeather.temp || 0);
  const wind = isWeatherNumber(activeWeather.wind_speed) ? Number(activeWeather.wind_speed) : null;
  const cond = activeWeather.condition || '';
  const pm25Match = (activeWeather.dust || '').match(/\d+/);
  const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
  const scheduleAssessment = assessHikingForecastWindow({
    hourlyData,
    now,
    departureOffsetHours: Math.max(0, forecastOffsetHours),
    durationMinutes: totalMins,
    isFuture: !!activeWeather.isFuture,
    fallbackWeather: {
      temp,
      wind,
      condition: cond,
      targetPop: activeWeather.targetPop,
      pm25,
      humidity: activeWeather.humidity,
    },
  });
  const unavailableWindow = !activeWeather.isFuture && scheduleAssessment.mode === 'current_only' && forecastOffsetHours > 0.5;
  const weatherAssessment = unavailableWindow ? { ...scheduleAssessment.weatherAssessment, score: null, status: '선택 시간대 자료 없음', color: '#64748b', reasons: ['해당 시간의 예보를 확인할 수 없습니다'] } : scheduleAssessment.weatherAssessment;
  const viewEstimate = unavailableWindow ? { ...scheduleAssessment.viewEstimate, score: null, gradeText: '선택 시간대 자료 없음', gradeColor: '#64748b', summaryReason: '해당 시간의 예보를 확인할 수 없습니다', seaOfCloudsHint: null } : scheduleAssessment.viewEstimate;

  let scoreBasisLabel;
  if (activeWeather.isFuture) {
    scoreBasisLabel = '선택일 요약 예보 기준 · 출발 시각별 차이는 미반영';
  } else if (scheduleAssessment.mode === 'course_window') {
    scoreBasisLabel = `${formatTime(depMins)}–${formatTime(descentFinishMins)} 산행 시간대 ${scheduleAssessment.sampleCount}개 시점 중 최저`;
  } else if (scheduleAssessment.mode === 'partial_window') {
    scoreBasisLabel = `${formatTime(depMins)}–${formatTime(descentFinishMins)} 중 시간별 예보 제공 구간만 반영 (${scheduleAssessment.sampleCount}개 시점)`;
  } else if (forecastOffsetHours <= 0.5) {
    scoreBasisLabel = '현재 조건 기준 · 산행 시간대 예보 자료 없음';
  } else {
    scoreBasisLabel = '선택 시간대의 예보가 없어 점수를 표시하지 않습니다';
  }

  let timeSafetyStatus = '시간 여유 있음';
  let timeSafetyColor = '#166534';
  if (!solar || !sameFinishDate) {
    timeSafetyStatus = '날짜별 일출·일몰 정보 확인 필요';
    timeSafetyColor = '#d97706';
  } else if (departureDate.getTime() < solar.sunriseAt && departureDate.getTime() + totalMins * 60000 <= solar.sunsetAt) {
    timeSafetyStatus = '일출 전 출발 · 야간 산행 주의';
    timeSafetyColor = '#b45309';
  } else if (departureDate.getTime() + totalMins * 60000 > solar.sunsetAt) {
    timeSafetyStatus = '위험 (일몰 후 하산 예상)';
    timeSafetyColor = '#dc2626';
  } else if (departureDate.getTime() + ascentMins * 60000 > solar.sunsetAt - 120 * 60000) {
    timeSafetyStatus = '주의 (권장 하산 시작 시각 경과)';
    timeSafetyColor = '#d97706';
  }

  let summitForecast = null;
  if (!activeWeather.isFuture && Array.isArray(hourlyData) && hourlyData.length > 0) {
    const elapsedHoursToSummit = getHourlyForecastIndex({
      now,
      departureOffsetHours: Math.max(0, forecastOffsetHours),
      hourlyData,
      ascentMinutes: ascentMins,
    });
    if (elapsedHoursToSummit >= 0 && elapsedHoursToSummit < hourlyData.length) {
      const matched = hourlyData[elapsedHoursToSummit];
      const mTemp = Number(matched.temp);
      const estFeels = mTemp <= 15 ? Math.round(mTemp - (wind * 0.7)) : mTemp;
      summitForecast = {
        available: true,
        targetHourLabel: matched.time,
        temp: mTemp,
        feelsLike: estFeels,
        pop: Math.round(Number(matched.pop || 0) * 100),
        description: matched.description || '예보',
        icon: matched.icon
      };
    } else {
      summitForecast = { available: false, reason: '예측 불가 (제공된 시간별 예보 범위 밖)' };
    }
  } else {
    summitForecast = { available: false, reason: '예측 불가 (미래 일자는 시간별 상세 예보 미제공)' };
  }

  return {
    course: selectedCourse,
    departureAt,
    paceObj,
    totalMins,
    ascentMins,
    departureTimeStr: formatTime(depMins),
    summitArrivalTimeStr: formatTime(summitArrivalMins),
    descentFinishTimeStr: formatTime(descentFinishMins),
    recommendedDepDeadlineStr: solar && sameFinishDate ? new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(solar.sunsetAt - (120 + ascentMins) * 60000)) : '날짜별 일몰 정보 확인 필요',
    descentStartTimeStr: formatTime(descentStartMins),
    safeDescentStartTime: solar && sameFinishDate ? new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(solar.sunsetAt - 120 * 60000)) : '날짜별 확인 필요',
    weatherScore: weatherAssessment.score,
    weatherAssessmentStatus: weatherAssessment.status,
    weatherAssessmentReasons: weatherAssessment.reasons,
    weatherAssessment,
    viewEstimate,
    scoreBasisLabel,
    weatherWorstTime: scheduleAssessment.weatherWorstTime,
    viewWorstTime: scheduleAssessment.viewWorstTime,
    timeSafetyStatus,
    timeSafetyColor,
    isNextDayPlan,
    solar: sameFinishDate ? solar : null,
    summitForecast,
    gearList: customGearList
  };
}
