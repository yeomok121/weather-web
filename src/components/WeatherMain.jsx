import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiCalendar, FiChevronDown } from 'react-icons/fi';

function WeatherMain({
  weatherData, hourlyData = [], weeklyData = [],
  selectedDateIdx, onSelectDate,
  isAiLoading, aiMessage, favorites, onAddClick, onFavoriteClick, onRemoveFavorite, onCurrentLocationClick,
  isMountainMode, onToggleMountainMode, mountainInfo, mountainsList = [], onSelectMountain, isLoggedIn = false
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDatePickerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasData = weatherData.hasData === true;
  const tempDiff = Number(weatherData.tempDiff || 0);
  const getComparisonBadge = () => {
    if (!hasData || (!isMountainMode && weatherData.tempDiff === null)) return null;
    if (weatherData.isFuture) {
      if (isMountainMode) {
        const baseTemp = weatherData.baseTemp ?? (weatherData.temp + 5);
        const drop = weatherData.summitDrop || Math.max(1, baseTemp - weatherData.temp);
        return { text: `🗓️ 예보 기준 · 산 입구(${baseTemp}°C)보다 약 ${drop}°C 낮음`, bg: 'rgba(22,163,74,0.1)', color: '#16a34a' }; // 녹색(추천/양호)
      }
      return { text: `🗓️ 해당 일자의 예상 최고기온 기준입니다`, bg: 'rgba(71,85,105,0.1)', color: '#475569' }; // 회색(보조)
    }
    if (isMountainMode) {
      const baseTemp = weatherData.baseTemp ?? (weatherData.temp + 5);
      const drop = weatherData.summitDrop || Math.max(1, baseTemp - weatherData.temp);
      return { text: `⛰️ 산 입구(${baseTemp}°C)보다 약 ${drop}°C 낮음 ❄️`, bg: 'rgba(37,99,235,0.1)', color: '#2563eb' }; // 파란색(정보)
    }
    if (tempDiff > 0) return { text: `어제보다 ${tempDiff}°C 높아요 🔺`, bg: 'rgba(234,88,12,0.1)', color: '#ea580c' }; // 주황색(주의)
    if (tempDiff < 0) return { text: `어제보다 ${Math.abs(tempDiff)}°C 낮아요 🔻`, bg: 'rgba(37,99,235,0.1)', color: '#2563eb' }; // 파란색(정보)
    return { text: '어제와 기온이 비슷해요 ➖', bg: 'rgba(71,85,105,0.1)', color: '#475569' }; // 회색(보조)
  };

  const getWeatherAlert = () => {
    if (!hasData || weatherData.isFuture || isMountainMode) return null;
    const cond = weatherData.condition || '';
    const wind = Number(weatherData.wind_speed || 0);
    const temp = Number(weatherData.temp || 20);
    const dustStr = weatherData.dust || '';
    const pm25Match = dustStr.match(/\d+/);
    const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
    const nextHours = Array.isArray(hourlyData) ? hourlyData.slice(0, 6) : [];
    const peakRainHour = nextHours.reduce((peak, hour) => {
      const probability = Math.round(Math.max(0, Math.min(1, Number(hour?.pop || 0))) * 100);
      return probability > (peak?.probability ?? -1) ? { probability, time: hour?.time } : peak;
    }, null);

    if (cond.includes('비') || cond.includes('소나기') || cond.includes('눈')) return { text: '☔ 현재 비/눈이 내립니다. 우산을 챙기세요!', bg: 'rgba(37,99,235,0.15)', color: '#2563eb' };
    if (peakRainHour?.probability >= 60) {
      const timeLabel = peakRainHour.time && peakRainHour.time !== '시간 없음' ? ` · ${peakRainHour.time}` : '';
      return { text: `🌂 시간별 예보에 강수 가능성이 있습니다${timeLabel} (강수확률 ${peakRainHour.probability}%).`, bg: 'rgba(37,99,235,0.15)', color: '#2563eb' };
    }
    if (pm25 >= 36) return { text: `😷 미세먼지가 높습니다. 마스크를 착용하세요!`, bg: 'rgba(234,88,12,0.15)', color: '#ea580c' }; // 주황
    if (wind >= 8) return { text: `💨 강풍 주의! 바람이 강하게 붑니다 (${wind}m/s).`, bg: 'rgba(234,88,12,0.15)', color: '#ea580c' };
    if (temp >= 33) return { text: '🥵 폭염 주의! 야외 활동 자제 및 수분 섭취', bg: 'rgba(220,38,38,0.15)', color: '#dc2626' }; // 빨간색(경고)
    if (temp <= -8) return { text: '🥶 한파 주의! 기온이 매우 낮으니 보온 유의', bg: 'rgba(37,99,235,0.15)', color: '#2563eb' };
    return null;
  };

  const getActiveGuideMessage = () => {
    if (!hasData) return isAiLoading ? '기상 자료를 확인하고 있어요.' : '기상 자료를 받지 못해 수치와 활동 추천을 표시하지 않습니다.';
    if (!weatherData.isFuture) return aiMessage;

    const t = Number(weatherData.temp || 0);
    const w = Number(weatherData.wind_speed || 0);
    const pop = Number(weatherData.targetPop || 0);
    const rName = weatherData.region || '산';

    if (isMountainMode) {
      if (pop >= 60) return `🌧️ 강수확률 ${pop}%! 미끄럼 주의 및 우천 장비 필수.`;
      if (t <= 2) return `🧊 정상 예상 ${t}°C! 블랙아이스 대비 아이젠 필수.`;
      if (w >= 6) return `💨 정상 풍속 ${w}m/s! 체온 유지를 위한 방풍 재킷 필수.`;
      return `🥾 정상 예상 ${t}°C로 산행하기 무난합니다! 겉옷을 챙기세요.`;
    } else {
      if (pop >= 60) return `☔ 비/눈 예보(${pop}%)가 있습니다. 우산을 챙기세요!`;
      if (t <= 0) return `🥶 예상 최고기온 ${t}°C로 춥겠습니다. 외투를 준비하세요!`;
      if (t >= 28) return `☀️ 예상 최고기온 ${t}°C로 다소 덥겠습니다. 수분 섭취 유의!`;
      return `✨ 예상 최고기온 ${t}°C입니다. 일교차에 대비하세요.`;
    }
  };

  const diffBadge = getComparisonBadge();
  const weatherAlert = getWeatherAlert();
  const displayGuideMessage = getActiveGuideMessage();

  return (
    <div className="weather-main-card glass-card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      
      {/* 💡 전체 패딩 대폭 축소 (16px 20px) 및 요소 밀착 */}
      <div style={{ flex: 2, padding: '16px 20px', textAlign: 'center', color: '#1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {weatherAlert && (
          <div style={{ backgroundColor: weatherAlert.bg, color: weatherAlert.color, borderRadius: '6px', padding: '6px 10px', fontSize: '11.5px', fontWeight: 'bold', marginBottom: '8px', wordBreak: 'keep-all', lineHeight: '1.3' }}>
            {weatherAlert.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <button 
            onClick={onToggleMountainMode}
            style={{
              padding: '6px 12px', borderRadius: '16px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer',
              border: isMountainMode ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(37,99,235,0.3)',
              backgroundColor: isMountainMode ? 'rgba(22,163,74,0.9)' : 'rgba(255,255,255,0.6)', 
              color: isMountainMode ? '#ffffff' : '#1e3a8a',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s ease'
            }}
          >
            {isMountainMode ? '⛰️ 일반 날씨로 전환 ↺' : '⛰️ 산악 기상 모드'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '800' }}>{weatherData.region}</h3>
          {isMountainMode && mountainInfo?.peak && <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>({mountainInfo.peak})</span>}
          {isMountainMode && weatherData.elevation > 0 && <span style={{ fontSize: '10.5px', color: '#166534', backgroundColor: 'rgba(22,163,74,0.1)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>해발 {weatherData.elevation}m</span>}
          {isMountainMode && mountainInfo?.difficulty && <span style={{ fontSize: '10.5px', color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>난이도 {mountainInfo.difficulty}</span>}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: 'rgba(255,255,255,0.6)', color: '#475569', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <FiCalendar size={12} /> 
              {weatherData.date} {selectedDateIdx === 0 ? '(오늘)' : ''}
              <FiChevronDown size={12} style={{ transform: isDatePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {isDatePickerOpen && weeklyData.length > 0 && (
              <div className="glass-card" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px', borderRadius: '8px', width: '150px', zIndex: 50, overflow: 'hidden' }}>
                {weeklyData.map((d, i) => (
                  <div 
                    key={i} 
                    onClick={() => { onSelectDate(i); setIsDatePickerOpen(false); }}
                    style={{ padding: '8px 12px', fontSize: '11.5px', cursor: 'pointer', backgroundColor: selectedDateIdx === i ? 'rgba(0,0,0,0.05)' : 'transparent', color: selectedDateIdx === i ? '#0f172a' : '#475569', fontWeight: selectedDateIdx === i ? 'bold' : '500', borderBottom: i !== weeklyData.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                  >
                    {d.date} ({d.day}) {i === 0 ? ' - 오늘' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 💡 기온/아이콘 크기 적절히 축소 (50px / 42px) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <h1 aria-label={hasData ? `기온 ${weatherData.temp}도` : '기온 자료 없음'} style={{ fontSize: '50px', margin: '0', fontWeight: '800', letterSpacing: '-1.5px' }}>{hasData ? `${weatherData.temp}°` : '—'}{hasData && <span style={{ fontSize: '24px', fontWeight: 'bold' }}>C</span>}</h1>
          <span style={{ fontSize: '42px', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}>{hasData ? weatherData.icon : null}</span>
        </div>
        
        <p style={{ margin: '4px 0 2px 0', fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
          {hasData ? (isMountainMode ? `정상 ${weatherData.condition}` : weatherData.condition) : (isAiLoading ? '날씨 확인 중' : '기상 자료 없음')}
        </p>
        <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '12px', fontWeight: '500' }}>{hasData ? weatherData.highLow : '기온 · 습도 · 바람 자료를 확인해 주세요.'}</p>

        {diffBadge && <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', backgroundColor: diffBadge.bg, color: diffBadge.color, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold' }}>
            {diffBadge.text}
          </span>
        </div>}
        
        <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '3px', fontSize: '11.5px', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'center', minHeight: '36px' }}>
          <span style={{ color: '#64748b', fontSize: '9.5px', fontWeight: '700' }}>{weatherData.isFuture ? '예보 기반 안내 · 참고용' : 'AI 참고 안내 · 예보 자료 요약'}</span>
          <span style={{ fontWeight: '600', color: '#1e293b', lineHeight: '1.4', wordBreak: 'keep-all' }}>{displayGuideMessage}</span>
        </div>
      </div>
      
      {/* 💡 우측 명산 목록 패딩 및 아이템 크기 최적화 */}
      <div id="mountain-picker" className="weather-main-right" style={{ flex: 1, padding: '16px', borderLeft: '1px solid rgba(255,255,255,0.4)', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', minWidth: 0 }}>
        {isMountainMode ? (
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: '11.5px', color: '#166534', fontWeight: 'bold', margin: '0 0 6px 0' }}>📌 핵심 산행 팁</h4>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#1e293b', lineHeight: '1.45', margin: '0 0 12px 0', wordBreak: 'keep-all' }}>
              {mountainInfo?.course_tip || '정상 부근 기온 하강과 강풍에 대비해 방풍 의류와 스틱을 준비하세요.'}
            </div>

            <h4 style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 6px 0', fontWeight: 'bold' }}>⛰️ {mountainsList.length}개 산 빠른 선택</h4>
            
            <div className="mobile-mtn-pills no-scrollbar" style={{ gap: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
              {mountainsList.map((m, idx) => {
                const isSelected = weatherData.region === m.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectMountain && onSelectMountain(m.name)}
                    style={{
                      flexShrink: 0, padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                      border: isSelected ? '1px solid #16a34a' : '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: isSelected ? '#16a34a' : 'rgba(255,255,255,0.75)',
                      color: isSelected ? '#ffffff' : '#334155',
                      fontWeight: isSelected ? 'bold' : '600',
                    }}
                  >
                    {m.name} <span style={{ fontSize: '10px', opacity: 0.85 }}>{m.elevation}m</span>
                  </button>
                );
              })}
            </div>

            <ul className="desktop-mtn-list no-scrollbar" style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '11.5px', maxHeight: '140px', overflowY: 'auto' }}>
              {mountainsList.map((m, idx) => {
                const isSelected = weatherData.region === m.name;
                return (
                  <li key={idx} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectMountain?.(m.name); } }} onClick={() => onSelectMountain && onSelectMountain(m.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: '6px', backgroundColor: isSelected ? 'rgba(22,163,74,0.1)' : 'transparent', color: isSelected ? '#16a34a' : '#475569', fontWeight: isSelected ? 'bold' : '500', marginBottom: '2px' }}>
                    <span>{idx + 1}. {m.name}</span><span style={{ fontSize: '10.5px', color: isSelected ? '#16a34a' : '#94a3b8' }}>{m.elevation}m</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '12px', color: '#334155', margin: 0, fontWeight: 'bold' }}>관심 지역</h4>
                <span style={{ display: 'block', marginTop: '2px', fontSize: '11px', color: '#64748b' }}>{isLoggedIn ? '내 계정에 동기화' : '이 브라우저에 저장'}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>{favorites.length}/5</span>
            </div>
            <button type="button" onClick={onCurrentLocationClick} style={{ cursor: 'pointer', color: '#1d4ed8', fontWeight: '700', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(255,255,255,0.55)', fontSize: '11.5px' }}>📍 현재 위치 날씨 보기</button>
            {favorites.length < 5 && <button type="button" onClick={onAddClick} style={{ cursor: 'pointer', color: '#166534', fontWeight: '700', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: '1px dashed rgba(22,101,52,0.35)', background: 'rgba(240,253,244,0.45)', fontSize: '11.5px' }}>＋ 지역 추가 · 최대 5곳 비교</button>}
            {favorites.length === 0 && <p style={{ margin: 0, color: '#526176', fontSize: '12px', lineHeight: 1.5 }}>자주 보는 지역을 추가하면 이 브라우저에서 다음 방문에도 빠르게 확인할 수 있어요.</p>}
            <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '12px', lineHeight: '1.5' }}>
              {favorites.map((fav, index) => (
                <li key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: index === 0 ? '8px' : '0', padding: '4px 6px', borderRadius: '6px', backgroundColor: weatherData.region === fav.name ? 'rgba(255,255,255,0.5)' : 'transparent' }}>
                  <span onClick={() => onFavoriteClick(fav)} style={{ cursor: 'pointer', flex: 1, color: weatherData.region === fav.name ? '#0f172a' : '#475569', fontWeight: weatherData.region === fav.name ? 'bold' : '500' }}>
                    {index + 1}. {fav.name} {isLoggedIn && index === 0 ? '(기본)' : ''}
                  </span>
                  {hoveredIndex === index && (
                    <button onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><FiTrash2 size={13} /></button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherMain;
