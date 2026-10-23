import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { getEmojiIcon } from './WeeklyForecast';

const ITEMS_TO_SHOW = 6;
const EMPTY_HOURLY = [];

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const CustomLabel = ({ x, y, value }) => (
  <text x={x} y={y - 10} fill="#334155" fontSize="14" fontWeight="bold" textAnchor="middle">
    {value}°
  </text>
);

function HourlyForecast({ hourlyData = EMPTY_HOURLY, isLoading = false, error = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [hourlyData]);

  const rawForecastData = Array.isArray(hourlyData)
    ? hourlyData.filter(item => item && typeof item === 'object').map((item, index) => {
        const temp = toNumber(item.temp);
        const pop = toNumber(item.pop);
        return {
          id: index,
          time: item.time || '시간 없음',
          icon: item.icon,
          description: item.description,
          tempNum: temp,
          pop: pop === null ? 0 : Math.round(Math.max(0, Math.min(1, pop)) * 100),
        };
      })
    : [];

  const maxIndex = Math.max(0, rawForecastData.length - ITEMS_TO_SHOW);
  const visibleIndex = Math.min(currentIndex, maxIndex);

  // 💡 현재 화면에 보이는 6개 시간대의 기온만으로 Y축 최소/최대 범위를 동적 계산!
  const visibleSlice = rawForecastData.slice(visibleIndex, visibleIndex + ITEMS_TO_SHOW);
  const visibleTemps = visibleSlice.map(d => d.tempNum).filter(v => v !== null);
  const sliceMin = visibleTemps.length > 0 ? Math.min(...visibleTemps) : 10;
  const sliceMax = visibleTemps.length > 0 ? Math.max(...visibleTemps) : 20;

  // 기온 차이가 거의 없을 때도 선이 가운데에 예쁘게 위치하고, 1~2도 차이도 역동적으로 보이도록 설정
  const yMin = sliceMax === sliceMin ? sliceMin - 2 : sliceMin - 0.8;
  const yMax = sliceMax === sliceMin ? sliceMax + 2 : sliceMax + 1.2;

  // 화면 밖의 시간대 데이터가 차트 위아래 영역을 뚫고 나가지 않도록 보정(Clamping)하되 실제 숫자 라벨은 그대로 유지
  const forecastData = rawForecastData.map(item => ({
    ...item,
    plotTemp: item.tempNum === null ? null : Math.min(yMax - 0.2, Math.max(yMin + 0.2, item.tempNum))
  }));

  const handlePrev = () => setCurrentIndex(Math.max(0, visibleIndex - ITEMS_TO_SHOW));
  const handleNext = () => setCurrentIndex(Math.min(maxIndex, visibleIndex + ITEMS_TO_SHOW));

  const prevDisabled = isLoading || visibleIndex === 0;
  const nextDisabled = isLoading || visibleIndex >= maxIndex;

  const buttonStyle = {
    background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
    display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333', transition: 'background-color 0.2s',
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', color: '#333', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .hourly-chart-wrapper .recharts-surface {
          overflow: visible !important;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>시간대별 예보 (기온 변화)</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handlePrev} disabled={prevDisabled} style={{ ...buttonStyle, opacity: prevDisabled ? 0.3 : 1, cursor: prevDisabled ? 'default' : 'pointer' }}>
            <FiChevronLeft size={20} />
          </button>
          <button type="button" onClick={handleNext} disabled={nextDisabled} style={{ ...buttonStyle, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}>
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>예보를 불러오는 중입니다...</p>
      ) : error ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#dc2626' }}>{error}</p>
      ) : forecastData.length === 0 ? (
        <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>예보 데이터가 없습니다.</p>
      ) : (
        <div className="hourly-chart-wrapper" style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div style={{
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `translateX(-${(visibleIndex / forecastData.length) * 100}%)`,
            width: `${(forecastData.length / ITEMS_TO_SHOW) * 100}%`,
            position: 'relative'
          }}>
            
            <div style={{ 
              position: 'absolute', top: '68px', left: 0, right: 0, height: '100px', zIndex: 1,
              padding: `0 ${100 / (2 * forecastData.length)}%`, boxSizing: 'border-box'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 28, bottom: 16, left: 0, right: 0 }}>
                  <YAxis domain={[yMin, yMax]} allowDataOverflow={true} hide />
                  <Line 
                    type="monotone" 
                    dataKey="plotTemp" 
                    stroke="#fbbf24" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ffffff', stroke: '#fbbf24', strokeWidth: 2 }} 
                    label={(props) => <CustomLabel {...props} value={forecastData[props.index]?.tempNum} />} 
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
              {forecastData.map((item) => (
                <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', height: '20px', lineHeight: '20px', marginBottom: '8px' }}>{item.time}</span>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                    {getEmojiIcon(item.icon)}
                  </div>
                  
                  <div style={{ height: '100px', marginBottom: '8px' }}></div>
                  
                  <span style={{ 
                    fontSize: '12px', 
                    color: item.pop > 0 ? '#38bdf8' : '#94a3b8', 
                    fontWeight: item.pop > 0 ? 'bold' : 'normal', 
                    minHeight: '18px' 
                  }}>
                    💧 {item.pop ?? 0}%
                  </span>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default HourlyForecast;