import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi'; // 💡 휴지통 아이콘 추가

function WeatherMain({ weatherData, isAiLoading, aiMessage, favorites, onAddClick, onFavoriteClick, onRemoveFavorite }) {
  // 💡 현재 마우스가 올라가 있는 리스트의 인덱스를 저장하는 상태
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
        
        <div style={{ marginTop: '20px', padding: '12px 20px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'left', minHeight: '44px' }}>
          <span style={{ fontSize: '18px' }}>{isAiLoading ? '⏳' : '🤖'}</span>
          <span style={{ fontWeight: '500', color: isAiLoading ? '#888' : '#333', transition: 'color 0.3s' }}>
            {isAiLoading ? "AI가 날씨 데이터를 분석 중입니다..." : aiMessage}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0', color: '#333' }}>
        <h4 style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 15px 0' }}>관심 지역 관리 ({favorites.length}/5)</h4>
        <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '14px', lineHeight: '2.5' }}>
          
          <li onClick={() => alert('현재 위치 연동 기능은 준비 중입니다.')} style={{ cursor: 'pointer' }}>📍 현재 위치</li>
          
          {favorites.length < 5 && (
            <li onClick={onAddClick} style={{ cursor: 'pointer', color: '#3182ce' }}>➕ 새 지역 추가</li>
          )}
          
          {favorites.map((fav, index) => (
            <li 
              key={index} 
              // 💡 마우스가 올라가면 현재 index를 저장, 나가면 null로 초기화
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: index === 0 ? '10px' : '0',
                padding: '2px 0'
              }}
            >
              {/* 지역 이름 영역 (클릭 시 날씨 조회) */}
              <span 
                onClick={() => onFavoriteClick(fav)}
                style={{
                  cursor: 'pointer', flex: 1,
                  color: weatherData.region === fav.name ? '#333' : '#666', 
                  fontWeight: weatherData.region === fav.name ? 'bold' : 'normal',
                }}
              >
                {index + 1}. {fav.name} {index === 0 ? '(기본)' : ''}
              </span>

              {/* 💡 기본 지역(index 0)이 아니고, 현재 마우스가 올라간 항목일 때만 휴지통 보이기 */}
              {index !== 0 && hoveredIndex === index && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 💡 중요: 클릭 신호가 부모(지역 조회)로 번지는 것을 막음
                    onRemoveFavorite(fav.name);
                  }}
                  style={{
                    background: 'none', border: 'none', color: '#e53e3e',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px'
                  }}
                  title="관심 지역 삭제"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WeatherMain;