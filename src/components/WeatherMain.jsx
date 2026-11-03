import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiCalendar, FiChevronDown } from 'react-icons/fi';

function WeatherMain({
  weatherData, hourlyData = [], weeklyData = [],
  selectedDateIdx, onSelectDate,
  isAiLoading, aiMessage, favorites, onAddClick, onFavoriteClick, onRemoveFavorite, onCurrentLocationClick,
  isMountainMode, onToggleMountainMode, mountainInfo, mountainsList = [], onSelectMountain
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

  if (isAiLoading) {
    return (
      <div className="weather-main-card glass-card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '30px', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '40%', height: '24px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '30%', height: '16px', margin: '0 auto 20px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '120px', height: '80px', margin: '0 auto 15px', borderRadius: '8px' }}></div>
        </div>
        <div className="weather-main-right" style={{ flex: 1, padding: '20px', borderLeft: '1px solid rgba(255,255,255,0.4)' }}>
          <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '20px', borderRadius: '4px' }}></div>
        </div>
      </div>
    );
  }

  const tempDiff = Number(weatherData.tempDiff || 0);
  const getComparisonBadge = () => {
    if (weatherData.isFuture) {
      if (isMountainMode) {
        const baseTemp = weatherData.baseTemp ?? (weatherData.temp + 5);
        const drop = weatherData.summitDrop || Math.max(1, baseTemp - weatherData.temp);
        return { text: `🗓️ 예보 기준 · 산 입구(${baseTemp}°C)보다 약 ${drop}°C 낮아요`, bg: 'rgba(209, 250, 229, 0.7)', color: '#047857', border: 'transparent' };
      }
      return { text: `🗓️ 해당 일자의 예상 최고기온 기준입니다`, bg: 'rgba(255,255,255,0.5)', color: '#334155', border: 'transparent' };
    }
    if (isMountainMode) {
      const baseTemp = weatherData.baseTemp ?? (weatherData.temp + 5);
      const drop = weatherData.summitDrop || Math.max(1, baseTemp - weatherData.temp);
      return { text: `⛰️ 산 입구(평지 ${baseTemp}°C)보다 약 ${drop}°C 더 낮아요 ❄️`, bg: 'rgba(209, 250, 229, 0.7)', color: '#047857', border: 'transparent' };
    }
    if (tempDiff > 0) return { text: `어제보다 ${tempDiff}°C 높아요 🔺`, bg: 'rgba(255, 245, 245, 0.7)', color: '#e53e3e', border: 'transparent' };
    if (tempDiff < 0) return { text: `어제보다 ${Math.abs(tempDiff)}°C 낮아요 🔻`, bg: 'rgba(235, 248, 255, 0.7)', color: '#3182ce', border: 'transparent' };
    return { text: '어제와 기온이 비슷해요 ➖', bg: 'rgba(248, 250, 252, 0.7)', color: '#475569', border: 'transparent' };
  };

  const getWeatherAlert = () => {
    if (weatherData.isFuture || isMountainMode) return null;
    const cond = weatherData.condition || '';
    const wind = Number(weatherData.wind_speed || 0);
    const temp = Number(weatherData.temp || 20);
    const dustStr = weatherData.dust || '';
    const pm25Match = dustStr.match(/\d+/);
    const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
    const maxPop = Array.isArray(hourlyData) && hourlyData.length > 0 ? Math.round(Math.max(...hourlyData.slice(0, 6).map(h => Number(h.pop || 0))) * 100) : 0;

    if (cond.includes('비') || cond.includes('소나기') || cond.includes('눈')) return { text: '☔ 현재 비/눈이 내리고 있습니다. 우산을 챙기세요!', bg: 'rgba(239,246,255,0.8)', color: '#1d4ed8' };
    if (maxPop >= 60) return { text: `🌂 곧 비 소식이 있습니다 (강수확률 ${maxPop}%).`, bg: 'rgba(239,246,255,0.8)', color: '#1d4ed8' };
    if (pm25 >= 36) return { text: `😷 미세먼지 농도가 높습니다 (${dustStr}). 마스크를 착용하세요!`, bg: 'rgba(255,247,237,0.8)', color: '#c2410c' };
    if (wind >= 8) return { text: `💨 강풍 주의! 현재 바람이 강하게 불고 있습니다 (${wind}m/s).`, bg: 'rgba(254,252,232,0.8)', color: '#a16207' };
    if (temp >= 33) return { text: '🥵 폭염 주의! 야외 활동을 자제하시고 수분을 섭취하세요.', bg: 'rgba(254,242,242,0.8)', color: '#b91c1c' };
    if (temp <= -8) return { text: '🥶 한파 주의! 기온이 매우 낮으니 보온에 유의하세요.', bg: 'rgba(239,246,255,0.8)', color: '#1e40af' };
    return null;
  };

  // 💡 미래 날짜 선택 시에도 그날의 기상 조건에 맞는 스마트 가이드 문구 생성
  const getActiveGuideMessage = () => {
    if (!weatherData.isFuture) return aiMessage;

    const t = Number(weatherData.temp || 0);
    const w = Number(weatherData.wind_speed || 0);
    const pop = Number(weatherData.targetPop || 0);
    const rName = weatherData.region || '산';

    if (isMountainMode) {
      if (pop >= 60) {
        return `🌧️ ${weatherData.date} ${rName} 강수확률 ${pop}%! 등산로가 미끄러울 수 있으니 방수 재킷·스패츠를 챙기거나 일정을 점검하세요.`;
      }
      if (t <= 2) {
        return `🧊 ${weatherData.date} ${rName} 정상 예상 ${t}°C! 결빙·블랙아이스 대비 아이젠과 보온병, 방한장비를 꼭 준비하세요.`;
      }
      if (w >= 6) {
        return `💨 ${weatherData.date} ${rName} 능선 예상 풍속 ${w}m/s! 체감온도가 급격히 떨어지니 방풍 재킷(바람막이)이 필수입니다.`;
      }
      return `🥾 ${weatherData.date} ${rName} 정상 예상 ${t}°C로 산행하기 무난한 기상입니다! 평지보다 서늘하니 겹쳐 입을 겉옷을 챙기세요.`;
    } else {
      if (pop >= 60) return `☔ ${weatherData.date}에는 비/눈 예보(강수확률 ${pop}%)가 있습니다. 외출 시 우산을 꼭 챙기세요!`;
      if (t <= 0) return `🥶 ${weatherData.date} 예상 최고기온 ${t}°C로 추운 날씨가 예상됩니다. 따뜻한 겨울 외투를 준비하세요!`;
      if (t >= 28) return `☀️ ${weatherData.date} 예상 최고기온 ${t}°C로 다소 덥겠습니다. 시원한 옷차림과 수분 섭취에 신경 쓰세요!`;
      return `✨ ${weatherData.date} ${rName} 예상 최고기온은 ${t}°C입니다. 일교차에 대비해 가벼운 겉옷을 챙기시면 좋습니다.`;
    }
  };

  const diffBadge = getComparisonBadge();
  const weatherAlert = getWeatherAlert();
  const displayGuideMessage = getActiveGuideMessage();

  return (
    <div className="weather-main-card glass-card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <div style={{ flex: 2, padding: '24px 28px', textAlign: 'center', color: '#1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {weatherAlert && (
          <div style={{ backgroundColor: weatherAlert.bg, color: weatherAlert.color, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', wordBreak: 'keep-all', lineHeight: '1.4' }}>
            {weatherAlert.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <button 
            onClick={onToggleMountainMode}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              border: isMountainMode ? '1px solid rgba(21,128,61,0.5)' : '1px solid rgba(49,130,206,0.5)',
              backgroundColor: isMountainMode ? 'rgba(22,101,52,0.9)' : 'rgba(255,255,255,0.5)', 
              color: isMountainMode ? '#ffffff' : '#1e3a8a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.25s ease'
            }}
          >
            {isMountainMode ? '⛰️ 산악 날씨 모드 (일반 날씨로 전환 ↺)' : '⛰️ 등산·산악 기상 모드 켜기'}
          </button>
        </div>

        <h3 style={{ margin: '0', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '800' }}>{weatherData.region}</span>
          {isMountainMode && mountainInfo?.peak && <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'normal' }}>({mountainInfo.peak})</span>}
          {isMountainMode && weatherData.elevation > 0 && <span style={{ fontSize: '12px', color: '#166534', backgroundColor: 'rgba(187,247,208,0.7)', padding: '3px 9px', borderRadius: '12px', fontWeight: 'bold' }}>해발 {weatherData.elevation}m</span>}
          {isMountainMode && mountainInfo?.difficulty && <span style={{ fontSize: '11px', color: '#9a3412', backgroundColor: 'rgba(255,237,213,0.7)', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>난이도 {mountainInfo.difficulty}</span>}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 14px 0' }}>
          <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.6)', color: '#334155', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <FiCalendar size={14} /> 
              {weatherData.date} {selectedDateIdx === 0 ? '(오늘)' : ''}
              <FiChevronDown size={14} style={{ transform: isDatePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {isDatePickerOpen && weeklyData.length > 0 && (
              <div className="glass-card" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '6px', borderRadius: '8px', width: '180px', zIndex: 50, overflow: 'hidden' }}>
                {weeklyData.map((d, i) => (
                  <div 
                    key={i} 
                    onClick={() => { onSelectDate(i); setIsDatePickerOpen(false); }}
                    style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', backgroundColor: selectedDateIdx === i ? 'rgba(0,0,0,0.05)' : 'transparent', color: selectedDateIdx === i ? '#0f172a' : '#334155', fontWeight: selectedDateIdx === i ? 'bold' : 'normal', borderBottom: i !== weeklyData.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.03)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = selectedDateIdx === i ? 'rgba(0,0,0,0.05)' : 'transparent'}
                  >
                    {d.date} ({d.day}) {i === 0 ? ' - 실시간' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '66px', margin: '0', fontWeight: '800', letterSpacing: '-2px' }}>{weatherData.temp}°<span style={{ fontSize: '32px', fontWeight: 'bold' }}>C</span></h1>
          <span style={{ fontSize: '56px' }}>{weatherData.icon}</span>
        </div>
        
        <p style={{ margin: '8px 0 4px 0', fontWeight: 'bold', fontSize: '15px' }}>
          {isMountainMode ? `정상 ${weatherData.condition}` : weatherData.condition}
        </p>
        <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{weatherData.highLow}</p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', backgroundColor: diffBadge.bg, color: diffBadge.color, borderRadius: '999px', padding: '5px 14px', fontSize: '12.5px', fontWeight: 'bold' }}>
            {diffBadge.text}
          </span>
        </div>
        
        {/* 💡 오늘/미래 날짜 언제든 맞춤형 가이드 멘트 노출 */}
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13.5px', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'center', minHeight: '44px' }}>
          <span style={{ fontWeight: '600', color: '#1e293b', lineHeight: '1.45', wordBreak: 'keep-all' }}>{displayGuideMessage}</span>
        </div>
      </div>
      
      <div className="weather-main-right" style={{ flex: 1, padding: '24px', borderLeft: '1px solid rgba(255,255,255,0.4)', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', minWidth: 0 }}>
        {isMountainMode ? (
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold', margin: '0 0 8px 0' }}>📌 {weatherData.region} 핵심 산행 팁</h4>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#1e293b', lineHeight: '1.5', margin: '0 0 14px 0', wordBreak: 'keep-all' }}>
              {mountainInfo?.course_tip || '정상 부근 기온 하강과 강풍에 대비해 방풍 의류와 스틱을 준비하세요.'}
            </div>

            <h4 style={{ fontSize: '12px', color: '#475569', margin: '0 0 8px 0', fontWeight: 'bold' }}>⛰️ 20대 명산 빠른 선택</h4>
            
            {/* 💡 모바일 전용: 가로 스와이프 알약(Pill) 버튼 바 (스크롤 절약) */}
            <div className="mobile-mtn-pills no-scrollbar" style={{ gap: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
              {mountainsList.map((m, idx) => {
                const isSelected = weatherData.region === m.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectMountain && onSelectMountain(m.name)}
                    style={{
                      flexShrink: 0, padding: '7px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
                      border: isSelected ? '1px solid #15803d' : '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: isSelected ? '#166534' : 'rgba(255,255,255,0.75)',
                      color: isSelected ? '#ffffff' : '#334155',
                      fontWeight: isSelected ? 'bold' : '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {m.name} <span style={{ fontSize: '10.5px', opacity: 0.85 }}>{m.elevation}m</span>
                  </button>
                );
              })}
            </div>

            {/* 💡 데스크톱 전용: 기존 세로 스크롤 리스트 */}
            <ul className="desktop-mtn-list no-scrollbar" style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '13px', maxHeight: '180px', overflowY: 'auto' }}>
              {mountainsList.map((m, idx) => {
                const isSelected = weatherData.region === m.name;
                return (
                  <li key={idx} onClick={() => onSelectMountain && onSelectMountain(m.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', borderRadius: '8px', backgroundColor: isSelected ? 'rgba(22,163,74,0.15)' : 'transparent', color: isSelected ? '#15803d' : '#475569', fontWeight: isSelected ? 'bold' : '500', marginBottom: '4px' }}>
                    <span>{idx + 1}. {m.name}</span><span style={{ fontSize: '11px', color: isSelected ? '#15803d' : '#94a3b8' }}>{m.elevation}m</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div>
            <h4 style={{ fontSize: '12px', color: '#64748b', margin: '0 0 15px 0', fontWeight: 'bold' }}>관심 지역 관리 ({favorites.length}/5)</h4>
            <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '14.5px', lineHeight: '2.5' }}>
              <li onClick={onCurrentLocationClick} style={{ cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold' }}>📍 현재 위치 날씨</li>
              {favorites.length < 5 && <li onClick={onAddClick} style={{ cursor: 'pointer', color: '#2563eb', fontWeight: '500' }}>➕ 새 지역 추가하기</li>}
              {favorites.map((fav, index) => (
                <li key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: index === 0 ? '12px' : '0', padding: '4px 8px', borderRadius: '8px', backgroundColor: weatherData.region === fav.name ? 'rgba(255,255,255,0.5)' : 'transparent' }}>
                  <span onClick={() => onFavoriteClick(fav)} style={{ cursor: 'pointer', flex: 1, color: weatherData.region === fav.name ? '#0f172a' : '#475569', fontWeight: weatherData.region === fav.name ? 'bold' : '500' }}>
                    {index + 1}. {fav.name} {index === 0 ? '(기본)' : ''}
                  </span>
                  {index !== 0 && hoveredIndex === index && (
                    <button onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><FiTrash2 size={16} /></button>
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