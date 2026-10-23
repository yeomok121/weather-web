import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

function WeatherMain({ weatherData, hourlyData = [], isAiLoading, aiMessage, favorites, onAddClick, onFavoriteClick, onRemoveFavorite, onCurrentLocationClick }) {
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

  // 💡 1. 어제 기온 비교 문구 및 색상 생성
  const tempDiff = Number(weatherData.tempDiff || 0);
  const getTempDiffBadge = () => {
    if (tempDiff > 0) {
      return { text: `어제보다 ${tempDiff}°C 높아요 🔺`, bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
    }
    if (tempDiff < 0) {
      return { text: `어제보다 ${Math.abs(tempDiff)}°C 낮아요 🔻`, bg: '#ebf8ff', color: '#3182ce', border: '#bee3f8' };
    }
    return { text: '어제와 기온이 비슷해요 ➖', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  // 💡 2. 악천후 / 기상 주의 알림 배너 자동 판별
  const getWeatherAlert = () => {
    const cond = weatherData.condition || '';
    const wind = Number(weatherData.wind_speed || 0);
    const temp = Number(weatherData.temp || 20);
    const dustStr = weatherData.dust || '';
    const pm25Match = dustStr.match(/\d+/);
    const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;

    const maxPop = Array.isArray(hourlyData) && hourlyData.length > 0
      ? Math.round(Math.max(...hourlyData.slice(0, 6).map(h => Number(h.pop || 0))) * 100)
      : 0;

    if (cond.includes('비') || cond.includes('소나기') || cond.includes('눈')) {
      return {
        text: '☔ 현재 비/눈이 내리고 있습니다. 외출 시 우산을 꼭 챙기세요!',
        bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe'
      };
    }
    if (maxPop >= 60) {
      return {
        text: `🌂 곧 비 소식이 있습니다 (강수확률 ${maxPop}%). 우산을 미리 챙기세요!`,
        bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe'
      };
    }
    if (pm25 >= 36) {
      return {
        text: `😷 미세먼지 농도가 높습니다 (${dustStr}). 외출 시 마스크를 착용하세요!`,
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa'
      };
    }
    if (wind >= 8) {
      return {
        text: `💨 강풍 주의! 현재 바람이 강하게 불고 있습니다 (${wind}m/s).`,
        bg: '#fefce8', color: '#a16207', border: '#fef08a'
      };
    }
    if (temp >= 33) {
      return {
        text: '🥵 폭염 주의! 한낮 야외 활동을 자제하시고 수분을 자주 섭취하세요.',
        bg: '#fef2f2', color: '#b91c1c', border: '#fecaca'
      };
    }
    if (temp <= -8) {
      return {
        text: '🥶 한파 주의! 기온이 매우 낮으니 보온에 각별히 유의하세요.',
        bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe'
      };
    }
    return null;
  };

  const diffBadge = getTempDiffBadge();
  const weatherAlert = getWeatherAlert();

  return (
    <div style={{ backgroundColor: '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <div style={{ flex: 2, padding: '26px 30px', textAlign: 'center', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* 🚨 악천후/기상 특보 감지 시 상단에 자동 노출되는 배너 */}
        {weatherAlert && (
          <div style={{
            backgroundColor: weatherAlert.bg,
            color: weatherAlert.color,
            border: `1px solid ${weatherAlert.border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '14px',
            wordBreak: 'keep-all'
          }}>
            {weatherAlert.text}
          </div>
        )}

        <h3 style={{ margin: '0', fontSize: '18px' }}>{weatherData.region}</h3>
        <p style={{ margin: '5px 0 16px 0', fontSize: '14px', color: '#666' }}>{weatherData.date}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '64px', margin: '0' }}>{weatherData.temp}°<span style={{ fontSize: '32px' }}>C</span></h1>
          <span style={{ fontSize: '50px' }}>{weatherData.icon}</span>
        </div>
        
        <p style={{ margin: '10px 0 4px 0', fontWeight: 'bold' }}>{weatherData.condition}</p>
        <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{weatherData.highLow}</p>

        {/* 💡 어제 기온 비교 배지 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-block',
            backgroundColor: diffBadge.bg,
            color: diffBadge.color,
            border: `1px solid ${diffBadge.border}`,
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {diffBadge.text}
          </span>
        </div>
        
        {/* AI 한 줄 멘트 영역 */}
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center', minHeight: '44px' }}>
          <span style={{ fontWeight: '500', color: '#333', lineHeight: '1.4', wordBreak: 'keep-all' }}>
            {aiMessage}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0', color: '#333' }}>
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
                <button onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px' }}>
                  <FiTrash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WeatherMain;