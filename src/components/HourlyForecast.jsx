import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiShare2, FiPlus, FiX, FiRotateCcw, FiMapPin, FiEye, FiInfo } from 'react-icons/fi';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { getEmojiIcon } from './WeeklyForecast';
import { assessMountainWeather, estimateSummitView, getHourlyForecastIndex } from './mountainAssessment';
import HikingPlannerPanel from './HikingPlannerPanel';
import MountainPlanControls from './MountainPlanControls';
import MountainQuickGuide from './MountainQuickGuide';
import './MountainJourney.css';
import { readHikingDraft, writeHikingDraft, koreanDate } from '../lib/hikingPlan';

const ITEMS_TO_SHOW = 6;
const EMPTY_HOURLY = [];
const departureInputValue = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)).replace(' ', 'T') : '';

export const PACE_OPTIONS = [
  { key: 'slow', label: '🐢 초보(여유)', multiplier: 1.3 },
  { key: 'normal', label: '🥾 보통(표준)', multiplier: 1.0 },
  { key: 'fast', label: '⚡ 숙련(빠름)', multiplier: 0.85 },
];

const DEPARTURE_OFFSETS = Array.from({ length: 25 }, (_, value) => ({ value, label: value === 0 ? '지금 출발' : `+${value}시간 뒤` }));

const KNPS_MOUNTAINS = new Set([
  '북한산', '설악산', '지리산', '계룡산', '덕유산', '소백산', '태백산', '오대산',
  '치악산', '월악산', '속리산', '가야산', '무등산', '주왕산', '내장산',
]);

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const CustomLabel = ({ x, y, value }) => (
  <text x={x} y={y - 10} fill="#1e293b" fontSize="13" fontWeight="bold" textAnchor="middle">
    {value}°
  </text>
);

function MountainInfo({ label, children }) {
  return (
    <details className="mountain-info-disclosure">
      <summary><FiInfo size={14} aria-hidden="true" /><span>{label}</span></summary>
      <div className="mountain-info-disclosure__content">{children}</div>
    </details>
  );
}

function HourlyForecast({
  hourlyData = EMPTY_HOURLY,
  isLoading = false,
  error = '',
  onRetry,
  isMountainMode = false,
  mountainInfo = null,
  weatherData = {},
  onShowToast,
  selectedCourseIdx = 0,
  onSelectCourseIdx,
  paceType = 'normal',
  onSelectPaceType,
  departureOffsetHours = 0,
  onSelectDepartureOffset,
  onGearListChange,
  loggedInUser = null,
  selectedDateIdx = 0,
  hikingPlanSummary = null,
  onRequireLogin,
  departureAt = null,
  restoredDepartureAt = null,
  onRestoreDeparture,
  isStale = false,
  onApplyHikingPlan
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localCourseIdx, setLocalCourseIdx] = useState(0);
  const [localPaceType, setLocalPaceType] = useState('normal');
  const [localDepOffset, setLocalDepOffset] = useState(0);
  const [preparationTab, setPreparationTab] = useState(() => new URLSearchParams(window.location.search).has('party') ? 'account' : 'gear');
  const [plannerSection, setPlannerSection] = useState('plan');
  const [hydratedDraftKey, setHydratedDraftKey] = useState('');
  const [departureDraft, setDepartureDraft] = useState('');
  const [departureError, setDepartureError] = useState('');
  const [compareOpen, setCompareOpen] = useState(false);
  const [invitationCount, setInvitationCount] = useState(0);
  const [visibleStep, setVisibleStep] = useState('hike-schedule');
  const previousDraftOwner = useRef(null);
  const hasWeatherData = weatherData.hasData === true;
  useEffect(() => { setDepartureDraft(departureInputValue(departureAt)); setDepartureError(''); }, [departureAt]);

  const [gearList, setGearList] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [newGearInput, setNewGearInput] = useState('');

  const applyingSavedPlanRef = useRef(false);

  const activeCourseIdx = onSelectCourseIdx ? selectedCourseIdx : localCourseIdx;
  const setCourseIdx = onSelectCourseIdx || setLocalCourseIdx;
  const activePace = onSelectPaceType ? paceType : localPaceType;
  const setPace = onSelectPaceType || setLocalPaceType;
  const activeDepOffset = onSelectDepartureOffset ? departureOffsetHours : localDepOffset;
  const setDepOffset = onSelectDepartureOffset || setLocalDepOffset;
  const departureReferenceTime = new Date();

  const getDepartureOptionLabel = option => {
    const reference = departureAt && !restoredDepartureAt
      ? Date.parse(departureAt) - activeDepOffset * 3600000
      : isFuture && weatherData.forecastDate
        ? Date.parse(`${weatherData.forecastDate}T08:00:00+09:00`) : Date.now();
    const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(reference + option.value * 3600000));
    return `${option.value === 0 ? (isFuture ? '선택일 오전 8시' : '지금 출발') : `+${option.value}시간`} (${time})`;
  };

  const plannedStart = Date.parse(departureAt);
  const plannedDuration = (hikingPlanSummary?.totalMins || 180) * 60000;
  const plannedRows = Array.isArray(hourlyData) && Number.isFinite(plannedStart)
    ? hourlyData.filter(row => { const t = Date.parse(row.valid_at); return Number.isFinite(t) && t >= plannedStart - 1800000 && t <= plannedStart + plannedDuration + 1800000; }) : [];
  const plannedTemps = plannedRows.map(row => toNumber(row.temp)).filter(n => n !== null);
  const plannedWinds = plannedRows.map(row => toNumber(row.wind_speed)).filter(n => n !== null);
  const plannedHumidity = plannedRows.map(row => toNumber(row.humidity)).filter(n => n !== null);
  const temp = plannedTemps.length ? Math.min(...plannedTemps) : Number(weatherData?.temp ?? 0);
  const currentTemp = Number(weatherData?.temp ?? 0);
  const currentWind = Number(weatherData?.wind_speed ?? 0);
  const baseTemp = Number(weatherData?.baseTemp ?? (currentTemp + 5));
  const wind = plannedWinds.length ? Math.max(...plannedWinds) : Number(weatherData?.wind_speed ?? 0);
  const humidity = plannedHumidity.length ? Math.max(...plannedHumidity) : Number(weatherData?.humidity ?? 50);
  const dustStr = weatherData?.dust || '';
  const pm25Match = dustStr.match(/\d+/);
  const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
  const desc = plannedRows.length ? plannedRows.map(row => row.description || '').join(' ') : (weatherData?.condition || '');
  const nextHoursRainPop = Array.isArray(hourlyData)
    ? Math.max(0, ...plannedRows.map(item => Number(item?.pop || 0) * 100))
    : 0;
  const currentRainPop = plannedRows.length ? 0 : Number(weatherData?.targetPop || 0);
  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || Math.max(currentRainPop, nextHoursRainPop) >= 60;
  const isSnow = desc.includes('눈');
  const sunrise = hikingPlanSummary?.solar?.sunrise || weatherData?.sunrise || '06:30';
  const sunset = hikingPlanSummary?.solar?.sunset || weatherData?.sunset || '18:00';
  const safeDescentTime = hikingPlanSummary?.solar ? new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul', hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(hikingPlanSummary.solar.sunsetAt - 7200000)) : (weatherData?.safeDescentTime || mountainInfo?.safe_descent_time || '');
  const terrain = mountainInfo?.terrain || '';
  const isFuture = weatherData?.isFuture || false;

  const summitFeelsLike = currentTemp <= 15 ? Math.round(currentTemp - (currentWind * 0.7)) : currentTemp;

  const courses = mountainInfo?.courses || [{ name: '기본 탐방로', distance: '5km', time: 180, diff: '중' }];
  const selectedCourse = courses[activeCourseIdx] || courses[0];

  const currentPaceObj = PACE_OPTIONS.find(p => p.key === activePace) || PACE_OPTIONS[1];
  const adjustedTimeMins = Math.max(20, Math.round((selectedCourse.time * currentPaceObj.multiplier) / 10) * 10);
  const ascentTimeMins = Math.max(15, Math.round((adjustedTimeMins * 0.55) / 5) * 5);

  const getNutritionGuide = () => {
    const hours = adjustedTimeMins / 60;
    let waterPerHour = 0.35;
    if (temp >= 25) waterPerHour = 0.55;
    else if (temp >= 18) waterPerHour = 0.45;
    else if (temp <= 2) waterPerHour = 0.3;

    const totalWaterL = Math.max(0.5, Math.min(3.5, Math.round(hours * waterPerHour * 2) / 2));
    const waterNote = temp <= 5 ? ' (보온 500ml 포함)' : temp >= 24 ? ' (이온음료 권장)' : '';

    let kcalPerHour = 220;
    if (selectedCourse.diff.includes('상')) kcalPerHour = 270;
    if (temp <= 0) kcalPerHour += 30;
    const totalKcal = Math.max(200, Math.round((hours * kcalPerHour) / 50) * 50);

    return {
      waterText: `${totalWaterL}L${waterNote}`,
      kcalText: `약 ${totalKcal.toLocaleString()}kcal`,
      shortWater: `${totalWaterL}L`
    };
  };
  const nutrition = getNutritionGuide();

  const courseRiskNotes = [];
  if (selectedCourse.diff?.includes('상')) {
    courseRiskNotes.push(`선택 코스 난이도 ${selectedCourse.diff}: 소요시간은 체력과 노면에 따라 늘어날 수 있어 여유를 두세요.`);
  }
  if (isRainOrSnow) {
    courseRiskNotes.push(terrain.includes('암릉') || terrain.includes('바위')
      ? `강수·강설 예보가 있습니다. ${terrain} 구간의 실제 노면과 접지력을 현장에서 확인하세요.`
      : '강수·강설 예보가 있습니다. 탐방로 노면 상태와 미끄럼 위험을 확인하세요.');
  }
  if (wind >= 6) courseRiskNotes.push(`정상 풍속 ${wind}m/s입니다. 능선 체류를 줄이고 방풍 의류를 준비하세요.`);
  if (temp <= 0 && (isRainOrSnow || humidity >= 75)) {
    courseRiskNotes.push('영하 기온과 습한 조건이 겹쳐 결빙 가능성이 있습니다. 현장 노면을 확인하세요.');
  }

  const getTrailheadQuery = () => {
    if (selectedCourse.trailhead) return selectedCourse.trailhead;
    const mName = weatherData?.region || mountainInfo?.name || '북한산';
    if (selectedCourse.manual) return `${mName} 등산로`;
    const match = selectedCourse.name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const sub = match[1].replace('최단', '').trim();
      return `${mName} ${sub}`;
    }
    const firstPart = selectedCourse.name.split('~')[0].split(' ')[0];
    return `${mName} ${firstPart}`;
  };

  const handleOpenMap = (provider, e) => {
    e.preventDefault();
    e.stopPropagation();
    const query = encodeURIComponent(getTrailheadQuery());
    const url = provider === 'kakao'
      ? `https://map.kakao.com/link/search/${query}`
      : `https://map.naver.com/p/search/${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const officialTrailInfo = mountainInfo?.name === '한라산'
    ? { label: '한라산 공식 탐방 안내', url: 'https://visithalla.jeju.go.kr/contents/contents.do?id=49' }
    : KNPS_MOUNTAINS.has(mountainInfo?.name)
      ? { label: '국립공원 통제정보 확인', url: 'https://www.knps.or.kr/front/portal/safe/acsCtrList.do?menuNo=8000340' }
      : null;

  const buildWeatherGearList = () => {
    const items = [
      '등산화 (접지력 확인)',
      `식수 최소 ${nutrition.shortWater}`,
      `행동식 (${nutrition.kcalText})`
    ];
    if (temp <= 2 || isSnow) items.push('아이젠 및 스패츠', '보온병 (온수)', '방한모 및 넥워머');
    if (temp <= 15 || wind >= 5) items.push('방풍 재킷(바람막이)');
    if (isRainOrSnow) items.push('판초우의 또는 배낭 커버');
    if (terrain.includes('암릉') || terrain.includes('바위')) items.push('반장갑 (바위용)', '릿지화(암릉화)');
    items.push('등산 스틱', '비상용 헤드랜턴');

    return items;
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [hourlyData]);

  const draftOwner = loggedInUser?.id || 'guest';
  const draftKey = `hiking:draft:${draftOwner}:${mountainInfo?.name || 'none'}:${weatherData.forecastDate || weatherData.date}`;
  useEffect(() => {
    if (!isMountainMode || !hasWeatherData || !mountainInfo?.name) return;
    if (applyingSavedPlanRef.current) { setHydratedDraftKey(draftKey); return; }
    let draft = readHikingDraft(draftKey);
    const guestKey = `hiking:draft:guest:${mountainInfo.name}:${weatherData.forecastDate || weatherData.date}`;
    if (!draft && draftOwner !== 'guest' && previousDraftOwner.current === 'guest') {
      draft = readHikingDraft(guestKey);
      if (draft) { writeHikingDraft(draftKey, draft); try { localStorage.removeItem(guestKey); } catch { /* optional */ } }
    }
    const nextGear = draft?.gearList || buildWeatherGearList();
    setGearList(nextGear); setChecklist(draft?.checklist || {});
    onGearListChange?.(nextGear);
    if (draft) {
      if (Number(draft.courseIndex) < courses.length) setCourseIdx(Number(draft.courseIndex) || 0);
      if (PACE_OPTIONS.some(item => item.key === draft.pace)) setPace(draft.pace);
      if (draft.departureAt && Date.parse(draft.departureAt) > Date.now()) onRestoreDeparture?.(draft.departureAt);
    }
    previousDraftOwner.current = draftOwner;
    setHydratedDraftKey(draftKey);
  }, [draftKey, hasWeatherData, isMountainMode]);

  useEffect(() => {
    if (hydratedDraftKey !== draftKey || !hasWeatherData || applyingSavedPlanRef.current) return;
    writeHikingDraft(draftKey, { gearList, checklist, courseIndex: activeCourseIdx, pace: activePace, departureAt });
  }, [draftKey, hydratedDraftKey, gearList, checklist, activeCourseIdx, activePace, departureAt, hasWeatherData]);

  const handleApplySavedPlan = async (plan) => {
    applyingSavedPlanRef.current = true;
    try {
      await onApplyHikingPlan?.(plan);
      const names = (plan.items || []).map(item => item.name).filter(Boolean);
      setGearList(names);
      setChecklist(Object.fromEntries((plan.items || []).map(item => [item.name, !!item.checked])));
      setPace(plan.pace || 'normal');
      onGearListChange?.(names);
    } finally { applyingSavedPlanRef.current = false; }
  };

  const updateGears = (nextGears) => {
    setGearList(nextGears);
    if (onGearListChange) onGearListChange(nextGears);
  };

  const toggleCheck = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleAddGear = () => {
    const trimmed = newGearInput.trim();
    if (!trimmed) return;
    if (gearList.includes(trimmed)) {
      if (onShowToast) onShowToast('이미 체크리스트에 있는 준비물입니다.');
      return;
    }
    updateGears([...gearList, trimmed]);
    setNewGearInput('');
  };

  const handleRemoveGear = (itemToRemove) => {
    updateGears(gearList.filter(item => item !== itemToRemove));
    setChecklist(prev => {
      const next = { ...prev };
      delete next[itemToRemove];
      return next;
    });
  };

  const handleResetGear = () => {
    updateGears(buildWeatherGearList());
    setChecklist({});
    if (onShowToast) onShowToast('🔄 현재 기상과 코스에 맞는 기본 추천 준비물로 복원되었습니다.');
  };

  const rawForecastData = Array.isArray(hourlyData)
    ? hourlyData.filter(item => item && typeof item === 'object').map((item, index) => {
        const t = toNumber(item.temp);
        const pop = toNumber(item.pop);
        return {
          id: index,
          time: item.time || '시간 없음',
          valid_at: item.valid_at,
          icon: item.icon,
          description: item.description,
          tempNum: t,
          pop: pop === null ? 0 : Math.round(Math.max(0, Math.min(1, pop)) * 100),
        };
      })
    : [];

  const maxIndex = Math.max(0, rawForecastData.length - ITEMS_TO_SHOW);
  const visibleIndex = Math.min(currentIndex, maxIndex);
  const visibleSlice = rawForecastData.slice(visibleIndex, visibleIndex + ITEMS_TO_SHOW);
  const visibleTemps = visibleSlice.map(d => d.tempNum).filter(v => v !== null);
  const sliceMin = visibleTemps.length > 0 ? Math.min(...visibleTemps) : 10;
  const sliceMax = visibleTemps.length > 0 ? Math.max(...visibleTemps) : 20;

  const yMin = sliceMax === sliceMin ? sliceMin - 2 : sliceMin - 0.8;
  const yMax = sliceMax === sliceMin ? sliceMax + 2 : sliceMax + 1.2;

  const forecastData = rawForecastData.map(item => ({
    ...item,
    plotTemp: item.tempNum === null ? null : Math.min(yMax - 0.2, Math.max(yMin + 0.2, item.tempNum))
  }));

  const handlePrev = () => setCurrentIndex(Math.max(0, visibleIndex - ITEMS_TO_SHOW));
  const handleNext = () => setCurrentIndex(Math.min(maxIndex, visibleIndex + ITEMS_TO_SHOW));

  const prevDisabled = isLoading || visibleIndex === 0;
  const nextDisabled = isLoading || visibleIndex >= maxIndex;

  const buttonStyle = {
    background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '50%', width: '28px', height: '28px',
    display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#1e293b', transition: 'background-color 0.2s',
  };

  const pm25Value = Number.isFinite(pm25) ? pm25 : 15;
  const nextHoursPop = Math.max(0, ...rawForecastData.slice(0, 6).map(item => item.pop));
  const fallbackWeatherAssessment = assessMountainWeather({
    temp, wind, condition: desc, targetPop: weatherData?.targetPop ?? nextHoursPop,
    pm25: pm25Value, humidity
  });
  const weatherAssessment = isMountainMode && hikingPlanSummary?.weatherAssessment
    ? hikingPlanSummary.weatherAssessment
    : fallbackWeatherAssessment;
  const weatherScore = weatherAssessment.score;
  const viewEstimate = isMountainMode && hikingPlanSummary?.viewEstimate
    ? hikingPlanSummary.viewEstimate
    : estimateSummitView({ condition: desc, humidity, pm25: pm25Value, wind });

  const getTimelineAndSummitArrival = () => {
    const parseTime = (str, fallback = 1080) => {
      if (!str || !str.includes(':')) return fallback;
      const [h, m] = str.split(':').map(Number);
      return (Number.isFinite(h) ? h : 18) * 60 + (Number.isFinite(m) ? m : 0);
    };
    const formatTime = (mins) => {
      const normalized = ((mins % 1440) + 1440) % 1440;
      return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
    };

    const now = departureReferenceTime;
    const baseNowMins = now.getHours() * 60 + now.getMinutes();
    const actualDeparture = departureAt ? new Date(departureAt) : null;
    const midnight = Date.parse(`${koreanDate(now)}T00:00:00+09:00`);
    const depMins = actualDeparture ? Math.floor((actualDeparture.getTime() - midnight) / 60000) : (isFuture ? (8 + activeDepOffset) * 60 : baseNowMins + activeDepOffset * 60);
    const summitArrivalMins = depMins + ascentTimeMins;
    const descentFinishMins = depMins + adjustedTimeMins;

    const depTimeStr = formatTime(depMins);
    const summitArrivalStr = formatTime(summitArrivalMins);
    const descentFinishStr = formatTime(descentFinishMins);

    let arrivalWeather = { available: false, reason: '예측 불가 (상세 예보 범위 초과)' };
    if (isFuture) {
      arrivalWeather = { available: false, reason: '예측 불가 (미래 일자는 주간 예보 참고)' };
    } else if (Array.isArray(rawForecastData) && rawForecastData.length > 0) {
      const hoursUntilSummit = getHourlyForecastIndex({
        now,
        departureOffsetHours: actualDeparture ? Math.max(0, (actualDeparture.getTime() - now.getTime()) / 3600000) : activeDepOffset,
        hourlyData: rawForecastData,
        ascentMinutes: ascentTimeMins,
      });
      if (hoursUntilSummit >= 0 && hoursUntilSummit < rawForecastData.length) {
        const matched = rawForecastData[hoursUntilSummit];
        const mTemp = matched.tempNum;
        const estFeels = mTemp !== null ? (mTemp <= 15 ? Math.round(mTemp - (wind * 0.7)) : mTemp) : null;
        arrivalWeather = {
          available: true,
          forecastHour: matched.time,
          temp: mTemp,
          feelsLike: estFeels,
          pop: matched.pop,
          description: matched.description || '예보',
          icon: matched.icon
        };
      }
    }

    const isNextDayPlan = !isFuture && Math.floor(depMins / 1440) > 0;
    if (!hikingPlanSummary?.solar) {
      return {
        status: 'planning',
        safetyBadge: '🗓️ 날짜별 일몰 확인 필요',
        safetyColor: '#b45309',
        safetyBg: 'rgba(254,252,232,0.9)',
        deadlineStr: '날짜별 일몰 정보 확인 필요',
        depTimeStr,
        summitArrivalStr,
        descentFinishStr,
        arrivalWeather,
        msg: isFuture
          ? `🗓️ ${weatherData.date}: 주간 예보 기준 일정입니다. 날짜별 일출·일몰과 탐방로 운영시간을 확인해야 하산 안전을 판단할 수 있습니다.`
          : `🗓️ 다음 날 ${depTimeStr} 출발 일정입니다. 날짜별 일출·일몰과 탐방로 운영시간을 확인해야 하산 안전을 판단할 수 있습니다.`
      };
    }

    if (actualDeparture && actualDeparture.getTime() < hikingPlanSummary.solar.sunriseAt && actualDeparture.getTime() + adjustedTimeMins * 60000 <= hikingPlanSummary.solar.sunsetAt) {
      return {
        status: 'night', safetyBadge: '🌙 일출 전 출발 · 야간 산행 주의',
        safetyColor: '#b45309', safetyBg: 'rgba(254,252,232,0.9)',
        deadlineStr: '일출 전 출발', depTimeStr, summitArrivalStr, descentFinishStr, arrivalWeather,
        msg: `🌙 ${depTimeStr} 출발은 일출(${sunrise}) 전입니다. 어두운 구간과 탐방로 입산 가능 시간을 확인하세요.`
      };
    }

    const dayOffset = Math.floor(depMins / 1440) * 1440;
    const safeDescentMins = dayOffset + parseTime(safeDescentTime, 930);
    const sunsetMins = dayOffset + parseTime(sunset, 1080);
    // 권장 하산 시작 시각에 정상에서 출발할 수 있도록 등정 시간만큼 역산합니다.
    const descentStartMins = summitArrivalMins;
    const deadlineMins = safeDescentMins - ascentTimeMins;
    const deadlineStr = formatTime(deadlineMins);

    if (descentFinishMins > sunsetMins) {
      return {
        status: 'danger',
        safetyBadge: '🚨 시간 안전: 위험 (일몰 후 하산)',
        safetyColor: '#991b1b',
        safetyBg: 'rgba(254,242,242,0.9)',
        deadlineStr,
        depTimeStr,
        summitArrivalStr,
        descentFinishStr,
        arrivalWeather,
        msg: `🚨 [시간 위험] ${depTimeStr} 출발 시 하산 완료(${descentFinishStr})가 일몰(${sunset}) 이후로 예상됩니다. 출발을 앞당기거나 코스를 줄이세요.`
      };
    }

    if (descentStartMins > safeDescentMins) {
      return {
        status: 'warning',
        safetyBadge: '⚠️ 시간 안전: 권장 하산 시작 시각 경과',
        safetyColor: '#b45309',
        safetyBg: 'rgba(254,252,232,0.9)',
        deadlineStr,
        depTimeStr,
        summitArrivalStr,
        descentFinishStr,
        arrivalWeather,
        msg: `⚠️ [시간 주의] 정상 도착 예상(${summitArrivalStr})이 권장 하산 시작 시각(${safeDescentTime})보다 늦습니다. 출발 시간을 앞당기거나 코스를 줄이세요.`
      };
    }

    return {
      status: 'safe',
      safetyBadge: '✅ 일몰 전 하산 예상',
      safetyColor: '#166534',
      safetyBg: 'rgba(240,253,244,0.9)',
      deadlineStr,
      depTimeStr,
      summitArrivalStr,
      descentFinishStr,
      arrivalWeather,
      msg: `✅ ${depTimeStr} 출발 시 약 ${summitArrivalStr} 정상 도착, 일몰(${sunset}) 전 ${descentFinishStr}경 하산이 예상됩니다. 실제 통제와 현장 상황을 확인하세요.`
    };
  };
  const timeline = getTimelineAndSummitArrival();
  const decisionSummary = timeline.status === 'danger'
    ? `출발 ${timeline.depTimeStr} → 예상 하산 ${timeline.descentFinishStr}. 일몰 이후 하산이 예상됩니다.`
    : timeline.status === 'warning'
      ? `정상 도착 예상 ${timeline.summitArrivalStr}이 권장 하산 시작 시각 ${safeDescentTime}보다 늦습니다.`
      : timeline.status === 'planning'
        ? '선택 날짜의 일출·일몰과 탐방로 운영시간 확인이 필요합니다.'
        : timeline.status === 'sunrise' || timeline.status === 'night'
          ? timeline.msg
          : `출발 ${timeline.depTimeStr} → 예상 하산 ${timeline.descentFinishStr}. 실제 통제와 노면 상태도 확인하세요.`;

  const handleSharePlan = async () => {
    const mName = weatherData.region || mountainInfo?.name || '명산';
    const peak = mountainInfo?.peak ? `(${mountainInfo.peak} ${mountainInfo.elevation}m)` : '';
    const formattedGear = gearList.length > 0
      ? gearList.map(item => `${checklist[item] ? '☑️' : '⬜'} ${item}`).join('\n  ')
      : '없음';

    const arrivalWeatherLine = timeline.arrivalWeather.available
      ? `⛰️ 정상 도착(${timeline.summitArrivalStr}경 / ${timeline.arrivalWeather.forecastHour} 예보): ${timeline.arrivalWeather.temp}°C (체감 ${timeline.arrivalWeather.feelsLike}°C · ${timeline.arrivalWeather.description} · 강수확률 ${timeline.arrivalWeather.pop}%)`
      : `⛰️ 정상 도착(${timeline.summitArrivalStr}경): ${timeline.arrivalWeather.reason}`;

    const shareText = [
      `⛰️ [${mName} ${peak} 산행 기상 브리핑]`,
      `📅 출발: ${departureAt ? new Date(departureAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : weatherData.date}`,
      `📊 데이터 구분: 기온 ${weatherData?.weatherSources?.temperature || '고도 보정 추정값'} · 바람 ${weatherData?.weatherSources?.wind || '고도 보정 추정값'} · 습도 ${weatherData?.weatherSources?.humidity || '고도 보정 추정값'}`,
      ...(weatherData?.dataAsOf ? [`🕒 응답 생성 시각: ${weatherData.dataAsOf.replace('T', ' ')}`] : []),
      `🌤️ 기상 조건 점수(참고): ${weatherScore === null ? '자료 없음' : `${weatherScore}점`} (${weatherAssessment.status}) / 🔭 조망 환경 참고 점수: ${viewEstimate.score === null ? '자료 없음' : `${viewEstimate.score}점`} (${viewEstimate.gradeText})`,
      `⏱️ 시간 안전 판정: ${timeline.safetyBadge} (권장 하산 시작 ${safeDescentTime})`,
      `🥾 선택 코스: ${selectedCourse.name} (${selectedCourse.distance} · ${currentPaceObj.label} 총 ${Math.floor(adjustedTimeMins / 60)}시간 ${adjustedTimeMins % 60}분)`,
      `🕒 일정: ${timeline.depTimeStr} 출발 → ${timeline.summitArrivalStr} 정상 → ${timeline.descentFinishStr} 하산 완료`,
      'ℹ️ 정상 도착 시각은 전체 코스 시간의 55%를 오름 시간으로 가정한 참고 추정치입니다.',
      arrivalWeatherLine,
      ...courseRiskNotes.slice(0, 2).map(note => `⚠️ ${note}`),
      `📍 들머리 검색: ${getTrailheadQuery()}`,
      ...(officialTrailInfo ? [`🏞️ 공식 탐방 안내: ${officialTrailInfo.url}`] : []),
      `💧 권장 식수/열량: ${nutrition.waterText} / ${nutrition.kcalText}`,
      `🎒 맞춤 배낭 체크리스트:\n  ${formattedGear}`,
      `🔗 날씨 대시보드: ${window.location.href}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(shareText);
      if (onShowToast) onShowToast('📋 정상 도착 기상·안전 판정·체크리스트가 클립보드에 복사되었습니다!');
    } catch (err) {
      if (onShowToast) onShowToast('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const jumpTo = id => {
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    node.focus({ preventScroll: true });
  };
  const jumpPlanner = section => {
    setPlannerSection(section); setPreparationTab('account');
    requestAnimationFrame(() => jumpTo(document.getElementById('hiking-preparation') ? 'hiking-preparation' : 'hiking-planner'));
  };
  useEffect(() => {
    const open = () => { setPreparationTab('account'); requestAnimationFrame(() => jumpTo(document.getElementById('hiking-preparation') ? 'hiking-preparation' : 'hiking-planner')); };
    window.addEventListener('weather:open-hiking-planner', open);
    return () => window.removeEventListener('weather:open-hiking-planner', open);
  }, []);
  useEffect(() => {
    if (!isMountainMode || !hasWeatherData) return;
    const ids = ['hike-schedule', 'mountain-conditions', 'hiking-preparation'];
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setVisibleStep(visible[0].target.id);
    }, { rootMargin: '-100px 0px -45% 0px', threshold: 0 });
    ids.forEach(id => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [isMountainMode, hasWeatherData, isLoading]);
  const changeDeparture = value => {
    setDepartureDraft(departureInputValue(value)); setDepartureError(''); onRestoreDeparture?.(value);
  };
  const changeOffset = value => { setDepartureError(''); setDepOffset(value); };
  const editDeparture = value => {
    setDepartureDraft(value);
    const when = Date.parse(`${value}:00+09:00`);
    if (!value || !Number.isFinite(when) || when <= Date.now()) {
      setDepartureError('현재 이후의 출발 날짜와 시간을 선택해 주세요.'); return;
    }
    changeDeparture(new Date(when).toISOString());
  };
  const packedGearCount = gearList.filter(item => checklist[item]).length;
  const itineraryTime = minutes => {
    if (!departureAt) return '—';
    const date = new Date(Date.parse(departureAt) + minutes * 60000);
    const day = koreanDate(date) === koreanDate(departureAt) ? '' : '다음 날 ';
    return day + new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  };

  return (
    <div className={`glass-card hourly-forecast-card ${isMountainMode ? 'mountain-journey' : ''}`} style={{ borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', color: '#1e293b', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .hourly-chart-wrapper .recharts-surface { overflow: visible !important; }
        @media (max-width: 640px) {
          .mtn-score-altitude-box { flex-direction: column !important; }
          .mtn-left-top-row { flex-direction: column !important; }
          .mtn-dual-score-row { flex-direction: row !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: isMountainMode ? '#166534' : '#1e293b' }}>
            {isMountainMode ? '⛰️ 산악 기상 & 등산 환경 대시보드' : mountainInfo?.course_available === false ? '시간별 산 정상 기온 · 강수확률' : '시간별 날씨 · 기온과 강수확률'}
          </h4>
          <div style={{ marginTop: '3px', fontSize: '10.5px', color: '#64748b' }}>
            {isMountainMode || mountainInfo?.course_available === false ? '기상청 시간별 예보를 고도 보정한 산악 참고 추정값' : '기상청 동네예보 기준 · 강수확률은 시간대별 비 가능성입니다'}
          </div>
        </div>
        {!isMountainMode && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={handlePrev} disabled={prevDisabled} style={{ ...buttonStyle, opacity: prevDisabled ? 0.3 : 1, cursor: prevDisabled ? 'default' : 'pointer' }}><FiChevronLeft size={16} /></button>
            <button type="button" onClick={handleNext} disabled={nextDisabled} style={{ ...buttonStyle, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}><FiChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {isMountainMode && mountainInfo?.manual_course && <p role="note" style={{ color: '#92400e', fontSize: '13px' }}>직접 입력한 코스 기준입니다. 거리·시간·경로와 통제 여부는 공식 안내에서 확인하세요.</p>}
      {isMountainMode && <MountainQuickGuide />}
      {isMountainMode && <nav className="hike-flowbar mountain-shortcuts" aria-label="산행 준비 바로가기">
        <button type="button" onClick={() => jumpTo('mountain-picker')}>산 바꾸기</button>
        <button type="button" aria-current={visibleStep === 'hike-schedule' ? 'step' : undefined} disabled={!hasWeatherData} onClick={() => jumpTo('hike-schedule')}>① 일정</button>
        <button type="button" aria-current={visibleStep === 'mountain-conditions' ? 'step' : undefined} disabled={!hasWeatherData} onClick={() => jumpTo('mountain-conditions')}>② 조건</button>
        <button type="button" onClick={() => { setPreparationTab('gear'); requestAnimationFrame(() => jumpTo('hiking-preparation')); }} aria-current={visibleStep === 'hiking-preparation' ? 'step' : undefined} disabled={!hasWeatherData}>③ 준비</button>

      </nav>}
      {isMountainMode && hikingPlanSummary && <MountainPlanControls
        mountainName={mountainInfo?.name} onReview={() => jumpTo('mountain-conditions')}
        courses={courses} courseIndex={activeCourseIdx} onCourse={setCourseIdx} paces={PACE_OPTIONS} pace={activePace} onPace={setPace}
        departureDraft={departureDraft} departureError={departureError} onDepartureDraft={editDeparture} onDeparture={changeDeparture}
        onOffset={changeOffset} activeOffset={activeDepOffset} restoredDepartureAt={restoredDepartureAt} offsets={DEPARTURE_OFFSETS} getOffsetLabel={getDepartureOptionLabel}
        compareOpen={compareOpen} onCompareOpen={setCompareOpen} hourlyData={hourlyData} weatherData={weatherData} durationMinutes={adjustedTimeMins} departureAt={departureAt}
      />}
      {isMountainMode && (!hasWeatherData || isLoading) && <HikingPlannerPanel user={loggedInUser} mountainInfo={mountainInfo} selectedCourse={selectedCourse} courseIndex={activeCourseIdx} weatherDate={weatherData} selectedDateIdx={selectedDateIdx} pace={activePace} departureOffsetHours={activeDepOffset} departureTime="" gearList={[]} checklist={{}} canSave={false} onApplyPlan={handleApplySavedPlan} onRequireLogin={onRequireLogin} onShowToast={onShowToast} focusSection={plannerSection} />}

      {isMountainMode && hasWeatherData && !isLoading && (
        <div id="mountain-conditions" tabIndex={-1} className="mountain-safety" role={timeline.status === 'danger' ? 'alert' : 'status'} aria-live="polite" style={{
          display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', marginBottom: '12px',
          borderRadius: '10px', border: `1px solid ${timeline.safetyColor}55`,
          backgroundColor: timeline.safetyBg, color: timeline.safetyColor,
        }}>
          <strong style={{ flexShrink: 0, fontSize: '12px' }}>{timeline.safetyBadge}</strong>
          <span style={{ fontSize: '12px', lineHeight: '1.45', fontWeight: '700', wordBreak: 'keep-all' }}>{decisionSummary}</span>
        </div>
      )}

      {isMountainMode && hasWeatherData && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

          <div className="mountain-results" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'stretch' }}>

            <div className="mtn-score-altitude-box" style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              <div className="mtn-dual-score-row" style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(240,253,244,0.75)', borderRadius: '12px', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '800', marginBottom: '4px', whiteSpace: 'nowrap' }}>🌤️ 기상 조건 점수</span>
                  <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(22,163,74,0.2)" strokeWidth="4" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={weatherAssessment.color} strokeWidth="4" strokeDasharray={`${weatherScore ?? 0}, 100`} />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '14px', fontWeight: '800', color: '#064e3b' }}>{weatherScore ?? '—'}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#0f172a', marginTop: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {weatherAssessment.status}
                  </span>
                </div>

                <div style={{ flex: 1.25, backgroundColor: 'rgba(240,249,255,0.8)', borderRadius: '12px', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(2,132,199,0.2)' }}>
                  <span style={{ fontSize: '10.5px', color: '#0369a1', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <FiEye size={12} /> 조망 환경 참고 점수
                  </span>
                  <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(2,132,199,0.2)" strokeWidth="4" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={viewEstimate.gradeColor} strokeWidth="4" strokeDasharray={`${viewEstimate.score ?? 0}, 100`} />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '14px', fontWeight: '800', color: '#0c4a6e' }}>{viewEstimate.score ?? '—'}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: viewEstimate.gradeColor, marginTop: '6px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                    {viewEstimate.gradeText}
                  </span>
                </div>
              </div>

              {hikingPlanSummary?.scoreBasisLabel && (
                <div className="mountain-score-basis" style={{ width: '100%', color: '#64748b', fontSize: '10.5px', lineHeight: 1.45, textAlign: 'center', padding: '0 4px' }}>
                  ⏱️ {hikingPlanSummary.scoreBasisLabel}
                  {(hikingPlanSummary.weatherWorstTime || hikingPlanSummary.viewWorstTime) && (
                    <span> · 기상 최저 {hikingPlanSummary.weatherWorstTime || '—'} / 조망 최저 {hikingPlanSummary.viewWorstTime || '—'}</span>
                  )}
                </div>
              )}

              {viewEstimate.seaOfCloudsHint && <div style={{ color: '#0369a1', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>{viewEstimate.seaOfCloudsHint}</div>}
              <MountainInfo label="점수 판단 근거와 한계">
                {hikingPlanSummary?.scoreBasisLabel && <div><strong>선택 일정 반영:</strong> {hikingPlanSummary.scoreBasisLabel}</div>}
                <div><strong>기상 조건:</strong> {weatherAssessment.reasons.join(' · ') || weatherAssessment.status}</div>
                <div><strong>조망 참고:</strong> {viewEstimate.summaryReason}</div>
                <div>오늘 산행은 출발부터 예상 하산까지 시간별 예보 중 가장 낮은 점수를 표시합니다. 시간별 예보가 부족하면 사용 가능한 구간만 반영합니다. 선택일이 미래면 일 단위 예보만 반영되어 출발 시각별 차이는 계산하지 않습니다.</div>
                <div>두 점수는 기상 요소를 바탕으로 한 참고 지표입니다. 산행 허가나 안전을 보증하지 않으며, 조망 점수도 실제 조망 확률이 아닙니다. 운고·실측 시정·노면 상태는 반영되지 않을 수 있습니다.</div>
              </MountainInfo>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', fontSize: '11.5px' }}>
                <strong style={{ fontSize: '12px', color: '#334155' }}>{isFuture ? '선택일 고도별 기온' : '현재 고도별 기온'} <span className="mountain-reference-label">참고 추정</span></strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                  <span style={{ fontWeight: '800', color: '#1e293b' }}>⛰️ 정상 <span style={{fontSize:'10px', color:'#475569', fontWeight:'normal'}}>({mountainInfo?.elevation}m)</span></span>
                  <span style={{ color: '#0f172a', fontWeight: '800' }}>{currentTemp}°C <span style={{fontSize:'10px', color:'#475569', fontWeight:'normal'}}>(체감 {summitFeelsLike}°C)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>🌲 중턱 <span style={{fontSize:'10px', color:'#64748b', fontWeight:'normal'}}>({Math.round((mountainInfo?.elevation || 800) / 2)}m)</span></span>
                  <span style={{ color: '#334155', fontWeight: '600' }}>{Math.round((currentTemp + baseTemp) / 2)}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>👟 들머리 <span style={{fontSize:'10px', color:'#64748b', fontWeight:'normal'}}>(입구)</span></span>
                  <span style={{ color: '#334155', fontWeight: '600' }}>{baseTemp}°C</span>
                </div>
                <MountainInfo label="출처·고도 보정 방식">
                  <div>기온은 고도 100m당 약 0.65°C 하강하는 기준을 반영하고, 정상 풍속은 {wind}m/s입니다.</div>
                  <div>기온: {weatherData?.weatherSources?.temperature || '고도 보정 추정값'} · 바람: {weatherData?.weatherSources?.wind || '고도 보정 추정값'} · 습도: {weatherData?.weatherSources?.humidity || '고도 보정 추정값'}</div>
                  {weatherData?.dataAsOf && <div>자료 응답 시각: {weatherData.dataAsOf.replace('T', ' ')}</div>}
                  <div>{weatherData?.dataNote || '정상 실측값이 없는 항목은 고도 보정 추정값일 수 있습니다.'}</div>
                </MountainInfo>
              </div>
            </div>

            <div className="mountain-route-result" style={{ flex: '1.15 1 290px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div className="mountain-section-heading"><h3>예상 산행 일정</h3><span>총 {Math.floor(adjustedTimeMins / 60)}시간{adjustedTimeMins % 60 ? ` ${adjustedTimeMins % 60}분` : ''}</span></div>
              <ol className="mountain-itinerary" aria-label="예상 출발·정상·하산 시간">
                <li><span>출발</span><strong>{itineraryTime(0)}</strong></li>
                <li><span>정상 도착</span><strong>{itineraryTime(ascentTimeMins)}</strong></li>
                <li><span>하산 완료</span><strong>{itineraryTime(adjustedTimeMins)}</strong></li>
              </ol>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                <span>거리: <strong>{selectedCourse.distance}</strong></span>
                <span>난이도: <strong style={{ color: selectedCourse.diff.includes('상') ? '#dc2626' : '#16a34a' }}>{selectedCourse.diff}</strong></span>
                <span>열량: <strong>🍫 {nutrition.kcalText}</strong></span>
                <span style={{ gridColumn: 'span 2', color: '#0369a1', fontWeight: '600' }}>
                  💧 권장 식수: <strong>{nutrition.waterText}</strong>
                </span>
              </div>

              <div style={{ backgroundColor: 'rgba(239,246,255,0.85)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '800', color: '#1e3a8a' }}>
                    ⛰️ 정상 도착 무렵 예보
                  </span>
                  <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>
                    {timeline.status !== 'planning' && safeDescentTime ? `하산 시작 권장 ${safeDescentTime}` : '날짜별 일몰 확인 필요'}
                  </span>
                </div>
                {timeline.arrivalWeather.available ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px', color: '#1e293b', fontWeight: '700' }}>
                    <span>
                      {getEmojiIcon(timeline.arrivalWeather.icon)} {timeline.arrivalWeather.forecastHour}: <strong>{timeline.arrivalWeather.temp}°C</strong> (체감 {timeline.arrivalWeather.feelsLike}°C)
                    </span>
                    <span style={{ color: timeline.arrivalWeather.pop >= 30 ? '#2563eb' : '#475569' }}>
                      {timeline.arrivalWeather.description} · 💧{timeline.arrivalWeather.pop}%
                    </span>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '10.5px', fontWeight: '600' }}>
                    ℹ️ {timeline.arrivalWeather.reason}
                  </div>
                )}
              </div>

              <MountainInfo label="정상 도착 시각 산정 기준">
                정상 도착 시각은 전체 코스 시간의 55%를 오름 시간으로 계산한 참고 추정치입니다. 실제 소요 시간은 체력, 휴식, 노면과 코스 상황에 따라 달라집니다.
              </MountainInfo>
              <MountainInfo label="일출 산행을 계획한다면">
                {timeline.status === 'planning' ? '선택한 날짜의 일출 시간과 입산 가능 시간을 먼저 확인하세요.' : `선택 날짜의 계산된 일출은 ${sunrise}입니다. 선택 코스의 정상까지 약 ${Math.floor(ascentTimeMins / 60)}시간 ${ascentTimeMins % 60}분에 휴식 여유를 더해 출발 시간을 정하세요.`}
                <div>야간 입산 허용 여부를 확인하고 헤드랜턴·여분 배터리·보온 의류를 준비하세요. 위 시간 주의 안내는 선택한 실제 일정에 적용됩니다.</div>
              </MountainInfo>
              {courseRiskNotes.length > 0 && (
                <div style={{ backgroundColor: 'rgba(255,247,237,0.8)', border: '1px solid rgba(249,115,22,0.22)', borderRadius: '8px', padding: '9px 10px', marginBottom: '8px', color: '#9a3412', fontSize: '12px', lineHeight: '1.5' }}>
                  <strong style={{ display: 'block', marginBottom: '3px' }}>코스·기상 유의사항</strong>
                  {courseRiskNotes.slice(0, 2).map((note, index) => <div key={index}>• {note}</div>)}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={(e) => handleOpenMap('kakao', e)}
                  style={{
                    flex: 1, padding: '7px 8px', borderRadius: '8px', border: '1px solid #eab308',
                    backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '11.5px', fontWeight: '800',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FiMapPin size={12} /> {selectedCourse.manual ? '카카오맵 산 검색' : '카카오맵 들머리'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleOpenMap('naver', e)}
                  style={{
                    flex: 1, padding: '7px 8px', borderRadius: '8px', border: '1px solid #22c55e',
                    backgroundColor: '#dcfce7', color: '#166534', fontSize: '11.5px', fontWeight: '800',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FiMapPin size={12} /> {selectedCourse.manual ? '네이버지도 산 검색' : '네이버지도 들머리'}
                </button>
              </div>
              {officialTrailInfo && (
                <div style={{ marginTop: '7px' }}>
                  <a
                    href={officialTrailInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px',
                      padding: '7px 8px', borderRadius: '8px', border: '1px solid #94a3b8',
                      backgroundColor: 'rgba(248,250,252,0.9)', color: '#334155',
                      fontSize: '11px', fontWeight: '800', textDecoration: 'none',
                    }}
                  >
                    {officialTrailInfo.label} ↗
                  </a>
                  <div style={{ marginTop: '4px', color: '#64748b', fontSize: '9.5px', lineHeight: '1.4', textAlign: 'center' }}>
                    일출·일몰은 산 좌표 기준 계산값이며 지형과 현장 상황에 따라 다릅니다. 통제 상태도 출발 전에 확인하세요.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mountain-review-next"><span>점수는 참고값입니다. 시간 주의사항과 탐방로 통제도 확인하세요.</span><button type="button" onClick={() => { setPreparationTab('gear'); requestAnimationFrame(() => jumpTo('hiking-preparation')); }}>준비물 확인하기 ↓</button></div>
          <section id="hiking-preparation" className="mountain-preparation" tabIndex={-1} aria-label="산행 준비물과 일행 관리">
            <div className="mountain-preparation-tabs" role="tablist" aria-label="준비 방법" onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 'gear' : event.key === 'End' ? 'account' : preparationTab === 'gear' ? 'account' : 'gear'; setPreparationTab(next); document.getElementById(`${next}-tab`)?.focus(); }}>
              <button id="gear-tab" tabIndex={preparationTab === 'gear' ? 0 : -1} type="button" role="tab" aria-selected={preparationTab === 'gear'} aria-controls="gear-panel" onClick={() => setPreparationTab('gear')}>내 준비물 <span>{packedGearCount}/{gearList.length}</span></button>
              <button id="account-tab" tabIndex={preparationTab === 'account' ? 0 : -1} type="button" role="tab" aria-selected={preparationTab === 'account'} aria-controls="account-panel" onClick={() => setPreparationTab('account')}>계획 저장·일행{invitationCount > 0 && <span>초대 {invitationCount}</span>}</button>
            </div>
            <div id="gear-panel" className="mountain-gear-panel" role="tabpanel" aria-labelledby="gear-tab" hidden={preparationTab !== 'gear'}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', color: '#1e293b', fontWeight: '800' }}>
                  🎒 내 배낭 체크리스트
                </h4>
                <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: '500' }}>
                  준비한 물품을 체크하세요. 수정한 목록은 이 브라우저에 보관됩니다. 추천은 제공된 산행 시간대 예보를 참고합니다.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button type="button" onClick={() => { if (window.confirm('추가한 물품과 체크 상태를 지우고 기본 추천 목록으로 복원할까요?')) handleResetGear(); }} title="추천 목록으로 복원" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.8)', color: '#475569', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiRotateCcw size={12} /> 복원
                </button>
                <button onClick={handleSharePlan} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#166534', color: '#ffffff', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(22,101,52,0.3)' }}>
                  <FiShare2 size={12} /> 공유하기
                </button>
              </div>
            </div>

            {plannedRows.length > 0 && buildWeatherGearList().some(item => !gearList.includes(item)) && <div className="mountain-info-disclosure__content"><strong>현재 일정의 추가 추천</strong><p>기존 물품과 체크 상태는 유지됩니다. 필요한 항목만 추가하세요.</p>{buildWeatherGearList().filter(item => !gearList.includes(item)).map(item => <button key={item} type="button" onClick={() => updateGears([...gearList, item])}>＋ {item}</button>)}</div>}
            {!plannedRows.length && <p>선택한 산행 시간의 상세 예보가 없어 현재 기상 기준 추천을 표시합니다. 출발 전 다시 확인하세요.</p>}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <input type="text" aria-label="추가할 준비물" maxLength={120} placeholder="준비물 추가 (예: 보조배터리)" value={newGearInput} onChange={(e) => setNewGearInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddGear()} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '12.5px', outline: 'none', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.8)', fontWeight: '500' }} />
              <button type="button" onClick={handleAddGear} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#15803d', color: '#ffffff', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiPlus size={14} /> 추가
              </button>
            </div>

            {gearList.length === 0 ? (
              <p style={{ margin: '12px 0', fontSize: '12px', color: '#64748b', textAlign: 'center', fontWeight: '500' }}>
                체크리스트가 비어 있습니다.
              </p>
            ) : (
              <div className="mountain-gear-grid">
                {gearList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: checklist[item] ? '#94a3b8' : '#1e293b', fontWeight: '600', cursor: 'pointer', textDecoration: checklist[item] ? 'line-through' : 'none', userSelect: 'none', flex: 1, minWidth: 0 }}>
                      <input type="checkbox" checked={!!checklist[item]} onChange={() => toggleCheck(item)} style={{ cursor: 'pointer', accentColor: '#16a34a', width: '14px', height: '14px', flexShrink: 0 }} />
                      <span className="mountain-gear-name">{item}</span>
                    </label>
                    <button type="button" aria-label={`${item} 목록에서 삭제`} onClick={() => handleRemoveGear(item)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '4px', flexShrink: 0 }}>
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

            <div className="mountain-gear-next"><span>준비 완료 {packedGearCount} / {gearList.length}</span><button type="button" onClick={() => jumpPlanner('plan')}>이 일정 저장·일행 초대 →</button></div>
            </div>
            <div id="account-panel" role="tabpanel" aria-labelledby="account-tab" hidden={preparationTab !== 'account'}>
          {isMountainMode && (
            <HikingPlannerPanel
              onInvitationCountChange={setInvitationCount}
              user={loggedInUser}
              mountainInfo={mountainInfo}
              selectedCourse={courses[activeCourseIdx]}
              courseIndex={activeCourseIdx}
              weatherDate={weatherData}
              selectedDateIdx={selectedDateIdx}
              pace={activePace}
              departureOffsetHours={activeDepOffset}
              departureTime={timeline.depTimeStr}
              gearList={gearList}
              checklist={checklist}
              onApplyPlan={handleApplySavedPlan}
              onShowToast={onShowToast}
              onRequireLogin={onRequireLogin}
              canSave={hasWeatherData && !isStale && !departureError}
              focusSection={plannerSection}
              departureAt={departureAt}
            />
          )}
            </div>
          </section>
          {!isFuture && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed rgba(0,0,0,0.1)', paddingTop: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>시간대별 산 정상 기온 변화</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={handlePrev} disabled={prevDisabled} style={{ ...buttonStyle, opacity: prevDisabled ? 0.3 : 1, cursor: prevDisabled ? 'default' : 'pointer' }}><FiChevronLeft size={16} /></button>
                <button type="button" onClick={handleNext} disabled={nextDisabled} style={{ ...buttonStyle, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}><FiChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {isMountainMode && isFuture ? (
         <div style={{ textAlign: 'center', padding: '12px 0', color: '#475569', fontSize: '12.5px', fontWeight: '600' }}>
            미래 예보일은 시간대별 상세 기온 변화 차트가 제공되지 않습니다.
         </div>
      ) : isLoading ? (
        <div role="status" aria-live="polite" style={{ margin: '8px 0', color: '#475569' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>예보를 불러오는 중입니다...</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.5, color: '#64748b' }}>
            서버가 절전 상태였다면 첫 응답에 50초 이상 걸릴 수 있어요. 잠시 기다려 주세요.
          </p>
        </div>
      ) : error ? (
        <div role="alert" style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', color: '#b42318', background: 'rgba(254,242,242,.85)', border: '1px solid rgba(248,113,113,.35)', borderRadius: '10px', padding: '10px 12px' }}>
          <span style={{ fontSize: '13px', lineHeight: 1.5 }}>{error}</span>
          {onRetry && <button type="button" onClick={onRetry} style={{ flex: 'none', border: 0, borderRadius: '8px', background: '#b42318', color: 'white', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}>다시 시도</button>}
        </div>
      ) : forecastData.length === 0 ? (
        <p style={{ margin: '8px 0', fontSize: '13px', color: '#475569' }}>예보 데이터가 없습니다.</p>
      ) : (
        <div className="hourly-chart-wrapper" style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${(visibleIndex / forecastData.length) * 100}%)`, width: `${(forecastData.length / ITEMS_TO_SHOW) * 100}%`, position: 'relative' }}>

            <div style={{ position: 'absolute', top: '68px', left: 0, right: 0, height: '100px', zIndex: 1, padding: `0 ${100 / (2 * forecastData.length)}%`, boxSizing: 'border-box' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 28, bottom: 16, left: 0, right: 0 }}>
                  <YAxis domain={[yMin, yMax]} allowDataOverflow={true} hide />
                  <Line type="monotone" dataKey="plotTemp" stroke={isMountainMode ? "#16a34a" : "#0284c7"} strokeWidth={3} dot={{ r: 4, fill: '#ffffff', stroke: isMountainMode ? "#16a34a" : "#0284c7", strokeWidth: 2 }} label={(props) => <CustomLabel {...props} value={forecastData[props.index]?.tempNum} />} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
              {forecastData.map((item) => (
                <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#475569', height: '18px', lineHeight: '18px', marginBottom: '6px', fontWeight: '600' }}>{item.time}</span>
                  <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{getEmojiIcon(item.icon)}</div>
                  <div style={{ height: '100px', marginBottom: '6px' }}></div>
                  <span style={{ fontSize: '11.5px', color: item.pop > 0 ? '#2563eb' : '#94a3b8', fontWeight: item.pop > 0 ? '800' : '600', minHeight: '16px' }}>💧 {item.pop ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HourlyForecast;
