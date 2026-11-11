import React from 'react';

import { getEmojiIcon } from './weatherIcons';

function WeeklyForecast({ weeklyData = [], isLoading = false }) {
  const allMins = weeklyData.map(d => Number(d.temp_min)).filter(Number.isFinite);
  const allMaxs = weeklyData.map(d => Number(d.temp_max)).filter(Number.isFinite);
  const weekMin = allMins.length > 0 ? Math.min(...allMins) : 0;
  const weekMax = allMaxs.length > 0 ? Math.max(...allMaxs) : 30;
  const totalRange = Math.max(1, weekMax - weekMin);

  return (
    <div className="glass-card" style={{ borderRadius: '16px', padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>주간 예보 (5일)</h3>
      
      {isLoading ? (
        <p style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>주간 날씨를 불러오는 중...</p>
      ) : weeklyData.length === 0 ? <p className="muted">주간 예보 자료가 없습니다. 최신 자료를 받은 뒤 표시합니다.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  paddingBottom: idx !== weeklyData.length - 1 ? '14px' : '0', 
                  borderBottom: idx !== weeklyData.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  gap: '6px'
                }}
              >
                <span style={{ width: '36px', fontSize: '14.5px', fontWeight: day.isToday ? '800' : '600', color: day.isToday ? '#2563eb' : '#334155' }}>
                  {day.isToday ? '오늘' : day.day}
                </span>
                
                {/* 💡 수정된 부분: width를 56px로 늘리고 whiteSpace: 'nowrap'을 추가해 100% 글자 밀림 방지 */}
                <span style={{ width: '56px', whiteSpace: 'nowrap', color: day.pop > 0 ? '#2563eb' : '#94a3b8', fontSize: '12.5px', textAlign: 'left', fontWeight: '800' }}>
                  💧 {day.pop || 0}%
                </span>
                
                <span style={{ fontSize: '22px', width: '30px', textAlign: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                  {getEmojiIcon(day.icon)}
                </span>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                  <span style={{ width: '26px', textAlign: 'right', fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>
                    {day.temp_min}°
                  </span>

                  <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '999px', position: 'relative', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        position: 'absolute', top: 0, bottom: 0, left: `${leftPercent}%`, width: `${widthPercent}%`, 
                        borderRadius: '999px', background: 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 60%, #f97316 100%)',
                      }} 
                    />
                  </div>

                  <span style={{ width: '26px', textAlign: 'left', fontSize: '13.5px', color: '#0f172a', fontWeight: '800' }}>
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