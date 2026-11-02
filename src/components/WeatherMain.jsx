import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

function WeatherMain({
  weatherData,
  hourlyData = [],
  isAiLoading,
  aiMessage,
  favorites,
  onAddClick,
  onFavoriteClick,
  onRemoveFavorite,
  onCurrentLocationClick,
  isMountainMode,
  onToggleMountainMode,
  mountainInfo,
  mountainsList = [],
  onSelectMountain
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (isAiLoading) {
    return (
      <div style={{ backgroundColor: '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '30px', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '40%', height: '24px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '30%', height: '16px', margin: '0 auto 20px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '120px', height: '80px', margin: '0 auto 15px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ width: '50%', height: '20px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '44px', marginTop: '20px', borderRadius: '12px' }}></div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0' }}>
          <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '20px', borderRadius: '4px' }}></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '15px', borderRadius: '4px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  // 💡 일반 모드: 어제 기온 비교 / 산악 모드: 들머리(입구) 평지 대비 기온 하락폭 표시
  const tempDiff = Number(weatherData.tempDiff || 0);
  const getComparisonBadge = () => {
    if (isMountainMode) {
      const baseTemp = weatherData.baseTemp ?? (weatherData.temp + 5);
      const drop = weatherData.summitDrop || Math.max(1, baseTemp - weatherData.temp);
      return {
        text: `⛰️ 산 입구(평지 ${baseTemp}°C)보다 약 ${drop}°C 더 낮아요 ❄️`,
        bg: '#ecfdf5',
        color: '#047857',
        border: '#a7f3d0'
      };
    }
    if (tempDiff > 0) {
      return { text: `어제보다 ${tempDiff}°C 높아요 🔺`, bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
    }
    if (tempDiff < 0) {
      return { text: `어제보다 ${Math.abs(tempDiff)}°C 낮아요 🔻`, bg: '#ebf8ff', color: '#3182ce', border: '#bee3f8' };
    }
    return { text: '어제와 기온이 비슷해요 ➖', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  // 💡 상단 특보/등산 위험도 배너
  const getWeatherAlert = () => {
    const cond = weatherData.condition || '';
    const wind = Number(weatherData.wind_speed || 0);
    const temp = Number(weatherData.temp || 20);
    const humidity = Number(weatherData.humidity || 50);
    const dustStr = weatherData.dust || '';
    const pm25Match = dustStr.match(/\d+/);
    const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;

    const maxPop = Array.isArray(hourlyData) && hourlyData.length > 0
      ? Math.round(Math.max(...hourlyData.slice(0, 6).map(h => Number(h.pop || 0))) * 100)
      : 0;

    if (isMountainMode) {
      if (cond.includes('비') || cond.includes('소나기') || cond.includes('눈') || maxPop >= 60) {
        return { text: '🚨 [등산 주의] 우천·강설 예보로 바위와 등산로가 매우 미끄럽습니다. 입산 통제 여부를 확인하세요!', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      }
      if (temp <= 2) {
        return { text: '🧊 [결빙 주의] 정상 부근 기온이 낮아 블랙아이스(살얼음) 위험이 높습니다. 아이젠과 방한장비를 필히 지참하세요!', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      }
      if (wind >= 7) {
        return { text: `💨 [정상 칼바람 주의] 능선 풍속 ${wind}m/s! 땀이 식으며 저체온증이 올 수 있으니 방풍 재킷을 꼭 착용하세요.`, bg: '#fefce8', color: '#a16207', border: '#fef08a' };
      }
      if (humidity >= 80 && wind <= 3.5) {
        return { text: '🌊 [운해 조망 기대] 습도가 높고 바람이 잔잔해 일출·오전 산행 시 구름바다(운해) 절경을 볼 확률이 높습니다!', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      }
      return { text: `🥾 [산행 안전 안내] 안전 하산 권장 시각은 ${weatherData.safeDescentTime || '15:30'} 이전입니다. 여유 있게 산행을 시작하세요!`, bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
    }

    if (cond.includes('비') || cond.includes('소나기') || cond.includes('눈')) {
      return { text: '☔ 현재 비/눈이 내리고 있습니다. 우산을 챙기세요!', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (maxPop >= 60) {
      return { text: `🌂 곧 비 소식이 있습니다 (강수확률 ${maxPop}%).`, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (pm25 >= 36) {
      return { text: `😷 미세먼지 농도가 높습니다 (${dustStr}). 마스크를 착용하세요!`, bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    }
    if (wind >= 8) {
      return { text: `💨 강풍 주의! 현재 바람이 강하게 불고 있습니다 (${wind}m/s).`, bg: '#fefce8', color: '#a16207', border: '#fef08a' };
    }
    if (temp >= 33) {
      return { text: '🥵 폭염 주의! 한낮 야외 활동을 자제하시고 수분을 섭취하세요.', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    }
    if (temp <= -8) {
      return { text: '🥶 한파 주의! 기온이 매우 낮으니 보온에 유의하세요.', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    }
    return null;
  };

  const diffBadge = getComparisonBadge();
  const weatherAlert = getWeatherAlert();

  return (
    <div style={{ backgroundColor: isMountainMode ? '#f0fdf4' : '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden', transition: 'background-color 0.4s ease' }}>
      <div style={{ flex: 2, padding: '24px 28px', textAlign: 'center', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* 상단 알림 배너 */}
        {weatherAlert && (
          <div style={{
            backgroundColor: weatherAlert.bg, color: weatherAlert.color, border: `1px solid ${weatherAlert.border}`,
            borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', wordBreak: 'keep-all', lineHeight: '1.4'
          }}>
            {weatherAlert.text}
          </div>
        )}

        {/* 산악 모드 전환 토글 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <button 
            onClick={onToggleMountainMode}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              border: isMountainMode ? '1px solid #15803d' : '1px solid #3182ce',
              backgroundColor: isMountainMode ? '#166534' : '#ebf8ff',
              color: isMountainMode ? '#ffffff' : '#2b6cb0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.25s ease'
            }}
          >
            {isMountainMode ? '⛰️ 산악 날씨 모드 (일반 날씨로 전환 ↺)' : '⛰️ 등산·산악 기상 모드 보기'}
          </button>
        </div>

        <h3 style={{ margin: '0', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>{weatherData.region}</span>
          {isMountainMode && mountainInfo?.peak && (
            <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'normal' }}>({mountainInfo.peak})</span>
          )}
          {isMountainMode && weatherData.elevation > 0 && (
            <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#bbf7d0', padding: '3px 9px', borderRadius: '12px', fontWeight: 'bold' }}>
              해발 {weatherData.elevation}m
            </span>
          )}
          {isMountainMode && mountainInfo?.difficulty && (
            <span style={{ fontSize: '11px', color: '#9a3412', backgroundColor: '#ffedd5', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              난이도 {mountainInfo.difficulty}
            </span>
          )}
        </h3>
        <p style={{ margin: '5px 0 14px 0', fontSize: '13px', color: '#64748b' }}>
          {weatherData.date} {isMountainMode && mountainInfo?.terrain ? `· 지형: ${mountainInfo.terrain}` : ''}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '62px', margin: '0' }}>{weatherData.temp}°<span style={{ fontSize: '30px' }}>C</span></h1>
          <span style={{ fontSize: '50px' }}>{weatherData.icon}</span>
        </div>
        
        <p style={{ margin: '8px 0 4px 0', fontWeight: 'bold' }}>
          {isMountainMode ? `정상 ${weatherData.condition}` : weatherData.condition}
        </p>
        <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{weatherData.highLow}</p>

        {/* 기온 비교 배지 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-block', backgroundColor: diffBadge.bg, color: diffBadge.color, border: `1px solid ${diffBadge.border}`,
            borderRadius: '999px', padding: '5px 13px', fontSize: '12px', fontWeight: 'bold'
          }}>
            {diffBadge.text}
          </span>
        </div>
        
        {/* AI 한 줄 멘트 영역 */}
        <div style={{ marginTop: '14px', padding: '12px 16px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13.5px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center', minHeight: '44px' }}>
          <span style={{ fontWeight: '500', color: '#333', lineHeight: '1.45', wordBreak: 'keep-all' }}>
            {aiMessage}
          </span>
        </div>
      </div>
      
      {/* 💡 우측 패널: 일반 모드일 땐 [관심 지역 관리], 산악 모드일 땐 [20대 명산 빠른 선택 & 산행 팁] */}
      <div style={{ flex: 1, backgroundColor: 'white', padding: '18px', borderLeft: '1px solid #e2e8f0', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {isMountainMode ? (
          <>
            <div>
              <h4 style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                📌 {weatherData.region} 핵심 산행 팁
              </h4>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 10px', fontSize: '12px', color: '#334155', lineHeight: '1.45', marginBottom: '12px', wordBreak: 'keep-all' }}>
                {mountainInfo?.course_tip || '정상 부근 기온 하강과 강풍에 대비해 방풍 의류와 스틱을 준비하세요.'}
              </div>

              <h4 style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>
                ⛰️ 20대 명산 빠른 선택 ({mountainsList.length}곳)
              </h4>
              <ul className="no-scrollbar" style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '13px', maxHeight: '175px', overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
                {mountainsList.map((m, idx) => {
                  const isSelected = weatherData.region === m.name;
                  return (
                    <li
                      key={idx}
                      onClick={() => onSelectMountain && onSelectMountain(m.name)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 6px', cursor: 'pointer', borderRadius: '6px',
                        backgroundColor: isSelected ? '#dcfce7' : 'transparent',
                        color: isSelected ? '#166534' : '#475569',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        borderBottom: '1px solid #f8fafc'
                      }}
                    >
                      <span>{idx + 1}. {m.name}</span>
                      <span style={{ fontSize: '11px', color: isSelected ? '#15803d' : '#94a3b8' }}>{m.elevation}m</span>
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
              <li onClick={onCurrentLocationClick} style={{ cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold' }}>
                📍 현재 위치
              </li>
              {favorites.length < 5 && <li onClick={onAddClick} style={{ cursor: 'pointer', color: '#3182ce' }}>➕ 새 지역 추가</li>}
              {favorites.map((fav, index) => (
                <li key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: index === 0 ? '10px' : '0', padding: '2px 0' }}>
                  <span onClick={() => onFavoriteClick(fav)} style={{ cursor: 'pointer', flex: 1, color: weatherData.region === fav.name ? '#333' : '#666', fontWeight: weatherData.region === fav.name ? 'bold' : 'normal' }}>
                    {index + 1}. {fav.name} {index === 0 ? '(기본)' : ''}
                  </span>
                  {index !== 0 && hoveredIndex === index && (
                    <button onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px' }}>
                      <FiTrash2 size={16} />
                    </button>
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