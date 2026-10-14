import React, { useState } from 'react';

function WeatherDetails({ hourly = [], airQuality = {}, current = {} }) {
  // 한 화면에 표시할 시간 카드 개수 (예: 6개씩 슬라이드)
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 6;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - itemsPerPage));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(hourly.length - itemsPerPage, prev + itemsPerPage)
    );
  };

  const visibleHourly = hourly.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="weather-details-container" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
      {/* 좌측: 시간대별 예보 (1시간 간격) */}
      <div
        className="hourly-forecast-card"
        style={{
          flex: '1.2',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
            시간대별 예보 (1시간 간격)
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              style={{
                border: '1px solid #e2e8f0',
                background: startIndex === 0 ? '#f1f5f9' : '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: startIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: startIndex === 0 ? '#94a3b8' : '#334155',
              }}
            >
              &lt;
            </button>
            <button
              onClick={handleNext}
              disabled={startIndex + itemsPerPage >= hourly.length}
              style={{
                border: '1px solid #e2e8f0',
                background: startIndex + itemsPerPage >= hourly.length ? '#f1f5f9' : '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: startIndex + itemsPerPage >= hourly.length ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: startIndex + itemsPerPage >= hourly.length ? '#94a3b8' : '#334155',
              }}
            >
              &gt;
            </button>
          </div>
        </div>

        {hourly && hourly.length > 0 ? (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            {visibleHourly.map((item, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  {item.time}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#f97316',
                    marginBottom: '10px',
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                  {Math.round(item.temp)}°
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                  💧 {Math.round((item.pop || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>
            시간대별 예보 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 우측: 상세 날씨 정보 (미세먼지, 일출/일몰, 습도, 풍속) */}
      <div
        className="detail-info-card"
        style={{
          flex: '0.8',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
    </div>
  );
}

export default WeatherDetails;