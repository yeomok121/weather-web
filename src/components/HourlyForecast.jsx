import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';

const ITEMS_TO_SHOW = 6;
const EMPTY_HOURLY = [];

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// OWM 날씨 아이콘
function ForecastIcon({ code, description }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [code]);
  
  if (!code || hasError) return <span style={{ fontSize: '11px', color: '#999' }}>아이콘 없음</span>;
  
  return (
    <img
      src={`https://openweathermap.org/img/wn/${code}@2x.png`}
      width={45}
      height={45}
      alt={description || '날씨 아이콘'}
      onError={() => setHasError(true)}
      style={{ display: 'block', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}
    />
  );
}

// 💡 꺾은선 그래프 위의 온도 숫자 디자인
const CustomLabel = ({ x, y, value }) => (
  <text x={x} y={y - 12} fill="#334155" fontSize="14" fontWeight="bold" textAnchor="middle">
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
          tempNum: temp, // 차트 그리기용 순수 숫자 데이터
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
          {/* 전체 슬라이드 트랙 영역 */}
          <div style={{
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `translateX(-${(visibleIndex / forecastData.length) * 100}%)`,
            width: `${(forecastData.length / ITEMS_TO_SHOW) * 100}%`,
            position: 'relative'
          }}>
            
            {/* 💡 1. 기온 꺾은선 차트 (배경 레이어) */}
            <div style={{ 
              position: 'absolute', top: '70px', left: 0, right: 0, height: '80px', zIndex: 1,
              // 양쪽 끝 점이 아이콘 중앙과 완벽히 일치하도록 여백 자동 계산
              padding: `0 ${100 / (2 * forecastData.length)}%`, boxSizing: 'border-box'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                  <Line 
                    type="monotone" 
                    dataKey="tempNum" 
                    stroke="#fbbf24" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ffffff', stroke: '#fbbf24', strokeWidth: 2 }} 
                    label={<CustomLabel />} 
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 💡 2. 시간, 아이콘, 강수확률 정보 (텍스트 레이어) */}
            <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
              {forecastData.map((item) => (
                <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{item.time}</span>
                  <div style={{ height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ForecastIcon code={item.icon} description={item.description} />
                  </div>
                  
                  {/* 차트가 그려질 빈 공간(80px) 확보 */}
                  <div style={{ height: '80px' }}></div>
                  
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