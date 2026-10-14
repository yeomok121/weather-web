import React from 'react';

function WeatherDetails({ airQuality = {}, current = {} }) {
  // 백엔드에서 받아온 실제 일출/일몰 시간 (없을 경우 기본값)
  const sunrise = current.sunrise || '06:30';
  const sunset = current.sunset || '18:00';

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

      {/* 미세먼지 영역 */}
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

      {/* 실제 일출 / 일몰 시간 및 곡선 디자인 영역 */}
      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
          <span>일출 {sunrise}</span>
          <span>일몰 {sunset}</span>
        </div>

        {/* 원래 디자인의 점선 곡선과 태양 아이콘 복원 */}
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
              left: '58%',
              fontSize: '16px',
              background: '#ffffff',
              borderRadius: '50%',
              padding: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              lineHeight: 1,
            }}
          >
            ☀️
          </span>
        </div>
      </div>

      {/* 습도 및 풍속 영역 */}
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