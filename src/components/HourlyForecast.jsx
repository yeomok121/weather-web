import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiShare2, FiPlus, FiX, FiRotateCcw } from 'react-icons/fi';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { getEmojiIcon } from './WeeklyForecast';

const ITEMS_TO_SHOW = 6;
const EMPTY_HOURLY = [];

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

function HourlyForecast({ hourlyData = EMPTY_HOURLY, isLoading = false, error = '', isMountainMode = false, mountainInfo = null, weatherData = {}, onShowToast }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [gearList, setGearList] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [newGearInput, setNewGearInput] = useState('');
  
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false); 
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const temp = weatherData?.temp || 0;
  const baseTemp = weatherData?.baseTemp || temp + 5;
  const wind = weatherData?.wind_speed || 0;
  const dustStr = weatherData?.dust || '';
  const pm25Match = dustStr.match(/\d+/);
  const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
  const desc = weatherData?.condition || '';
  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || (weatherData?.targetPop >= 60);
  const isSnow = desc.includes('눈');
  const sunset = weatherData?.sunset || '18:00';
  const safeDescentTime = weatherData?.safeDescentTime || mountainInfo?.safe_descent_time || '15:30';
  const terrain = mountainInfo?.terrain || '';
  const isFuture = weatherData?.isFuture || false;

  const buildWeatherGearList = () => {
    const items = ['등산화 (접지력 확인)', '충분한 식수', '초코바 등 행동식'];
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

  useEffect(() => {
    setSelectedCourseIdx(0);
    setGearList(buildWeatherGearList());
    setChecklist({});
  }, [mountainInfo?.name, weatherData?.date, temp, wind, isRainOrSnow, terrain]);

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
    setGearList(prev => [...prev, trimmed]);
    setNewGearInput('');
  };

  const handleRemoveGear = (itemToRemove) => {
    setGearList(prev => prev.filter(item => item !== itemToRemove));
    setChecklist(prev => {
      const next = { ...prev };
      delete next[itemToRemove];
      return next;
    });
  };

  const handleResetGear = () => {
    setGearList(buildWeatherGearList());
    setChecklist({});
    if (onShowToast) onShowToast('🔄 현재 기상에 맞는 기본 추천 준비물로 복원되었습니다.');
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

  const getMountainScore = () => {
    let score = 100;
    if (isRainOrSnow) score -= 40;
    if (wind >= 10) score -= 30;
    else if (wind >= 6) score -= 15;
    if (temp <= -10 || temp >= 33) score -= 20;
    else if (temp <= -3 || temp >= 28) score -= 10;
    if (pm25 >= 75) score -= 15;
    else if (pm25 >= 36) score -= 5;
    return Math.max(0, score);
  };
  const score = getMountainScore();

  const courses = mountainInfo?.courses || [{ name: '기본 탐방로', distance: '5km', time: 180, diff: '중' }];
  const selectedCourse = courses[selectedCourseIdx] || courses[0];

  const getTimelineStatus = () => {
    const parseTime = (str) => {
      if (!str || !str.includes(':')) return 1080;
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    };
    const safeDescentMins = parseTime(safeDescentTime);
    const requiredMins = selectedCourse.time;
    const deadlineMins = safeDescentMins - requiredMins; 
    const deadlineH = Math.floor(deadlineMins / 60);
    const deadlineM = String(deadlineMins % 60).padStart(2, '0');
    const deadlineStr = `${deadlineH}:${deadlineM}`;
    
    if (isFuture) {
      return { status: 'safe', deadlineStr, msg: `🗓️ ${weatherData.date} 계획: 늦어도 ${deadlineStr} 전에는 등산을 시작해야 안전합니다.` };
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    if (currentMins > safeDescentMins) return { status: 'danger', deadlineStr, msg: '⚠️ 하산 마감 시간이 지났습니다. 야간 산행(랜턴) 모드입니다.' };
    if (currentMins > deadlineMins) return { status: 'warning', deadlineStr, msg: `⚠️ 지금 출발하면 일몰(${sunset}) 후 하산합니다. 랜턴 필수!` };
    return { status: 'safe', deadlineStr, msg: `✅ 지금 출발하면 일몰 전 안전하게 하산 가능합니다.` };
  };
  const timeline = getTimelineStatus();

  const handleSharePlan = async () => {
    const mName = weatherData.region || mountainInfo?.name || '명산';
    const peak = mountainInfo?.peak ? `(${mountainInfo.peak} ${mountainInfo.elevation}m)` : '';
    const formattedGear = gearList.length > 0
      ? gearList.map(item => `${checklist[item] ? '☑️' : '⬜'} ${item}`).join('\n  ')
      : '없음';

    const shareText = [
      `⛰️ [${mName} ${peak} 산행 기상 브리핑]`,
      `📅 일자: ${weatherData.date}`,
      `🌡️ 정상 기온: ${temp}°C (입구 평지 ${baseTemp}°C / 풍속 ${wind}m/s)`,
      `🏆 산행 지수: ${score}점 (${score >= 80 ? '매우 쾌적' : score >= 60 ? '산행 무난' : '주의 필요'})`,
      `🥾 선택 코스: ${selectedCourse.name} (거리 ${selectedCourse.distance} · 약 ${Math.floor(selectedCourse.time / 60)}시간 ${selectedCourse.time % 60}분 소요)`,
      `🚨 안전 하산 마감: ${safeDescentTime} 이전 (일몰 ${sunset})`,
      `🎒 맞춤 배낭 체크리스트:\n  ${formattedGear}`,
      `🔗 날씨 대시보드: ${window.location.href}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(shareText);
      if (onShowToast) onShowToast('📋 내가 편집한 체크리스트와 산행 일정이 복사되었습니다! 카톡 등에 붙여넣어 공유하세요.');
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
          .mtn-score-card { width: 100% !important; flex-direction: row !important; justify-content: space-around !important; padding: 12px !important; }
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
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            
            <div className="mtn-score-altitude-box" style={{ flex: '1 1 250px', display: 'flex', gap: '12px' }}>
              <div className="mtn-score-card" style={{ width: '105px', flexShrink: 0, backgroundColor: 'rgba(240,253,244,0.7)', borderRadius: '12px', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 'bold', marginBottom: '10px', whiteSpace: 'nowrap' }}>{isFuture ? '예상 산행 지수' : '오늘 산행 지수'}</span>
                <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(22,163,74,0.2)" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 70 ? "#16a34a" : score >= 40 ? "#eab308" : "#dc2626"} strokeWidth="4" strokeDasharray={`${score}, 100`} />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '18px', fontWeight: 'bold', color: '#064e3b' }}>{score}</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#0f172a', marginTop: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {score >= 80 ? '아주 쾌적함' : score >= 60 ? '산행 무난함' : score >= 40 ? '주의 필요' : '입산 자제'}
                </span>
              </div>

              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', paddingBottom: '6px', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                  <span style={{ fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap' }}>⛰️ 정상 <span style={{fontSize:'10px', color:'#475569', fontWeight:'normal'}}>({mountainInfo?.elevation}m)</span></span>
                  <span style={{ color: '#0f172a', fontWeight: '800' }}>{temp}°C <span style={{fontSize:'10.5px', color:'#475569', fontWeight:'normal'}}>(풍속 {wind}m/s)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', padding: '6px 0', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                  <span style={{ color: '#475569', whiteSpace: 'nowrap', fontWeight: 'bold' }}>🌲 중턱 <span style={{fontSize:'10px', color:'#64748b', fontWeight:'normal'}}>({Math.round(mountainInfo?.elevation / 2)}m)</span></span>
                  <span style={{ color: '#334155', fontWeight: '600' }}>{Math.round((temp + baseTemp) / 2)}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', paddingTop: '6px' }}>
                  <span style={{ color: '#475569', whiteSpace: 'nowrap', fontWeight: 'bold' }}>👟 들머리 <span style={{fontSize:'10px', color:'#64748b', fontWeight:'normal'}}>(입구)</span></span>
                  <span style={{ color: '#334155', fontWeight: '600' }}>{baseTemp}°C</span>
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 270px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '800' }}>⏱️ 코스별 하산 타임라인</span>
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius:'10px' }}>일몰 {sunset} 기준</span>
              </h4>
              
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
                      setSelectedCourseIdx(idx);
                    }}
                    style={{
                      flexShrink: 0, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      border: selectedCourseIdx === idx ? '1px solid #2563eb' : '1px solid rgba(0,0,0,0.1)',
                      background: selectedCourseIdx === idx ? '#eff6ff' : 'rgba(255,255,255,0.8)',
                      color: selectedCourseIdx === idx ? '#1d4ed8' : '#475569',
                      transition: 'all 0.2s', userSelect: 'none'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                <span>거리: <strong>{selectedCourse.distance}</strong></span>
                <span>소요: <strong>{Math.floor(selectedCourse.time / 60)}시간 {selectedCourse.time % 60}분</strong></span>
                <span style={{ gridColumn: 'span 2' }}>난이도: <strong style={{ color: selectedCourse.diff.includes('상') ? '#dc2626' : '#16a34a' }}>{selectedCourse.diff}</strong></span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '10px', borderRadius: '8px', marginTop: 'auto', wordBreak: 'keep-all', lineHeight: '1.4',
                backgroundColor: timeline.status === 'safe' ? 'rgba(240,253,244,0.8)' : timeline.status === 'warning' ? 'rgba(254,252,232,0.8)' : 'rgba(254,242,242,0.8)',
                color: timeline.status === 'safe' ? '#166534' : timeline.status === 'warning' ? '#a16207' : '#991b1b'
              }}>
                {timeline.msg}
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
                  기온({temp}°C)·바람({wind}m/s)·지형에 맞춰 자동 추천되며, 직접 추가·삭제하여 일행에게 공유할 수 있습니다.
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
            
            {/* 💡 핵심: 각 시간 칼럼의 정중앙(100 / 2N %)에 그래프의 첫 점과 끝 점이 정확히 오도록 수학적 비율 패딩 적용 */}
            <div style={{ position: 'absolute', top: '68px', left: 0, right: 0, height: '100px', zIndex: 1, padding: `0 ${100 / (2 * forecastData.length)}%`, boxSizing: 'border-box' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 28, bottom: 16, left: 0, right: 0 }}>
                  <YAxis domain={[yMin, yMax]} allowDataOverflow={true} hide />
                  <Line type="monotone" dataKey="plotTemp" stroke={isMountainMode ? "#16a34a" : "#0284c7"} strokeWidth={3} dot={{ r: 5, fill: '#ffffff', stroke: isMountainMode ? "#16a34a" : "#0284c7", strokeWidth: 2 }} label={(props) => <CustomLabel {...props} value={forecastData[props.index]?.tempNum} />} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* 상/하단 시간·아이콘·강수확률 영역은 패딩 없이 1/N 균등 분할하여 위 차트의 점과 1:1 수직 일치 */}
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