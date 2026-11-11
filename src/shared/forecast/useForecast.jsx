// 공통: 날씨·산악 예보 불러오기와 화면에 표시할 예보 상태.
// 날씨 페이지와 산악 페이지가 함께 사용합니다. 수정할 때는 팀에 먼저 공유해 주세요.
import { useEffect, useRef, useState } from 'react';
import { requestJson, requestForecastJson } from '../lib/apiClient';
import { forecastKey, isUsableForecast, isWeatherNumber, readForecastCache, writeForecastCache } from '../lib/forecastCache';
import { koreanDate } from '../../pages/mountain/lib/hikingPlan';
import { getEmojiIcon } from './WeeklyForecast';



const getTodayDateString = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${month}월 ${date}일 ${days[now.getDay()]}`;
};

export const emptyWeather = (region = '부천시') => ({
  hasData: false, region, temp: null, feelsLike: null, tempDiff: null,
  baseTemp: null, summitDrop: null, humidity: null, wind_speed: null,
  safeDescentTime: null, sunrise: null, sunset: null, icon: null,
  dust: '확인 불가', condition: '기상 자료 확인 필요', highLow: '최고 · 최저 자료 없음',
  date: getTodayDateString(), elevation: 0,
});

// mountainsList: 산 이름으로 코스 정보를 찾을 목록
// onNewForecast(): 다른 지역·산의 예보로 바뀔 때 호출됩니다 (산행 계획 선택값 초기화용).
export function useForecast({ mountainsList, onNewForecast }) {
  const [mountainInfo, setMountainInfo] = useState(null);
  const [aiMessage, setAiMessage] = useState('✨ 날씨 정보를 불러오는 중입니다...');
  const [aiBriefing, setAiBriefing] = useState('데이터를 불러오는 중입니다...');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [forecastError, setForecastError] = useState('');
  const [weatherFetchedAt, setWeatherFetchedAt] = useState(null);
  const [connectionState, setConnectionState] = useState({ phase: 'connecting' });
  const [bgTheme, setBgTheme] = useState('clear-day');

  const [weatherData, setWeatherData] = useState(() => emptyWeather());
  const lastWeatherRequestRef = useRef({ kind: 'weather', lat: 37.5034, lon: 126.7660, regionName: '부천시' });
  const forecastControllerRef = useRef(null);
  const displayedForecastKeyRef = useRef('');
  const recoveryStateRef = useRef({ phase: 'connecting' });

  const updateWeatherState = (data, regionName, elevation = 0, mInfo = null, { fetchedAt = Date.now(), preservePlan = false } = {}) => {
    const c = data.current;
    const aqi = data.air_quality;
    const desc = c.description || '하늘 상태 자료 없음';
    const isNight = (c.icon || '').includes('n');
    setBgTheme(desc.includes('눈') ? 'snow' : /비|소나기/.test(desc) ? 'rain' : /구름|흐림/.test(desc) ? (isNight ? 'cloudy-night' : 'cloudy-day') : (isNight ? 'clear-night' : 'clear-day'));
    setMountainInfo(mInfo);
    setWeatherFetchedAt(new Date(fetchedAt));
    if (!preservePlan) onNewForecast?.();
    const value = raw => isWeatherNumber(raw) ? Math.round(Number(raw)) : null;
    const feelsLike = value(c.feels_like);
    setWeatherData({
      hasData: true,
      region: regionName ?? c.city ?? '위치 알 수 없음',
      date: getTodayDateString(), forecastDate: koreanDate(fetchedAt), temp: value(c.temp), feelsLike,
      tempDiff: value(c.temp_diff), baseTemp: value(c.base_temp ?? c.temp),
      summitDrop: value(c.summit_drop),
      safeDescentTime: c.safe_descent_time || null,
      safeDescentTimeLabel: c.safe_descent_time_label || '권장 하산 시작 시각',
      weatherSources: c.weather_sources || null, dataAsOf: c.data_as_of || data.metadata?.generated_at || null,
      dataNote: c.data_note || '',
      icon: c.icon ? <span style={{ fontSize: '70px' }}>{getEmojiIcon(c.icon)}</span> : null,
      condition: feelsLike === null ? desc : `${desc} (체감 ${feelsLike}°C)`,
      highLow: `최고 ${value(c.temp_max) ?? '—'}° / 최저 ${value(c.temp_min) ?? '—'}°`,
      humidity: isWeatherNumber(c.humidity) ? Number(c.humidity) : null,
      wind_speed: isWeatherNumber(c.wind_speed) ? Number(c.wind_speed) : null,
      dust: aqi && aqi.level !== '점검중' && isWeatherNumber(aqi.pm25) ? `${aqi.level} (${aqi.pm25})` : '확인 불가',
      sunrise: c.sunrise || null, sunset: c.sunset || null, elevation,
    });
    setHourlyData(Array.isArray(data.hourly) ? data.hourly : []);
    setWeeklyData(Array.isArray(data.weekly) ? data.weekly : []);
  };

  const loadForecast = async (request) => {
    forecastControllerRef.current?.abort();
    const controller = new AbortController();
    forecastControllerRef.current = controller;
    lastWeatherRequestRef.current = request;
    const key = forecastKey(request);
    const preservePlan = displayedForecastKeyRef.current === key;
    const cached = readForecastCache(key);
    const localMountain = request.kind === 'mountain'
      ? mountainsList.find(item => item.name === request.mountainName) : null;
    const label = request.kind === 'mountain' ? request.mountainName : (request.regionName || '현재 위치');
    const apply = (data, fetchedAt) => {
      const info = data.mountain_info ? { ...localMountain, ...data.mountain_info, courses: localMountain?.courses } : localMountain;
      updateWeatherState(data, request.kind === 'mountain' ? data.mountain_name : request.regionName,
        data.elevation || 0, info, { fetchedAt, preservePlan });
      displayedForecastKeyRef.current = key;
    };
    if (cached) apply(cached.data, cached.savedAt);
    else if (!preservePlan) {
      displayedForecastKeyRef.current = '';
      setWeatherData(emptyWeather(label)); setHourlyData([]); setWeeklyData([]);
      setWeatherFetchedAt(null); setMountainInfo(localMountain);
    }
    setForecastError('');
    setIsAiLoading(true);
    setAiMessage('최신 기상 자료를 확인하고 있어요.');
    const path = request.kind === 'mountain'
      ? `/api/mountain/summary?name=${encodeURIComponent(request.mountainName)}`
      : `/api/weather/summary?lat=${request.lat}&lon=${request.lon}`;
    try {
      const data = await requestForecastJson(path, {
        signal: controller.signal,
        onState: state => { if (!controller.signal.aborted) setConnectionState({ ...state, cached: !!cached || preservePlan }); },
      });
      if (controller.signal.aborted) return false;
      if (!isUsableForecast(data)) throw new Error('기온 자료를 받지 못했습니다. 잠시 후 다시 확인해 주세요.');
      apply(data, Date.now());
      writeForecastCache(key, data);
      setConnectionState({ phase: 'success' });
      setIsAiLoading(false);
      setAiMessage('시간별 예보와 선택한 일정을 확인해 주세요.');
      setAiBriefing('기상 자료를 바탕으로 안내를 준비하고 있어요.');
      // Numeric weather is usable immediately; AI failure must not hide it.
      requestJson('/api/weather/ai', {
        method: 'POST', timeoutMs: 18000, signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: data.current, forecast: data.hourly || [], air_quality: data.air_quality || {}, mountain_info: data.mountain_info || null }),
      }).then(ai => {
        if (controller.signal.aborted) return;
        setAiMessage(ai.advice?.[0] || '기상 수치와 공식 통제 정보를 함께 확인하세요.');
        setAiBriefing(ai.ai_briefing || '시간별 예보와 선택한 일정을 확인해 주세요.');
      }).catch(() => {
        if (controller.signal.aborted) return;
        setAiMessage('AI 안내를 받지 못했습니다. 아래 수치 예보를 확인해 주세요.');
        setAiBriefing('AI 안내 연결이 지연되어 수치 예보를 제공합니다.');
      });
      return true;
    } catch (error) {
      if (controller.signal.aborted) return false;
      const message = error.message || '날씨 서버에 연결하지 못했습니다.';
      setForecastError(message);
      setConnectionState({ phase: cached || preservePlan ? 'stale' : 'error', message, requestId: error.requestId });
      setAiMessage(cached || preservePlan ? '지난 자료입니다. 출발 전에 최신 날씨를 다시 확인해 주세요.' : '기상 자료를 확인한 뒤 활동 안내를 제공합니다.');
      setAiBriefing(message);
      setIsAiLoading(false);
      return false;
    }
  };

  const retryForecast = () => loadForecast(lastWeatherRequestRef.current);

  useEffect(() => { recoveryStateRef.current = connectionState; }, [connectionState]);
  useEffect(() => {
    const recover = () => {
      if (navigator.onLine && ['error', 'stale'].includes(recoveryStateRef.current.phase)) {
        loadForecast(lastWeatherRequestRef.current);
      }
    };
    window.addEventListener('online', recover);
    window.addEventListener('focus', recover);
    return () => { window.removeEventListener('online', recover); window.removeEventListener('focus', recover); forecastControllerRef.current?.abort(); };
  }, []);


  return {
    weatherData, hourlyData, weeklyData, mountainInfo, forecastError, weatherFetchedAt,
    connectionState, bgTheme, aiMessage, aiBriefing, isAiLoading, setIsAiLoading,
    loadForecast, retryForecast, lastWeatherRequestRef,
  };
}
