import React, { useState, useEffect } from 'react';

function WeatherDetails({ airQuality = {}, current = {} }) {
  const sunrise = current.sunrise || '06:00';
  const sunset = current.sunset || '18:00';
  
  // 💡 현재 시간에 따라 태양의 위치(0% ~ 100%)를 계산하는 상태 추가
  const [sunPosition, setSunPosition] = useState(0);

  useEffect(() => {
    const calculateSunPosition = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [riseH, riseM] = sunrise.split(':').map(Number);
      const [setH, setM] = sunset.split(':').map(Number);

      const sunriseMinutes = riseH * 60 + riseM;
      const sunsetMinutes = setH * 60 + setM;

      // 해 뜨기 전이면 0% (왼쪽 끝), 해 지고 난 후면 100% (오른쪽 끝)
      if (currentMinutes <= sunriseMinutes) return 0;
      if (currentMinutes >= sunsetMinutes) return 100;

      const totalDaylight = sunsetMinutes - sunriseMinutes;
      const passedDaylight = currentMinutes - sunriseMinutes;

      return (passedDaylight / totalDaylight) * 100;
    };

    setSunPosition(calculateSunPosition());
    
    // 1분마다 태양 위치 갱신
    const interval = setInterval(() => {
      setSunPosition(calculateSunPosition());
    }, 60000);

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
            {airQuality.level || '보통'} ({airQuality.pm25 !== undefined ? airQuality.pm25 : 15})
          </span>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: '3px',
            background: 'linear-gradient(to right, #38bdf8, #22c55e, #eab308, #ef4444)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              left: `${Math.min(100, Math.max(0, ((airQuality.pm25 || 15) / 100) * 100))}%`,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '2px solid #0f172a',
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
          <span>일출 {sunrise}</span>
          <span>일몰 {sunset}</span>
        </div>

        <div style={{ position: 'relative', height: '45px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
          <svg width="180" height="45" viewBox="0 0 180 45">
            <path
              d="M 10 5 Q 90 65 170 5"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
          <span
            style={{
              position: 'absolute',
              bottom: '6px',
              // 💡 계산된 태양의 % 위치를 적용 (아이콘 크기 보정을 위해 calc 사용)
              left: `calc(${sunPosition}% - 14px)`,
              fontSize: '16px',
              background: '#ffffff',
              borderRadius: '50%',
              padding: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              lineHeight: 1,
              transition: 'left 1s ease-in-out' // 부드럽게 이동하는 애니메이션
            }}
          >
            ☀️
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#334155',
          marginTop: '12px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <span>
          습도: <strong>{current.humidity !== undefined ? current.humidity : 50}%</strong>
        </span>
        <span>
          풍속: <strong>{current.wind_speed !== undefined ? current.wind_speed : 2} m/s</strong>
        </span>
      </div>
    </div>
  );
}

export default WeatherDetails;