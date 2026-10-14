import React from 'react';

function WeatherDetails({ weatherData }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', color: '#333' }}>
      <h4 style={{ margin: '0 0 20px 0', fontSize: '14px' }}>상세 날씨 정보</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>미세먼지:</span>
          <span style={{ fontWeight: 'bold', color: weatherData.dust.includes("나쁨") ? '#e53e3e' : '#333' }}>
            {weatherData.dust}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>습도:</span>
          <span style={{ fontWeight: 'bold' }}>{weatherData.humidity}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>풍속:</span>
          <span style={{ fontWeight: 'bold' }}>{weatherData.wind}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>자외선 지수:</span>
          <span style={{ fontWeight: 'bold', color: weatherData.uv.includes("높음") ? '#e53e3e' : '#333' }}>
            {weatherData.uv}
          </span>
        </div>
      </div>
    </div>
  );
}

export default WeatherDetails;