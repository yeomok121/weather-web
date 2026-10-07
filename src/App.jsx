import React, { useState } from 'react';
import LoginCard from './components/LoginCard'; 

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false); 
  
  const [weatherData, setWeatherData] = useState({
    region: "경기도 부천시",
    date: "10월 7일 수요일",
    temp: 24,
    condition: "맑음 (체감 25°C)",
    highLow: "최고 26° / 최저 17°",
    icon: "⛅"
  });

  const handleSearch = () => {
    if (searchInput.trim() === "") return;

    const conditions = ["맑음", "구름많음", "흐림", "비"];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 15) + 10;

    setWeatherData({
      ...weatherData,
      region: searchInput, 
      temp: randomTemp, 
      icon: ["☀️", "⛅", "☁️", "🌧️"][Math.floor(Math.random() * 4)], 
      condition: `${randomCondition} (체감 ${randomTemp + 1}°C)`
    });
    
    setSearchInput(""); 
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={{ backgroundColor: '#f8f6f0', minHeight: '100vh', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* 상단 네비게이션 바 수정됨 */}
      <nav style={{ backgroundColor: '#1a365d', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* 좌측: 검색창 */}
        <div style={{ 
          display: 'flex', width: '40%', maxWidth: '500px', backgroundColor: 'white', 
          borderRadius: '30px', padding: '5px 20px', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
        }}>
          <input
            type="text"
            placeholder="검색할 지역을 입력하세요 (예: 서울, 부산)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ border: 'none', outline: 'none', flex: 1, padding: '10px', fontSize: '16px', backgroundColor: 'transparent', color: '#333' }}
          />
          <button onClick={handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '5px' }}>
            🔍
          </button>
        </div>

        {/* 우측: 공지사항 버튼만 남김 */}
        <button 
          onClick={() => setIsNoticeOpen(true)}
          style={{ 
            backgroundColor: 'transparent', color: 'white', border: '1px solid white', 
            borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          📢 공지사항
        </button>
      </nav>

      <main style={{ padding: '30px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...cardStyle, backgroundColor: '#f0f7ff', flexDirection: 'row', padding: '0', overflow: 'hidden' }}>
            <div style={{ flex: 2, padding: '30px', textAlign: 'center', color: '#333' }}>
              <h3 style={{ margin: '0', fontSize: '18px' }}>{weatherData.region}</h3>
              <p style={{ margin: '5px 0 20px 0', fontSize: '14px', color: '#666' }}>{weatherData.date}</p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '64px', margin: '0' }}>{weatherData.temp}°<span style={{ fontSize: '32px' }}>C</span></h1>
                <span style={{ fontSize: '50px' }}>{weatherData.icon}</span>
              </div>
              <p style={{ margin: '10px 0 5px 0', fontWeight: 'bold' }}>{weatherData.condition}</p>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{weatherData.highLow}</p>
              <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <span>📢</span> 오후 6시에 약한 비가 예상됩니다. 우산을 챙기세요! <span>☔</span>
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

          <div style={{ ...cardStyle, color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: '0', fontSize: '14px' }}>시간대별 예보</h4>
              <div style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}><span>&lt;</span><span>&gt;</span></div>
            </div>
            <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>오늘</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[
                { time: '지금', icon: weatherData.icon, temp: `${weatherData.temp}°` },
                { time: '14:00', icon: '☀️', temp: `${weatherData.temp + 1}°` },
                { time: '15:00', icon: '⛅', temp: `${weatherData.temp + 1}°` },
                { time: '16:00', icon: '☁️', temp: `${weatherData.temp - 1}°` },
                { time: '17:00', icon: '🌧️', temp: `${weatherData.temp - 3}°` },
                { time: '18:00', icon: '☁️', temp: `${weatherData.temp - 4}°` }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #eee', borderRadius: '10px', padding: '10px 15px', minWidth: '50px' }}>
                  <span style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>{item.time}</span>
                  <span style={{ fontSize: '24px', marginBottom: '10px' }}>{item.icon}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.temp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <LoginCard />

          <div style={{ ...cardStyle, flexGrow: 1, justifyContent: 'center', color: '#333' }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '14px' }}>상세 날씨 정보</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>미세먼지:</span>
                <span style={{ fontWeight: 'bold' }}>좋음 (22)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>습도:</span>
                <span style={{ fontWeight: 'bold' }}>55%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>풍속:</span>
                <span style={{ fontWeight: 'bold' }}>10 km/h (서풍)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>자외선 지수:</span>
                <span style={{ fontWeight: 'bold' }}>높음</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isNoticeOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>📢 시스템 공지사항</h2>
              <button onClick={() => setIsNoticeOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                ❌
              </button>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
              <li style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', color: '#e53e3e', marginRight: '5px' }}>[긴급]</span> 태풍 북상에 따른 기상 특보 연동 안내
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>2026.10.07</div>
              </li>
              <li style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', color: '#3182ce', marginRight: '5px' }}>[점검]</span> 기상청 API 서버 정기 점검 안내 (10/10)
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>2026.10.03</div>
              </li>
              <li>
                <span style={{ fontWeight: 'bold', color: '#3182ce', marginRight: '5px' }}>[안내]</span> 관심 지역 등록이 최대 5개로 확장되었습니다.
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>2026.09.28</div>
              </li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;