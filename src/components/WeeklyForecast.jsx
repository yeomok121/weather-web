import React from 'react';

// 💡 흐릿한 이미지를 선명하고 예쁜 이모지로 변환하는 함수!
export const getEmojiIcon = (code) => {
  if (!code) return '☁️';
  if (code.includes('01d')) return '☀️';
  if (code.includes('01n')) return '🌙'; // 까만 원 대신 예쁜 초승달!
  if (code.includes('02d') || code.includes('03d')) return '⛅';
  if (code.includes('02n') || code.includes('03n')) return '☁️';
  if (code.includes('04')) return '☁️';
  if (code.includes('09') || code.includes('10')) return '🌧️';
  if (code.includes('11')) return '⛈️';
  if (code.includes('13')) return '❄️';
  if (code.includes('50')) return '🌫️';
  return '☁️';
};

function WeeklyForecast({ weeklyData = [], isLoading = false }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>주간 예보 (5일)</h3>
      {isLoading ? (
        <p style={{ fontSize: '14px', color: '#64748b' }}>주간 날씨를 불러오는 중...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {weeklyData.map((day, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: idx !== weeklyData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ width: '50px', fontSize: '14px', fontWeight: day.isToday ? 'bold' : 'normal', color: day.isToday ? '#3182ce' : '#334155' }}>
                {day.isToday ? '오늘' : day.day}
              </span>
              <span style={{ flex: 1, color: '#38bdf8', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                {day.pop > 0 ? `💧 ${day.pop}%` : ''}
              </span>
              <span style={{ fontSize: '20px', width: '40px', textAlign: 'center' }}>
                {getEmojiIcon(day.icon)}
              </span>
              <div style={{ width: '90px', display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>{day.temp_min}°</span>
                <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{day.temp_max}°</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WeeklyForecast;