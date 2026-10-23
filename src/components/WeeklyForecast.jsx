import React from 'react';

export const getEmojiIcon = (code) => {
  if (!code) return '☁️';
  if (code.includes('01d')) return '☀️';
  if (code.includes('01n')) return '🌙';
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
  // 💡 5일 전체의 최저 기온과 최고 기온을 구해 온도 막대(Range Bar) 비율 계산
  const allMins = weeklyData.map(d => Number(d.temp_min)).filter(Number.isFinite);
  const allMaxs = weeklyData.map(d => Number(d.temp_max)).filter(Number.isFinite);
  const weekMin = allMins.length > 0 ? Math.min(...allMins) : 0;
  const weekMax = allMaxs.length > 0 ? Math.max(...allMaxs) : 30;
  const totalRange = Math.max(1, weekMax - weekMin);

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>주간 예보 (5일)</h3>
      {isLoading ? (
        <p style={{ fontSize: '14px', color: '#64748b' }}>주간 날씨를 불러오는 중...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', gap: '8px' }}>
          {weeklyData.map((day, idx) => {
            const minVal = Number(day.temp_min);
            const maxVal = Number(day.temp_max);
            const leftPercent = Math.max(0, Math.min(90, ((minVal - weekMin) / totalRange) * 100));
            const widthPercent = Math.max(10, Math.min(100 - leftPercent, ((maxVal - minVal) / totalRange) * 100));

            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  paddingBottom: idx !== weeklyData.length - 1 ? '10px' : '0', 
                  borderBottom: idx !== weeklyData.length - 1 ? '1px solid #f1f5f9' : 'none',
                  gap: '6px'
                }}
              >
                {/* 요일 */}
                <span style={{ width: '36px', fontSize: '14px', fontWeight: day.isToday ? 'bold' : '500', color: day.isToday ? '#3182ce' : '#334155' }}>
                  {day.isToday ? '오늘' : day.day}
                </span>
                
                {/* 강수확률 */}
                <span style={{ width: '48px', color: day.pop > 0 ? '#38bdf8' : '#cbd5e1', fontSize: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                  💧 {day.pop || 0}%
                </span>
                
                {/* 날씨 아이콘 */}
                <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>
                  {getEmojiIcon(day.icon)}
                </span>

                {/* 최저 기온 + 온도 범위 막대(Range Bar) + 최고 기온 */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                  <span style={{ width: '26px', textAlign: 'right', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    {day.temp_min}°
                  </span>

                  <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', position: 'relative', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        bottom: 0, 
                        left: `${leftPercent}%`, 
                        width: `${widthPercent}%`, 
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 60%, #f97316 100%)',
                        transition: 'all 0.4s ease'
                      }} 
                    />
                  </div>

                  <span style={{ width: '26px', textAlign: 'left', fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>
                    {day.temp_max}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WeeklyForecast;