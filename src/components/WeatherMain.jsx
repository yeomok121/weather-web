import React from 'react';

function WeatherMain({ weatherData, isAiLoading, aiMessage }) {
  return (
    <div style={{ backgroundColor: '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <div style={{ flex: 2, padding: '30px', textAlign: 'center', color: '#333' }}>
        <h3 style={{ margin: '0', fontSize: '18px' }}>{weatherData.region}</h3>
        <p style={{ margin: '5px 0 20px 0', fontSize: '14px', color: '#666' }}>{weatherData.date}</p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '64px', margin: '0' }}>{weatherData.temp}°<span style={{ fontSize: '32px' }}>C</span></h1>
          <span style={{ fontSize: '50px' }}>{weatherData.icon}</span>
        </div>
        <p style={{ margin: '10px 0 5px 0', fontWeight: 'bold' }}>{weatherData.condition}</p>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{weatherData.highLow}</p>
        
        <div style={{ 
          marginTop: '20px', padding: '12px 20px', 
          background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', 
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', 
          fontSize: '14px', border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'left', minHeight: '44px'
        }}>
          <span style={{ fontSize: '18px' }}>{isAiLoading ? '⏳' : '🤖'}</span>
          <span style={{ fontWeight: '500', color: isAiLoading ? '#888' : '#333', transition: 'color 0.3s' }}>
            {isAiLoading ? "AI가 날씨 데이터를 기반으로 맞춤형 정보를 분석 중입니다..." : aiMessage}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0', color: '#333' }}>
        <h4 style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 15px 0' }}>관심 지역 관리</h4>
        <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '14px', lineHeight: '2.5' }}>
          <li style={{ cursor: 'pointer' }}>📍 현재 위치</li>
          <li style={{ cursor: 'pointer', color: '#3182ce' }}>➕ 새 지역 추가</li>
          <li style={{ fontWeight: 'bold', marginTop: '10px' }}>1. 부천시 (기본)</li>
          <li style={{ color: '#666', cursor: 'pointer' }}>2. 서울특별시</li>
          <li style={{ color: '#666', cursor: 'pointer' }}>3. 부산광역시</li>
        </ul>
      </div>
    </div>
  );
}

export default WeatherMain;