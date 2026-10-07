import React, { useState, useEffect } from 'react';
// 💡 화살표 아이콘과 날씨 아이콘 불러오기
import { FiSun, FiCloud, FiCloudRain, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function HourlyForecast({ baseTemp, currentIcon }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forecastData, setForecastData] = useState([]);

  useEffect(() => {
    // 💡 랜덤 생성을 위한 아이콘 세팅
    const iconList = [
      <FiSun style={{ color: '#fbbf24' }} />, 
      <FiCloud style={{ color: '#9ca3af' }} />, 
      <FiCloudRain style={{ color: '#60a5fa' }} />
    ];
    
    const data = [];
    let currentHour = new Date().getHours(); 

    for (let i = 0; i < 24; i++) {
      const time = i === 0 ? '지금' : `${String((currentHour + i) % 24).padStart(2, '0')}:00`;
      const tempVariation = Math.floor(Math.sin(i) * 3); 
      
      data.push({
        id: i,
        time: time,
        icon: i === 0 ? currentIcon : iconList[Math.floor(Math.random() * iconList.length)],
        temp: `${baseTemp + tempVariation}°`
      });
    }
    setForecastData(data);
    setCurrentIndex(0); 
  }, [baseTemp, currentIcon]);

  const itemsToShow = 6; 
  const maxIndex = 24 - itemsToShow; 

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - itemsToShow));
  const handleNext = () => setCurrentIndex(prev => Math.min(maxIndex, prev + itemsToShow));

  const btnStyle = {
    background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
    display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333', transition: 'background-color 0.2s',
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', color: '#333', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: '0', fontSize: '14px' }}>시간대별 예보</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          
          {/* 💡 꺾쇠 괄호를 깔끔한 벡터 화살표 아이콘으로 교체 */}
          <button 
            onClick={handlePrev} disabled={currentIndex === 0}
            style={{ ...btnStyle, opacity: currentIndex === 0 ? 0.3 : 1, cursor: currentIndex === 0 ? 'default' : 'pointer' }}
          >
            <FiChevronLeft size={20} />
          </button>
          
          <button 
            onClick={handleNext} disabled={currentIndex >= maxIndex}
            style={{ ...btnStyle, opacity: currentIndex >= maxIndex ? 0.3 : 1, cursor: currentIndex >= maxIndex ? 'default' : 'pointer' }}
          >
            <FiChevronRight size={20} />
          </button>

        </div>
      </div>
      
      <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>오늘 ~ 내일</p>
      
      <div style={{ overflow: 'hidden', width: '100%', padding: '5px 0' }}>
        <div style={{ display: 'flex', transition: 'transform 0.4s ease-in-out', transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}>
          {forecastData.map((item) => (
            <div key={item.id} style={{ flex: `0 0 calc(100% / ${itemsToShow})`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 5px', boxSizing: 'border-box' }}>
              <div style={{ border: '1px solid #eee', borderRadius: '10px', padding: '10px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>{item.time}</span>
                <span style={{ fontSize: '24px', marginBottom: '10px' }}>{item.icon}</span>
                <span style={{ fontWeight: 'bold' }}>{item.temp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HourlyForecast;