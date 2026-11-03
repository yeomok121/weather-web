import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiShare2, FiPlus, FiX, FiRotateCcw, FiMapPin, FiClock, FiEye } from 'react-icons/fi';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { getEmojiIcon } from './WeeklyForecast';

const ITEMS_TO_SHOW = 6;
const EMPTY_HOURLY = [];

export const PACE_OPTIONS = [
  { key: 'slow', label: '🐢 초보(여유)', multiplier: 1.3 },
  { key: 'normal', label: '🥾 보통(표준)', multiplier: 1.0 },
  { key: 'fast', label: '⚡ 숙련(빠름)', multiplier: 0.85 },
];

const DEPARTURE_OFFSETS = [
  { value: 0, label: '지금 바로 출발' },
  { value: 1, label: '1시간 뒤 출발' },
  { value: 2, label: '2시간 뒤 출발' },
  { value: 3, label: '3시간 뒤 출발' },
  { value: 4, label: '4시간 뒤 출발' },
  { value: 6, label: '6시간 뒤 출발' },
  { value: 9, label: '9시간 뒤 출발' },
  { value: 12, label: '12시간 뒤 출발' },
];

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const CustomLabel = ({ x, y, value }) => (
  <text x={x} y={y - 12} fill="#1e293b" fontSize="14" fontWeight="bold" textAnchor="middle">
    {value}°
  </text>
);

function HourlyForecast({
  hourlyData = EMPTY_HOURLY,
  isLoading = false,
  error = '',
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
  onGearListChange
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localCourseIdx, setLocalCourseIdx] = useState(0);
  const [localPaceType, setLocalPaceType] = useState('normal');
  const [localDepOffset, setLocalDepOffset] = useState(0);
  const [timelineMode, setTimelineMode] = useState('descent');
  
  const [gearList, setGearList] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [newGearInput, setNewGearInput] = useState('');
  
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false); 
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const activeCourseIdx = onSelectCourseIdx ? selectedCourseIdx : localCourseIdx;
  const setCourseIdx = onSelectCourseIdx || setLocalCourseIdx;
  const activePace = onSelectPaceType ? paceType : localPaceType;
  const setPace = onSelectPaceType || setLocalPaceType;
  const activeDepOffset = onSelectDepartureOffset ? departureOffsetHours : localDepOffset;
  const setDepOffset = onSelectDepartureOffset || setLocalDepOffset;

  const temp = Number(weatherData?.temp || 0);
  const baseTemp = Number(weatherData?.baseTemp ?? (temp + 5));
  const wind = Number(weatherData?.wind_speed || 0);
  const humidity = Number(weatherData?.humidity || 50);
  const dustStr = weatherData?.dust || '';
  const pm25Match = dustStr.match(/\d+/);
  const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
  const desc = weatherData?.condition || '';
  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || (weatherData?.targetPop >= 60);
  const isSnow = desc.includes('눈');
  const sunrise = weatherData?.sunrise || '06:30';
  const sunset = weatherData?.sunset || '18:00';
  const safeDescentTime = weatherData?.safeDescentTime || mountainInfo?.safe_descent_time || '15:30';
  const terrain = mountainInfo?.terrain || '';
  const isFuture = weatherData?.isFuture || false;

  const summitFeelsLike = temp <= 15 ? Math.round(temp - (wind * 0.7)) : temp;

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
    const waterNote = temp <= 5 ? ' (보온병 온수 500ml 포함)' : temp >= 24 ? ' (이온음료·얼음물 권장)' : '';

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

  const getTrailheadQuery = () => {
    if (selectedCourse.trailhead) return selectedCourse.trailhead;
    const mName = weatherData?.region || mountainInfo?.name || '북한산';
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
    
    if (timelineMode === 'ascent' && isMountainMode) {
      if (!items.includes('헤드랜턴 (여분 배터리)')) items.push('헤드랜턴 (여분 배터리)');
      if (temp <= 10 && !items.includes('방한모 및 넥워머')) items.push('새벽 칼바람 대비 보온의류');
    }
    return items;
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [hourlyData]);

  useEffect(() => {
    const defaultGears = buildWeatherGearList();
    setGearList(defaultGears);
    setChecklist({});
    if (onGearListChange) onGearListChange(defaultGears);
  }, [mountainInfo?.name, weatherData?.date, temp, wind, isRainOrSnow, terrain, timelineMode, activeCourseIdx, activePace]);

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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    if (Math.abs(walk) > 5) setDragMoved(true); 
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const rawForecastData = Array.isArray(hourlyData)
    ? hourlyData.filter(item => item && typeof item === 'object').map((item, index) => {
        const t = toNumber(item.temp);
        const pop = toNumber(item.pop);
        return {
          id: index,
          time: item.time || '시간 없음',
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
    background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
    display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#1e293b', transition: 'background-color 0.2s',
  };

  // 💡 [원칙 1] 기상 적합도는 순수 기상 데이터(강수·풍속·기온·미세먼지)만으로 산출
  const getWeatherSuitabilityScore = () => {
    let s = 100;
    if (isRainOrSnow) s -= 40;
    if (wind >= 10) s -= 30;
    else if (wind >= 6) s -= 15;
    if (temp <= -10 || temp >= 33) s -= 20;
    else if (temp <= -3 || temp >= 28) s -= 10;
    if (pm25 >= 75) s -= 15;
    else if (pm25 >= 36) s -= 5;
    return Math.max(0, s);
  };
  const weatherScore = getWeatherSuitabilityScore();

  // 💡 [원칙 3] 확보 가능한 데이터(하늘상태, 강수확률, 습도, PM2.5, 풍속)만 활용한 정상 조망 추정 지수
  const getSummitViewEstimate = () => {
    let vScore = 95;
    const reasons = [];

    if (isRainOrSnow) {
      vScore -= 45;
      reasons.push('우천/강설 시야 저하');
    } else if (desc.includes('흐림')) {
      vScore -= 25;
      reasons.push('흐린 하늘');
    } else if (desc.includes('구름')) {
      vScore -= 12;
      reasons.push('구름 많음');
    } else {
      reasons.push('하늘 맑음');
    }

    if (humidity >= 85) {
      vScore -= 25;
      reasons.push(`고습도(${humidity}%) 산안개 가능성`);
    } else if (humidity >= 75) {
      vScore -= 12;
      reasons.push(`습도(${humidity}%) 다소 높음`);
    } else {
      reasons.push(`습도(${humidity}%) 양호`);
    }

    if (pm25 >= 75) {
      vScore -= 30;
      reasons.push(`초미세먼지 매우나쁨(${pm25})`);
    } else if (pm25 >= 36) {
      vScore -= 18;
      reasons.push(`초미세먼지 나쁨(${pm25})`);
    } else if (pm25 <= 15) {
      reasons.push(`대기 청정(PM2.5 ${pm25})`);
    }

    vScore = Math.max(10, Math.min(100, vScore));

    // 운해 가능성 보조 판단 (습도 80% 이상 + 바람 3.5m/s 이하 + 비 안 옴)
    const seaOfCloudsHint = (!isRainOrSnow && humidity >= 80 && wind <= 3.5)
      ? '🌊 고습도·약풍 조건으로 이른 아침 운해 형성 가능성 있음'
      : null;

    let gradeText = '조망 양호 추정';
    let gradeColor = '#0284c7';
    if (vScore < 45) {
      gradeText = '시야 불량(곰탕) 주의';
      gradeColor = '#dc2626';
    } else if (vScore < 70) {
      gradeText = '보통 (박무·구름 참고)';
      gradeColor = '#d97706';
    }

    return {
      score: vScore,
      gradeText,
      gradeColor,
      summaryReason: reasons.slice(0, 2).join(' · '),
      seaOfCloudsHint
    };
  };
  const viewEstimate = getSummitViewEstimate();

  // 💡 [원칙 1 & 2] 시간 안전 판정 및 정상 도착 시점의 시간별 예보 매칭
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

    const now = new Date();
    const baseNowMins = now.getHours() * 60 + now.getMinutes();
    const depMins = isFuture ? (8 + activeDepOffset) * 60 : baseNowMins + (activeDepOffset * 60);
    const summitArrivalMins = depMins + ascentTimeMins;
    const descentFinishMins = depMins + adjustedTimeMins;

    const depTimeStr = formatTime(depMins);
    const summitArrivalStr = formatTime(summitArrivalMins);
    const descentFinishStr = formatTime(descentFinishMins);

    // 정상 도착 시점의 시간별 예보 매칭 (오늘 + 24시간 이내일 때만 실제 매칭)
    let arrivalWeather = { available: false, reason: '예측 불가 (상세 시간별 예보 범위 초과)' };
    if (isFuture) {
      arrivalWeather = { available: false, reason: '예측 불가 (미래 일자는 시간별 예보 미제공 · 주간 예보 참고)' };
    } else if (Array.isArray(rawForecastData) && rawForecastData.length > 0) {
      const hoursUntilSummit = activeDepOffset + Math.round(ascentTimeMins / 60);
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

    if (timelineMode === 'ascent') {
      const sunriseMins = parseTime(sunrise, 390);
      let reqDepMins = sunriseMins - ascentTimeMins;
      let isPrevDay = false;
      if (reqDepMins < 0) {
        reqDepMins += 1440;
        isPrevDay = true;
      }
      const reqDepStr = `${isPrevDay ? '전날 ' : ''}${formatTime(reqDepMins)}`;
      return {
        status: 'sunrise',
        safetyBadge: '🌅 일출 산행 계획',
        safetyColor: '#c2410c',
        safetyBg: 'rgba(255,247,237,0.9)',
        deadlineStr: reqDepStr,
        depTimeStr,
        summitArrivalStr,
        descentFinishStr,
        arrivalWeather,
        msg: `🌅 일출(${sunrise}) 정상 조망 목표: 늦어도 ${reqDepStr}에 들머리에서 출발하세요. (정상 등정 약 ${Math.floor(ascentTimeMins / 60)}시간 ${ascentTimeMins % 60}분 소요)`
      };
    }

    const safeDescentMins = parseTime(safeDescentTime, 930);
    const sunsetMins = parseTime(sunset, 1080);
    const deadlineMins = safeDescentMins - adjustedTimeMins;
    const deadlineStr = formatTime(deadlineMins);

    if (isFuture) {
      return {
        status: 'safe',
        safetyBadge: '🗓️ 일정 사전 계획',
        safetyColor: '#166534',
        safetyBg: 'rgba(240,253,244,0.9)',
        deadlineStr,
        depTimeStr,
        summitArrivalStr,
        descentFinishStr,
        arrivalWeather,
        msg: `🗓️ ${weatherData.date} 안전 하산 권장 출발 마감: 늦어도 ${deadlineStr} 이전 출발 (안전 하산 완료 ${safeDescentTime} 기준)`
      };
    }

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
        msg: `🚨 [시간 안전 경고] ${depTimeStr} 출발 시 하산 완료(${descentFinishStr})가 일몰(${sunset}) 이후입니다. 기상이 좋아도 주간 산행은 비추천합니다.`
      };
    }

    if (descentFinishMins > safeDescentMins) {
      return {
        status: 'warning',
        safetyBadge: '⚠️ 시간 안전: 주의 (권장 마감 경과)',
        safetyColor: '#b45309',
        safetyBg: 'rgba(254,252,232,0.9)',
        deadlineStr,
        depTimeStr,
        summitArrivalStr,
        descentFinishStr,
        arrivalWeather,
        msg: `⚠️ [시간 주의] ${depTimeStr} 출발 시 예상 하산 완료는 ${descentFinishStr}입니다. 권장 출발 마감(${deadlineStr})이 지났으니 헤드랜턴을 필히 지참하세요.`
      };
    }

    return {
      status: 'safe',
      safetyBadge: '✅ 시간 안전: 양호 (일몰 전 하산)',
      safetyColor: '#166534',
      safetyBg: 'rgba(240,253,244,0.9)',
      deadlineStr,
      depTimeStr,
      summitArrivalStr,
      descentFinishStr,
      arrivalWeather,
      msg: `✅ [시간 안전 확인] ${depTimeStr} 출발 시 약 ${summitArrivalStr} 정상 도착, 일몰(${sunset}) 전인 ${descentFinishStr}경 안전 하산 가능합니다.`
    };
  };
  const timeline = getTimelineAndSummitArrival();

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
      `📅 일자: ${weatherData.date}`,
      `🌤️ 기상 적합도: ${weatherScore}점 / 🔭 조망 추정: ${viewEstimate.score}점 (${viewEstimate.gradeText})`,
      `⏱️ 시간 안전 판정: ${timeline.safetyBadge}`,
      `🥾 선택 코스: ${selectedCourse.name} (${selectedCourse.distance} · ${currentPaceObj.label} 총 ${Math.floor(adjustedTimeMins / 60)}시간 ${adjustedTimeMins % 60}분)`,
      `🕒 일정: ${timeline.depTimeStr} 출발 → ${timeline.summitArrivalStr} 정상 → ${timeline.descentFinishStr} 하산 완료`,
      arrivalWeatherLine,
      `📍 들머리 검색: ${getTrailheadQuery()}`,
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

  return (
    <div className="glass-card" style={{ borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', color: '#1e293b', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .hourly-chart-wrapper .recharts-surface { overflow: visible !important; }
        @media (max-width: 640px) {
          .mtn-score-altitude-box { flex-direction: column !important; }
          .mtn-left-top-row { flex-direction: column !important; }
          .mtn-dual-score-row { flex-direction: row !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: isMountainMode ? '#166534' : '#1e293b' }}>
          {isMountainMode ? '⛰️ 산악 기상 & 등산 환경 대시보드' : '시간대별 예보 (기온 변화)'}
        </h4>
        {!isMountainMode && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={handlePrev} disabled={prevDisabled} style={{ ...buttonStyle, opacity: prevDisabled ? 0.3 : 1, cursor: prevDisabled ? 'default' : 'pointer' }}><FiChevronLeft size={20} /></button>
            <button type="button" onClick={handleNext} disabled={nextDisabled} style={{ ...buttonStyle, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}><FiChevronRight size={20} /></button>
          </div>
        )}
      </div>

      {isMountainMode && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
            
            {/* 좌측 컬럼: ① 기상 적합도 & 정상 조망 추정 지수 + ② 고도별 기온(기온감률 설명) + ③ 체감/노면 */}
            <div className="mtn-score-altitude-box" style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 💡 기상 적합도(순수 날씨) + 정상 조망 추정 지수 듀얼 카드 */}
              <div className="mtn-dual-score-row" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(240,253,244,0.75)', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <span style={{ fontSize: '11px', color: '#166534', fontWeight: '800', marginBottom: '6px', whiteSpace: 'nowrap' }}>🌤️ 기상 적합도 (날씨만)</span>
                  <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(22,163,74,0.2)" strokeWidth="4" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={weatherScore >= 70 ? "#16a34a" : weatherScore >= 40 ? "#eab308" : "#dc2626"} strokeWidth="4" strokeDasharray={`${weatherScore}, 100`} />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '16px', fontWeight: '800', color: '#064e3b' }}>{weatherScore}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#0f172a', marginTop: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {weatherScore >= 80 ? '기상 매우 쾌적' : weatherScore >= 60 ? '기상 무난함' : '악천후 주의'}
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', textAlign: 'center' }}>
                    *하산 시간 조건 별도
                  </span>
                </div>

                {/* 💡 정상 조망 추정 지수 카드 */}
                <div style={{ flex: 1.25, backgroundColor: 'rgba(240,249,255,0.8)', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(2,132,199,0.2)' }}>
                  <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <FiEye size={12} /> 정상 조망 추정 지수
                  </span>
                  <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(2,132,199,0.2)" strokeWidth="4" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={viewEstimate.gradeColor} strokeWidth="4" strokeDasharray={`${viewEstimate.score}, 100`} />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '16px', fontWeight: '800', color: '#0c4a6e' }}>{viewEstimate.score}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: viewEstimate.gradeColor, marginTop: '6px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                    {viewEstimate.gradeText}
                  </span>
                  <span style={{ fontSize: '10px', color: '#475569', marginTop: '2px', textAlign: 'center', wordBreak: 'keep-all' }}>
                    {viewEstimate.summaryReason}
                  </span>
                </div>
              </div>

              {/* 💡 조망 추정치 데이터 한계 고지 & 운해 힌트 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: '10px', padding: '8px 10px', fontSize: '10.5px', color: '#475569', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                {viewEstimate.seaOfCloudsHint && (
                  <div style={{ color: '#0369a1', fontWeight: 'bold', marginBottom: '3px' }}>{viewEstimate.seaOfCloudsHint}</div>
                )}
                <span>※ 본 조망 지수는 운고(구름 높이)·실측 가시거리 데이터가 제외된 <strong>습도·하늘상태·미세먼지(PM2.5) 기반 추정치</strong>로 실제 정상 시야와 다를 수 있습니다.</span>
              </div>

              {/* 💡 고도별 3단 기온 비교 + 기온 감률 설명 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                  <span style={{ fontWeight: '800', color: '#1e293b' }}>⛰️ 정상 <span style={{fontSize:'10.5px', color:'#475569', fontWeight:'normal'}}>({mountainInfo?.elevation}m)</span></span>
                  <span style={{ color: '#0f172a', fontWeight: '800' }}>{temp}°C <span style={{fontSize:'10.5px', color:'#475569', fontWeight:'normal'}}>(체감 {summitFeelsLike}°C)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>🌲 중턱 <span style={{fontSize:'10.5px', color:'#64748b', fontWeight:'normal'}}>({Math.round((mountainInfo?.elevation || 800) / 2)}m)</span></span>
                  <span style={{ color: '#334155', fontWeight: '600' }}>{Math.round((temp + baseTemp) / 2)}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '3px' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>👟 들머리 <span style={{fontSize:'10.5px', color:'#64748b', fontWeight:'normal'}}>(평지 입구)</span></span>
                  <span style={{ color: '#334155', fontWeight: '600' }}>{baseTemp}°C</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 8px', borderRadius: '6px', marginTop: '2px', wordBreak: 'keep-all' }}>
                  💡 고도가 100m 높아질 때마다 기온이 약 0.65°C씩 하강하며, 정상 능선 풍속({wind}m/s)으로 인해 체감온도는 평지보다 훨씬 낮습니다.
                </div>
              </div>
            </div>

            {/* 우측 컬럼: 코스별 타임라인 + 출발 시간 선택 + 정상 도착 시점 기상 예측 */}
            <div style={{ flex: '1.15 1 310px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>⏱️ 코스 & 정상 도착 기상 예측</span>
                <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.6)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <button
                    onClick={() => setTimelineMode('descent')}
                    style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: timelineMode === 'descent' ? '#ffffff' : 'transparent', color: timelineMode === 'descent' ? '#1d4ed8' : '#64748b', boxShadow: timelineMode === 'descent' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                  >
                    🌇 일몰/하산
                  </button>
                  <button
                    onClick={() => setTimelineMode('ascent')}
                    style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: timelineMode === 'ascent' ? '#ffffff' : 'transparent', color: timelineMode === 'ascent' ? '#c2410c' : '#64748b', boxShadow: timelineMode === 'ascent' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                  >
                    🌅 일출/등산
                  </button>
                </div>
              </div>
              
              <div 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', WebkitOverflowScrolling: 'touch' }} 
                className="no-scrollbar"
              >
                {courses.map((c, idx) => (
                  <button 
                    key={idx} 
                    onClick={(e) => {
                      if (dragMoved) { e.preventDefault(); e.stopPropagation(); return; }
                      setCourseIdx(idx);
                    }}
                    style={{
                      flexShrink: 0, padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      border: activeCourseIdx === idx ? '1px solid #2563eb' : '1px solid rgba(0,0,0,0.1)',
                      background: activeCourseIdx === idx ? '#eff6ff' : 'rgba(255,255,255,0.8)',
                      color: activeCourseIdx === idx ? '#1d4ed8' : '#475569',
                      transition: 'all 0.2s', userSelect: 'none'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* 걸음 속도 & 출발 예정 시각 선택 바 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px', backgroundColor: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>걸음 속도:</span>
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    {PACE_OPTIONS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPace(p.key)}
                        style={{
                          flex: 1, padding: '4px 2px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer',
                          border: activePace === p.key ? '1px solid #16a34a' : '1px solid transparent',
                          backgroundColor: activePace === p.key ? '#dcfce7' : 'rgba(255,255,255,0.7)',
                          color: activePace === p.key ? '#166534' : '#64748b',
                          transition: 'all 0.15s', whiteSpace: 'nowrap', letterSpacing: '-0.3px'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 💡 출발 예정 시각 선택 드롭다운 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <FiClock size={11} /> 출발 시각:
                  </span>
                  <select
                    value={activeDepOffset}
                    onChange={(e) => setDepOffset(Number(e.target.value))}
                    style={{
                      flex: 1, padding: '4px 8px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '6px',
                      border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#ffffff', color: '#1e293b', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    {DEPARTURE_OFFSETS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {isFuture ? `오전 08:00 기준 +${opt.value}시간 뒤` : opt.label} ({timeline.depTimeStr} 출발)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11.5px', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.7)', padding: '9px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                <span>거리: <strong>{selectedCourse.distance}</strong></span>
                <span>총 소요: <strong>{Math.floor(adjustedTimeMins / 60)}시간 {adjustedTimeMins % 60 > 0 ? `${adjustedTimeMins % 60}분` : ''}</strong></span>
                <span>난이도: <strong style={{ color: selectedCourse.diff.includes('상') ? '#dc2626' : '#16a34a' }}>{selectedCourse.diff}</strong></span>
                <span>열량: <strong>🍫 {nutrition.kcalText}</strong></span>
                <span style={{ gridColumn: 'span 2', color: '#0369a1', fontWeight: '600' }}>
                  💧 권장 식수: <strong>{nutrition.waterText}</strong>
                </span>
              </div>

              {/* 💡 [원칙 2] 정상 도착 예상 시점의 시간별 예보 매칭 박스 */}
              <div style={{ backgroundColor: 'rgba(239,246,255,0.85)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '9px 11px', marginBottom: '8px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '800', color: '#1e3a8a' }}>
                    ⛰️ 정상 도착 시점 예보 ({timeline.summitArrivalStr}경)
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600' }}>
                    등정 편도 약 {Math.floor(ascentTimeMins / 60)}시간 {ascentTimeMins % 60}분
                  </span>
                </div>
                {timeline.arrivalWeather.available ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', color: '#1e293b', fontWeight: '700' }}>
                    <span>
                      {getEmojiIcon(timeline.arrivalWeather.icon)} {timeline.arrivalWeather.forecastHour} 예보: <strong>{timeline.arrivalWeather.temp}°C</strong> (체감 {timeline.arrivalWeather.feelsLike}°C)
                    </span>
                    <span style={{ color: timeline.arrivalWeather.pop >= 30 ? '#2563eb' : '#475569' }}>
                      {timeline.arrivalWeather.description} · 💧강수 {timeline.arrivalWeather.pop}%
                    </span>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>
                    ℹ️ {timeline.arrivalWeather.reason}
                  </div>
                )}
              </div>

              {/* 💡 [원칙 1] 기상 적합도와 분리된 시간 안전 판정 박스 */}
              <div style={{ fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', padding: '8px 10px', borderRadius: '8px', wordBreak: 'keep-all', lineHeight: '1.4', marginBottom: '8px',
                backgroundColor: timeline.safetyBg,
                color: timeline.safetyColor,
                border: `1px solid ${timeline.safetyColor}30`
              }}>
                {timeline.msg}
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onPointerDown={(e) => handleOpenMap('kakao', e)}
                  style={{
                    flex: 1, padding: '7px 8px', borderRadius: '8px', border: '1px solid #eab308',
                    backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '11.5px', fontWeight: '800',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FiMapPin size={12} /> 카카오맵 들머리
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => handleOpenMap('naver', e)}
                  style={{
                    flex: 1, padding: '7px 8px', borderRadius: '8px', border: '1px solid #22c55e',
                    backgroundColor: '#dcfce7', color: '#166534', fontSize: '11.5px', fontWeight: '800',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FiMapPin size={12} /> 네이버지도 들머리
                </button>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>
                  🎒 {isFuture ? '예상 기상 맞춤 배낭 체크리스트' : '오늘 기상 맞춤 배낭 체크리스트'}
                </h4>
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                  기온({temp}°C)·코스 시간·지형에 맞춰 자동 추천되며, 직접 추가·삭제하여 일행에게 공유할 수 있습니다.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResetGear}
                  title="기상 추천 기본값으로 초기화"
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.8)', color: '#475569', fontSize: '12px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                  }}
                >
                  <FiRotateCcw size={14} /> 복원
                </button>
                <button
                  type="button"
                  onClick={handleSharePlan}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#166534', color: '#ffffff', fontSize: '12.5px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 6px rgba(22,101,52,0.4)', transition: 'all 0.2s'
                  }}
                >
                  <FiShare2 size={14} /> 공유하기
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="추가할 준비물을 입력하세요 (예: 무릎보호대, 김밥, 보조배터리)"
                value={newGearInput}
                onChange={(e) => setNewGearInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGear()}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                  fontSize: '13px', outline: 'none', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.8)', fontWeight: '500'
                }}
              />
              <button
                type="button"
                onClick={handleAddGear}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#15803d', color: '#ffffff', fontSize: '13px', fontWeight: 'bold',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                }}
              >
                <FiPlus size={16} /> 추가
              </button>
            </div>

            {gearList.length === 0 ? (
              <p style={{ margin: '16px 0', fontSize: '13px', color: '#64748b', textAlign: 'center', fontWeight: '500' }}>
                체크리스트가 비어 있습니다. 준비물을 추가하거나 [복원]을 눌러주세요.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {gearList.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.8)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: checklist[item] ? '#94a3b8' : '#1e293b', fontWeight: '600', cursor: 'pointer', textDecoration: checklist[item] ? 'line-through' : 'none', userSelect: 'none', flex: 1, minWidth: 0 }}>
                      <input type="checkbox" checked={!!checklist[item]} onChange={() => toggleCheck(item)} style={{ cursor: 'pointer', accentColor: '#16a34a', width: '16px', height: '16px', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveGear(item)}
                      title="준비물 삭제"
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', padding: '4px', marginLeft: '4px', flexShrink: 0
                      }}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {!isFuture && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed rgba(0,0,0,0.1)', paddingTop: '20px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>시간대별 산 정상 기온 변화</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handlePrev} disabled={prevDisabled} style={{ ...buttonStyle, opacity: prevDisabled ? 0.3 : 1, cursor: prevDisabled ? 'default' : 'pointer' }}><FiChevronLeft size={20} /></button>
                <button type="button" onClick={handleNext} disabled={nextDisabled} style={{ ...buttonStyle, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}><FiChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {isMountainMode && isFuture ? (
         <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569', fontSize: '13.5px', fontWeight: '600' }}>
            미래 예보일은 시간대별 상세 기온 변화 그래프가 제공되지 않습니다.
         </div>
      ) : isLoading ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#475569', fontWeight: '500' }}>예보를 불러오는 중입니다...</p>
      ) : error ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#dc2626' }}>{error}</p>
      ) : forecastData.length === 0 ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#475569' }}>예보 데이터가 없습니다.</p>
      ) : (
        <div className="hourly-chart-wrapper" style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${(visibleIndex / forecastData.length) * 100}%)`, width: `${(forecastData.length / ITEMS_TO_SHOW) * 100}%`, position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '68px', left: 0, right: 0, height: '100px', zIndex: 1, padding: `0 ${100 / (2 * forecastData.length)}%`, boxSizing: 'border-box' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 28, bottom: 16, left: 0, right: 0 }}>
                  <YAxis domain={[yMin, yMax]} allowDataOverflow={true} hide />
                  <Line type="monotone" dataKey="plotTemp" stroke={isMountainMode ? "#16a34a" : "#0284c7"} strokeWidth={3} dot={{ r: 5, fill: '#ffffff', stroke: isMountainMode ? "#16a34a" : "#0284c7", strokeWidth: 2 }} label={(props) => <CustomLabel {...props} value={forecastData[props.index]?.tempNum} />} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
              {forecastData.map((item) => (
                <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#475569', height: '20px', lineHeight: '20px', marginBottom: '8px', fontWeight: '600' }}>{item.time}</span>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{getEmojiIcon(item.icon)}</div>
                  <div style={{ height: '100px', marginBottom: '8px' }}></div>
                  <span style={{ fontSize: '12.5px', color: item.pop > 0 ? '#2563eb' : '#94a3b8', fontWeight: item.pop > 0 ? '800' : '600', minHeight: '18px' }}>💧 {item.pop ?? 0}%</span>
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