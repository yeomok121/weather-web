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

  const forecastData = Array.isArray(hourlyData)
    ? hourlyData.filter(item => item && typeof item === 'object').map((item, index) => {
        const temp = toNumber(item.temp);
        const pop = toNumber(item.pop);
        return {
          id: index,
          time: item.time || '시간 없음',
          icon: item.icon,
          description: item.description,
          tempNum: temp,
          pop: pop === null ? null : Math.round(Math.max(0, Math.min(1, pop)) * 100),
        };
      })
    : [];

  const maxIndex = Math.max(0, forecastData.length - ITEMS_TO_SHOW);
  const visibleIndex = Math.min(currentIndex, maxIndex);

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
        <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
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
                {/* 💡 LineChart에 style={{ overflow: 'visible' }} 추가! 차트 영역을 벗어난 글씨도 완벽하게 보이게 해줍니다. */}
                <LineChart data={forecastData} margin={{ top: 28, bottom: 16, left: 0, right: 0 }} style={{ overflow: 'visible' }}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line type="monotone" dataKey="tempNum" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#ffffff', stroke: '#fbbf24', strokeWidth: 2 }} label={<CustomLabel />} isAnimationActive={false} />
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
                  
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', minHeight: '18px' }}>
                    {item.pop > 0 ? `💧 ${item.pop}%` : ''}
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