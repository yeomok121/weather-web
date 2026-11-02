import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiCalendar, FiChevronDown, FiVideo, FiExternalLink } from 'react-icons/fi';

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

  // 💡 실시간 CCTV 새 창 팝업 열기 함수 (백엔드/프론트엔드 URL 모두 대응)
  const handleOpenCctv = () => {
    const mountainName = weatherData?.region || mountainInfo?.name || '북한산';
    let cctvUrl = mountainInfo?.cctv_url;

    if (!cctvUrl) {
      if (mountainName === '한라산') {
        cctvUrl = 'https://www.jeju.go.kr/hallasan/info/cctv.htm';
      } else if (['관악산', '대둔산', '마이산'].includes(mountainName)) {
        cctvUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(mountainName + ' 실시간 CCTV')}`;
      } else {
        cctvUrl = 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159';
      }
    }

    window.open(cctvUrl, 'MountainCCTVPopup', 'width=1100,height=780,left=150,top=100,noopener,noreferrer');
  };

  if (isAiLoading) {
    return (
      <div className="weather-main-card" style={{ backgroundColor: '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '30px', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '40%', height: '24px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '30%', height: '16px', margin: '0 auto 20px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '120px', height: '80px', margin: '0 auto 15px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ width: '50%', height: '20px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '44px', marginTop: '20px', borderRadius: '12px' }}></div>
        </div>
        <div className="weather-main-right" style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0' }}>
          <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '20px', borderRadius: '4px' }}></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '15px', borderRadius: '4px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  const tempDiff = Number(weatherData.tempDiff || 0);
  const getComparisonBadge = () => {
    if (weatherData.isFuture) return { text: `🗓️ 해당 일자의 예상 최고기온 기준입니다`, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };

    if (isMountainMode) {
      const baseTemp = weatherData.baseTemp ?? (weatherData.temp + 5);
      const drop = weatherData.summitDrop || Math.max(1, baseTemp - weatherData.temp);
      return { text: `⛰️ 산 입구(평지 ${baseTemp}°C)보다 약 ${drop}°C 더 낮아요 ❄️`, bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    }
    if (tempDiff > 0) return { text: `어제보다 ${tempDiff}°C 높아요 🔺`, bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
    if (tempDiff < 0) return { text: `어제보다 ${Math.abs(tempDiff)}°C 낮아요 🔻`, bg: '#ebf8ff', color: '#3182ce', border: '#bee3f8' };
    return { text: '어제와 기온이 비슷해요 ➖', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  // 💡 산악 모드일 때는 상단 알림 배너를 띄우지 않음 (하단 AI 멘트와 중복 방지!)
  const getWeatherAlert = () => {
    if (weatherData.isFuture || isMountainMode) return null;

    const cond = weatherData.condition || '';
    const wind = Number(weatherData.wind_speed || 0);
    const temp = Number(weatherData.temp || 20);
    const dustStr = weatherData.dust || '';
    const pm25Match = dustStr.match(/\d+/);
    const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
    const maxPop = Array.isArray(hourlyData) && hourlyData.length > 0 ? Math.round(Math.max(...hourlyData.slice(0, 6).map(h => Number(h.pop || 0))) * 100) : 0;

    if (cond.includes('비') || cond.includes('소나기') || cond.includes('눈')) return { text: '☔ 현재 비/눈이 내리고 있습니다. 우산을 챙기세요!', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (maxPop >= 60) return { text: `🌂 곧 비 소식이 있습니다 (강수확률 ${maxPop}%).`, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (pm25 >= 36) return { text: `😷 미세먼지 농도가 높습니다 (${dustStr}). 마스크를 착용하세요!`, bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    if (wind >= 8) return { text: `💨 강풍 주의! 현재 바람이 강하게 불고 있습니다 (${wind}m/s).`, bg: '#fefce8', color: '#a16207', border: '#fef08a' };
    if (temp >= 33) return { text: '🥵 폭염 주의! 한낮 야외 활동을 자제하시고 수분을 섭취하세요.', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    if (temp <= -8) return { text: '🥶 한파 주의! 기온이 매우 낮으니 보온에 유의하세요.', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    return null;
  };

  const diffBadge = getComparisonBadge();
  const weatherAlert = getWeatherAlert();

  return (
    <div className="weather-main-card" style={{ backgroundColor: isMountainMode ? '#f0fdf4' : '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden', transition: 'background-color 0.4s ease' }}>
      <div style={{ flex: 2, padding: '24px 28px', textAlign: 'center', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {weatherAlert && (
          <div style={{ backgroundColor: weatherAlert.bg, color: weatherAlert.color, border: `1px solid ${weatherAlert.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', wordBreak: 'keep-all', lineHeight: '1.4' }}>
            {weatherAlert.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <button 
            onClick={onToggleMountainMode}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              border: isMountainMode ? '1px solid #15803d' : '1px solid #3182ce',
              backgroundColor: isMountainMode ? '#166534' : '#ebf8ff', color: isMountainMode ? '#ffffff' : '#2b6cb0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)', transition: 'all 0.25s ease'
            }}
          >
            {isMountainMode ? '⛰️ 산악 날씨 모드 (일반 날씨로 전환 ↺)' : '⛰️ 등산·산악 기상 모드 보기'}
          </button>
        </div>

        <h3 style={{ margin: '0', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>{weatherData.region}</span>
          {isMountainMode && mountainInfo?.peak && <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'normal' }}>({mountainInfo.peak})</span>}
          {isMountainMode && weatherData.elevation > 0 && <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#bbf7d0', padding: '3px 9px', borderRadius: '12px', fontWeight: 'bold' }}>해발 {weatherData.elevation}m</span>}
          {isMountainMode && mountainInfo?.difficulty && <span style={{ fontSize: '11px', color: '#9a3412', backgroundColor: '#ffedd5', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>난이도 {mountainInfo.difficulty}</span>}
        </h3>
        
        {/* 💡 날짜 선택 드롭다운 + 실시간 CCTV 바로가기 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '10px 0 14px 0' }}>
          <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <FiCalendar size={14} /> 
              {weatherData.date} {selectedDateIdx === 0 ? '(오늘)' : ''}
              <FiChevronDown size={14} style={{ transform: isDatePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {isDatePickerOpen && weeklyData.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '180px', zIndex: 50, overflow: 'hidden' }}>
                {weeklyData.map((d, i) => (
                  <div 
                    key={i} 
                    onClick={() => { onSelectDate(i); setIsDatePickerOpen(false); }}
                    style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', backgroundColor: selectedDateIdx === i ? '#f1f5f9' : '#ffffff', color: selectedDateIdx === i ? '#0f172a' : '#475569', fontWeight: selectedDateIdx === i ? 'bold' : 'normal', borderBottom: i !== weeklyData.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                    onMouseOut={(e) => e.target.style.backgroundColor = selectedDateIdx === i ? '#f1f5f9' : '#ffffff'}
                  >
                    {d.date} ({d.day}) {i === 0 ? ' - 실시간' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isMountainMode && (
            <button
              type="button"
              onClick={handleOpenCctv}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px',
                border: '1px solid #16a34a', backgroundColor: '#ffffff', color: '#15803d',
                fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <FiVideo size={14} /> 실시간 정상 CCTV 보기 <FiExternalLink size={12} />
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '62px', margin: '0' }}>{weatherData.temp}°<span style={{ fontSize: '30px' }}>C</span></h1>
          <span style={{ fontSize: '50px' }}>{weatherData.icon}</span>
        </div>
        
        <p style={{ margin: '8px 0 4px 0', fontWeight: 'bold' }}>
          {isMountainMode ? `정상 ${weatherData.condition}` : weatherData.condition}
        </p>
        <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{weatherData.highLow}</p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', backgroundColor: diffBadge.bg, color: diffBadge.color, border: `1px solid ${diffBadge.border}`, borderRadius: '999px', padding: '5px 13px', fontSize: '12px', fontWeight: 'bold' }}>
            {diffBadge.text}
          </span>
        </div>
        
        {!weatherData.isFuture && (
          <div style={{ marginTop: '14px', padding: '12px 16px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13.5px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center', minHeight: '44px' }}>
            <span style={{ fontWeight: '500', color: '#333', lineHeight: '1.45', wordBreak: 'keep-all' }}>{aiMessage}</span>
          </div>
        )}
      </div>
      
      <div className="weather-main-right" style={{ flex: 1, backgroundColor: 'white', padding: '18px', borderLeft: '1px solid #e2e8f0', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {isMountainMode ? (
          <>
            <div>
              <h4 style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold', margin: '0 0 8px 0' }}>📌 {weatherData.region} 핵심 산행 팁</h4>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 10px', fontSize: '12px', color: '#334155', lineHeight: '1.45', margin: '0 0 8px 0', wordBreak: 'keep-all' }}>
                {mountainInfo?.course_tip || '정상 부근 기온 하강과 강풍에 대비해 방풍 의류와 스틱을 준비하세요.'}
              </div>

              {/* 💡 우측 패널 실시간 CCTV 새 창 팝업 버튼 */}
              <button
                type="button"
                onClick={handleOpenCctv}
                style={{
                  width: '100%', padding: '8px 10px', marginBottom: '12px', borderRadius: '8px',
                  border: '1px solid #16a34a', backgroundColor: '#166534', color: '#ffffff',
                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                }}
              >
                <FiVideo size={14} /> 📷 {weatherData.region} 실시간 CCTV 팝업 열기 <FiExternalLink size={12} />
              </button>

              <h4 style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>⛰️ 20대 명산 빠른 선택</h4>
              <ul className="no-scrollbar" style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '13px', maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
                {mountainsList.map((m, idx) => {
                  const isSelected = weatherData.region === m.name;
                  return (
                    <li key={idx} onClick={() => onSelectMountain && onSelectMountain(m.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 6px', cursor: 'pointer', borderRadius: '6px', backgroundColor: isSelected ? '#dcfce7' : 'transparent', color: isSelected ? '#166534' : '#475569', fontWeight: isSelected ? 'bold' : 'normal', borderBottom: '1px solid #f8fafc' }}>
                      <span>{idx + 1}. {m.name}</span><span style={{ fontSize: '11px', color: isSelected ? '#15803d' : '#94a3b8' }}>{m.elevation}m</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <div>
            <h4 style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 15px 0' }}>관심 지역 관리 ({favorites.length}/5)</h4>
            <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '14px', lineHeight: '2.5' }}>
              <li onClick={onCurrentLocationClick} style={{ cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold' }}>📍 현재 위치</li>
              {favorites.length < 5 && <li onClick={onAddClick} style={{ cursor: 'pointer', color: '#3182ce' }}>➕ 새 지역 추가</li>}
              {favorites.map((fav, index) => (
                <li key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: index === 0 ? '10px' : '0', padding: '2px 0' }}>
                  <span onClick={() => onFavoriteClick(fav)} style={{ cursor: 'pointer', flex: 1, color: weatherData.region === fav.name ? '#333' : '#666', fontWeight: weatherData.region === fav.name ? 'bold' : 'normal' }}>
                    {index + 1}. {fav.name} {index === 0 ? '(기본)' : ''}
                  </span>
                  {index !== 0 && hoveredIndex === index && (
                    <button onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px' }}><FiTrash2 size={16} /></button>
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