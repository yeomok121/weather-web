import React, { useState, useEffect } from 'react';

function WeatherDetails({ airQuality = {}, current = {} }) {
  const sunrise = current.sunrise || '06:00';
  const sunset = current.sunset || '18:00';
  const [celestial, setCelestial] = useState({ position: 0, icon: '☀️' });

  // 💡 옷차림 추천 로직
  const getClothingRecommendation = (temp) => {
    if (temp >= 28) return '👕 민소매, 린넨, 반바지';
    if (temp >= 23) return '👕 반팔, 얇은 셔츠, 면바지';
    if (temp >= 20) return '👔 얇은 가디건, 긴팔, 청바지';
    if (temp >= 17) return '🧥 얇은 니트, 맨투맨, 가디건';
    if (temp >= 12) return '🧥 자켓, 기모 맨투맨, 야상';
    if (temp >= 9) return '🧥 트렌치코트, 니트, 청바지';
    if (temp >= 5) return '🧣 코트, 가죽자켓, 히트텍';
    return '🧣 패딩, 두꺼운 코트, 목도리';
  };

  // 💡 세차 지수 로직 (강수 및 미세먼지 기준)
  const getCarWashIndex = (desc, pm25) => {
    if (desc.includes('비') || desc.includes('눈')) return { text: '세차 비추천 (비/눈)', color: '#ef4444' };
    if (pm25 >= 36) return { text: '세차 비추천 (먼지)', color: '#f97316' };
    return { text: '✨ 세차하기 좋은 날', color: '#3b82f6' };
  };

  // 💡 러닝(야외 운동) 적합도 로직
  const getRunningIndex = (temp, pm25, wind) => {
    if (pm25 >= 76 || temp >= 33 || temp <= -5) return { text: '🏃 야외 운동 비추천', color: '#ef4444' };
    if (wind >= 9) return { text: '🏃 바람이 강해요', color: '#f97316' };
    if (temp >= 28 || temp <= 5) return { text: '🏃 가벼운 조깅만', color: '#eab308' };
    return { text: '🏃 달리기 완벽한 날씨', color: '#22c55e' };
  };

  const temp = current.temp || 20;
  const pm25 = airQuality.pm25 || 15;
  const wind = current.wind_speed || 2;
  const desc = current.description || '맑음';

  const clothing = getClothingRecommendation(temp);
  const carWash = getCarWashIndex(desc, pm25);
  const running = getRunningIndex(temp, pm25, wind);

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [riseH, riseM] = sunrise.split(':').map(Number);
      const [setH, setM] = sunset.split(':').map(Number);
      const riseMin = riseH * 60 + riseM;
      const setMin = setH * 60 + setM;

      if (currentMinutes >= riseMin && currentMinutes <= setMin) {
        const totalDaylight = setMin - riseMin;
        const passedDaylight = currentMinutes - riseMin;
        return { position: (passedDaylight / totalDaylight) * 100, icon: '☀️' };
      } else {
        const totalNight = (24 * 60 - setMin) + riseMin;
        let passedNight = currentMinutes > setMin ? currentMinutes - setMin : (24 * 60 - setMin) + currentMinutes;
        return { position: (passedNight / totalNight) * 100, icon: '🌙' };
      }
    };

    setCelestial(calculatePosition());
    const interval = setInterval(() => setCelestial(calculatePosition()), 60000);
    return () => clearInterval(interval);
  }, [sunrise, sunset]);

  return (
    <div
      className="detail-info-card"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: 'fit-content',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
        상세 날씨 정보
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
          <span style={{ color: '#64748b' }}>미세먼지 (PM2.5)</span>
          <span style={{ fontWeight: 'bold', color: '#334155' }}>
            {airQuality.level || '보통'} ({pm25})
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(to right, #38bdf8, #22c55e, #eab308, #ef4444)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-3px', left: `${Math.min(100, Math.max(0, (pm25 / 100) * 100))}%`, width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', border: '2px solid #0f172a' }} />
        </div>
      </div>

      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
          <span>일출 {sunrise}</span>
          <span>일몰 {sunset}</span>
        </div>
        <div style={{ position: 'relative', height: '45px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
          <svg width="180" height="45" viewBox="0 0 180 45">
            <path d="M 10 5 Q 90 65 170 5" fill="none" stroke={celestial.icon === '🌙' ? "#94a3b8" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <span style={{ position: 'absolute', bottom: '6px', left: `calc(${celestial.position}% - 14px)`, fontSize: '16px', background: celestial.icon === '🌙' ? '#f8fafc' : '#ffffff', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', lineHeight: 1, transition: 'left 1s ease-in-out' }}>
            {celestial.icon}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <span>습도: <strong>{current.humidity !== undefined ? current.humidity : 50}%</strong></span>
        <span>풍속: <strong>{wind} m/s</strong></span>
      </div>

      {/* 💡 체감형 생활 지수 및 옷차림 추천 배지 영역 추가 */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>생활 지수 추천</h4>
        
        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>{clothing}</span> 추천
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, background: `${carWash.color}15`, border: `1px solid ${carWash.color}30`, color: carWash.color, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
            {carWash.text}
          </div>
          <div style={{ flex: 1, background: `${running.color}15`, border: `1px solid ${running.color}30`, color: running.color, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
            {running.text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherDetails;