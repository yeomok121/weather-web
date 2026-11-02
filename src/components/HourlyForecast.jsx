import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  <text x={x} y={y - 10} fill="#334155" fontSize="14" fontWeight="bold" textAnchor="middle">
    {value}°
  </text>
);

function HourlyForecast({ hourlyData = EMPTY_HOURLY, isLoading = false, error = '', isMountainMode = false, mountainInfo = null, weatherData = {} }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [checklist, setChecklist] = useState({});
  
  // 💡 마우스 드래그(스와이프) 스크롤을 위한 상태
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false); 
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [hourlyData]);

  useEffect(() => {
    setChecklist({});
    setSelectedCourseIdx(0);
  }, [mountainInfo?.name]);

  const toggleCheck = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  // 💡 드래그 스크롤 로직 (미세한 떨림에 클릭되는 현상 방지)
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
    const walk = (x - startX) * 1.5; // 스크롤 속도
    if (Math.abs(walk) > 5) setDragMoved(true); // 5px 이상 움직여야만 드래그로 판정
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const rawForecastData = Array.isArray(hourlyData)
    ? hourlyData.filter(item => item && typeof item === 'object').map((item, index) => {
        const temp = toNumber(item.temp);
        const pop = toNumber(item.pop);
        return {
          id: index,
          time: item.time || '시간 없음',
          icon: item.icon,
          description: item.description,
          tempNum: temp,
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
    background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
    display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333', transition: 'background-color 0.2s',
  };

  const temp = weatherData?.temp || 0;
  const baseTemp = weatherData?.baseTemp || temp + 5;
  const wind = weatherData?.wind_speed || 0;
  const dustStr = weatherData?.dust || '';
  const pm25Match = dustStr.match(/\d+/);
  const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
  const desc = weatherData?.condition || '';
  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박');
  const isSnow = desc.includes('눈');
  const sunset = weatherData?.sunset || '18:00';
  const safeDescentTime = weatherData?.safeDescentTime || mountainInfo?.safe_descent_time || '15:30';
  const terrain = mountainInfo?.terrain || '';

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
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const parseTime = (str) => {
      if (!str || !str.includes(':')) return 1080;
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    };
    const safeDescentMins = parseTime(safeDescentTime);
    const requiredMins = selectedCourse.time;
    const deadlineMins = safeDescentMins - requiredMins; 
    
    if (currentMins > safeDescentMins) return { status: 'danger', msg: '⚠️ 하산 마감 시간이 지났습니다. 야간 산행(랜턴) 모드입니다.' };
    if (currentMins > deadlineMins) return { status: 'warning', msg: `⚠️ 지금 출발하면 일몰(${sunset}) 후 하산합니다. 랜턴 필수!` };
    return { status: 'safe', msg: `✅ 지금 출발하면 일몰 전 안전하게 하산 가능합니다.` };
  };
  const timeline = getTimelineStatus();

  const getChecklistItems = () => {
    const items = ['등산화 (접지력 확인)', '충분한 식수', '초코바 등 행동식'];
    if (temp <= 2 || isSnow) items.push('아이젠 및 스패츠', '보온병 (온수)', '방한모 및 넥워머');
    if (temp <= 15 || wind >= 5) items.push('방풍 재킷(바람막이)');
    if (isRainOrSnow) items.push('판초우의 또는 배낭 커버');
    if (terrain.includes('암릉') || terrain.includes('바위')) items.push('반장갑 (바위용)', '릿지화(암릉화)');
    items.push('등산 스틱', '비상용 헤드랜턴');
    return items;
  };
  const gearList = getChecklistItems();

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', color: '#333', width: '100%', boxSizing: 'border-box' }}>
      <style>{`.hourly-chart-wrapper .recharts-surface { overflow: visible !important; }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: isMountainMode ? '#166534' : '#1e293b' }}>
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
          
          {/* 💡 Flex Wrap을 사용하여 화면이 좁을 경우 글자가 찌그러지지 않고 자연스럽게 아래로 내려가게 처리 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* 좌측: 종합 점수 & 3단 고도 맵 */}
            <div style={{ flex: '1 1 250px', display: 'flex', gap: '10px' }}>
              <div style={{ width: '95px', flexShrink: 0, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 'bold', marginBottom: '8px', whiteSpace: 'nowrap' }}>오늘 산행 지수</span>
                <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#dcfce7" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 70 ? "#16a34a" : score >= 40 ? "#eab308" : "#dc2626"} strokeWidth="4" strokeDasharray={`${score}, 100`} />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '16px', fontWeight: 'bold', color: '#064e3b' }}>{score}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#475569', marginTop: '10px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  {score >= 80 ? '아주 쾌적함' : score >= 60 ? '산행 무난함' : score >= 40 ? '주의 필요' : '입산 자제'}
                </span>
              </div>

              {/* 💡 Flex Wrap을 주어 글씨 공간이 부족하면 자동으로 줄바꿈 되도록 설정 */}
              <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <span style={{ fontWeight: 'bold', color: '#334155' }}>⛰️ 정상 <span style={{fontSize:'10px', color:'#94a3b8', fontWeight:'normal'}}>({mountainInfo?.elevation}m)</span></span>
                  <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{temp}°C <span style={{fontSize:'10px', color:'#64748b', fontWeight:'normal'}}>(풍속 {wind}m/s)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', padding: '6px 0', borderBottom: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>🌲 중턱 <span style={{fontSize:'10px', color:'#94a3b8'}}>({Math.round(mountainInfo?.elevation / 2)}m)</span></span>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{Math.round((temp + baseTemp) / 2)}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', paddingTop: '6px' }}>
                  <span style={{ color: '#64748b' }}>👟 들머리 <span style={{fontSize:'10px', color:'#94a3b8'}}>(입구)</span></span>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{baseTemp}°C</span>
                </div>
              </div>
            </div>

            {/* 우측: 코스별 하산 타임라인 계산기 */}
            <div style={{ flex: '1 1 270px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* 💡 Flex Wrap을 적용하여 제목과 일몰 기준 텍스트가 겹치지 않게 분리 */}
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e293b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span>⏱️ 코스별 하산 타임라인</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>일몰 {sunset} 기준</span>
              </h4>
              
              {/* 💡 마우스 드래그/모바일 터치 스와이프 완벽 적용 */}
              <div 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', WebkitOverflowScrolling: 'touch' }} 
                className="no-scrollbar"
              >
                {courses.map((c, idx) => (
                  <button 
                    key={idx} 
                    onClick={(e) => {
                      if (dragMoved) { e.preventDefault(); e.stopPropagation(); return; } // 드래그 중 클릭 오작동 방지
                      setSelectedCourseIdx(idx);
                    }}
                    style={{
                      flexShrink: 0, padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer',
                      border: selectedCourseIdx === idx ? '1px solid #3182ce' : '1px solid #cbd5e1',
                      background: selectedCourseIdx === idx ? '#ebf8ff' : '#f8fafc',
                      color: selectedCourseIdx === idx ? '#2b6cb0' : '#64748b',
                      transition: 'all 0.2s', userSelect: 'none'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* 💡 CSS Grid를 사용하여 거리, 소요, 난이도를 2줄로 완벽하게 배치 (글자 겹침 차단) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px', color: '#334155', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                <span>거리: <strong>{selectedCourse.distance}</strong></span>
                <span>소요: <strong>{Math.floor(selectedCourse.time / 60)}시간 {selectedCourse.time % 60}분</strong></span>
                <span style={{ gridColumn: 'span 2' }}>난이도: <strong style={{ color: selectedCourse.diff.includes('상') ? '#dc2626' : '#16a34a' }}>{selectedCourse.diff}</strong></span>
              </div>

              <div style={{ fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', padding: '8px', borderRadius: '6px', marginTop: 'auto', wordBreak: 'keep-all', lineHeight: '1.4',
                backgroundColor: timeline.status === 'safe' ? '#f0fdf4' : timeline.status === 'warning' ? '#fffbeb' : '#fef2f2',
                color: timeline.status === 'safe' ? '#166534' : timeline.status === 'warning' ? '#b45309' : '#991b1b',
                border: `1px solid ${timeline.status === 'safe' ? '#bbf7d0' : timeline.status === 'warning' ? '#fde68a' : '#fecaca'}`
              }}>
                {timeline.msg}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>🎒 오늘 기상 맞춤 배낭 체크리스트</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {gearList.map((item, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: checklist[item] ? '#94a3b8' : '#334155', cursor: 'pointer', textDecoration: checklist[item] ? 'line-through' : 'none', padding: '6px 0', userSelect: 'none' }}>
                  <input type="checkbox" checked={!!checklist[item]} onChange={() => toggleCheck(item)} style={{ cursor: 'pointer', accentColor: '#16a34a', width: '15px', height: '15px', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{item}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>시간대별 산 정상 기온 변화</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={handlePrev} disabled={prevDisabled} style={{ ...buttonStyle, opacity: prevDisabled ? 0.3 : 1, cursor: prevDisabled ? 'default' : 'pointer' }}><FiChevronLeft size={20} /></button>
              <button type="button" onClick={handleNext} disabled={nextDisabled} style={{ ...buttonStyle, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}><FiChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>예보를 불러오는 중입니다...</p>
      ) : error ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#dc2626' }}>{error}</p>
      ) : forecastData.length === 0 ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>예보 데이터가 없습니다.</p>
      ) : (
        <div className="hourly-chart-wrapper" style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${(visibleIndex / forecastData.length) * 100}%)`, width: `${(forecastData.length / ITEMS_TO_SHOW) * 100}%`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '68px', left: 0, right: 0, height: '100px', zIndex: 1, padding: `0 ${100 / (2 * forecastData.length)}%`, boxSizing: 'border-box' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 28, bottom: 16, left: 0, right: 0 }}>
                  <YAxis domain={[yMin, yMax]} allowDataOverflow={true} hide />
                  <Line type="monotone" dataKey="plotTemp" stroke={isMountainMode ? "#16a34a" : "#fbbf24"} strokeWidth={3} dot={{ r: 4, fill: '#ffffff', stroke: isMountainMode ? "#16a34a" : "#fbbf24", strokeWidth: 2 }} label={(props) => <CustomLabel {...props} value={forecastData[props.index]?.tempNum} />} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
              {forecastData.map((item) => (
                <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', height: '20px', lineHeight: '20px', marginBottom: '8px' }}>{item.time}</span>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{getEmojiIcon(item.icon)}</div>
                  <div style={{ height: '100px', marginBottom: '8px' }}></div>
                  <span style={{ fontSize: '12px', color: item.pop > 0 ? '#38bdf8' : '#94a3b8', fontWeight: item.pop > 0 ? 'bold' : 'normal', minHeight: '18px' }}>💧 {item.pop ?? 0}%</span>
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