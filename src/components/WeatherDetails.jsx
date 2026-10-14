import React from 'react';

function WeatherDetails({ airQuality = {}, current = {} }) {
  return (
    <div
      className="detail-info-card"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: 'fit-content', /* 💡 범인 검거! 100%를 fit-content로 수정해서 내용물 크기에 딱 맞게 변경했습니다 */
        boxSizing: 'border-box'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
        상세 날씨 정보
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
        <span>일출 06:30</span>
        <span>일몰 18:00</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <span>습도: <strong>{current.humidity !== undefined ? current.humidity : 50}%</strong></span>
        <span>풍속: <strong>{current.wind_speed !== undefined ? current.wind_speed : 2} m/s</strong></span>
      </div>
    </div>
  );
}

export default WeatherDetails;