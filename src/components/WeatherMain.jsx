import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

function WeatherMain({ weatherData, isAiLoading, aiMessage, favorites, onAddClick, onFavoriteClick, onRemoveFavorite, onCurrentLocationClick }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 💡 데이터를 불러오는 중일 때 보여줄 스켈레톤 뼈대 화면
  if (isAiLoading) {
    return (
      <div style={{ backgroundColor: '#f0f7ff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '30px', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '40%', height: '24px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '30%', height: '16px', margin: '0 auto 20px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '120px', height: '80px', margin: '0 auto 15px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ width: '50%', height: '20px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '44px', marginTop: '20px', borderRadius: '12px' }}></div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0' }}>
          <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '20px', borderRadius: '4px' }}></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '15px', borderRadius: '4px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  // 로딩이 끝나면 보여줄 진짜 데이터 화면
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
        
        {/* 💡 로봇 아이콘 제거 및 텍스트 가운데 정렬 적용 완료 */}
        <div style={{ marginTop: '20px', padding: '12px 16px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center', minHeight: '44px' }}>
          <span style={{ fontWeight: '500', color: '#333', lineHeight: '1.4', wordBreak: 'keep-all' }}>
            {aiMessage}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0', color: '#333' }}>
        <h4 style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 15px 0' }}>관심 지역 관리 ({favorites.length}/5)</h4>
        <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '14px', lineHeight: '2.5' }}>
          <li onClick={onCurrentLocationClick} style={{ cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold' }}>📍 현재 위치</li>
          {favorites.length < 5 && <li onClick={onAddClick} style={{ cursor: 'pointer', color: '#3182ce' }}>➕ 새 지역 추가</li>}
          {favorites.map((fav, index) => (
            <li key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: index === 0 ? '10px' : '0', padding: '2px 0' }}>
              <span onClick={() => onFavoriteClick(fav)} style={{ cursor: 'pointer', flex: 1, color: weatherData.region === fav.name ? '#333' : '#666', fontWeight: weatherData.region === fav.name ? 'bold' : 'normal' }}>
                {index + 1}. {fav.name} {index === 0 ? '(기본)' : ''}
              </span>
              {index !== 0 && hoveredIndex === index && (
                <button onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px' }}>
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