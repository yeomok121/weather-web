import React from 'react';

function App() {
  // 공통 카드 스타일 정의 (재사용을 위해 변수로 분리)
  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={{ backgroundColor: '#f8f6f0', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 1. 상단 네비게이션 바 */}
      <nav style={{ backgroundColor: '#1a365d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 40px' }}>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}><span>🏠</span><span style={{ fontSize: '12px' }}>Home</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#a0aec0' }}><span>📊</span><span style={{ fontSize: '12px' }}>Forecast</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#a0aec0' }}><span>🔔</span><span style={{ fontSize: '12px' }}>Notifications</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#a0aec0' }}><span>⚙️</span><span style={{ fontSize: '12px' }}>Settings</span></div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>📅</span>
          <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '2px 5px', display: 'flex', gap: '5px' }}>
            <span>☀️</span><span>🌙</span>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 그리드 레이아웃 */}
      <main style={{ padding: '30px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* 왼쪽 영역 (현재 날씨 + 시간별 예보) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 현재 날씨 및 위치 관리 섹션 */}
          <div style={{ ...cardStyle, backgroundColor: '#f0f7ff', flexDirection: 'row', padding: '0', overflow: 'hidden' }}>
            {/* 날씨 요약 */}
            <div style={{ flex: 2, padding: '30px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', fontSize: '16px', color: '#333' }}>BUCHEON-SI, KOREA</h3>
              <p style={{ margin: '5px 0 20px 0', fontSize: '14px', color: '#666' }}>Wednesday, September 23</p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '64px', margin: '0' }}>24°<span style={{ fontSize: '32px' }}>C</span></h1>
                <span style={{ fontSize: '40px' }}>⛅</span>
              </div>
              <p style={{ margin: '10px 0 5px 0', fontWeight: 'bold' }}>Clear sky (Feels like 25°C)</p>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>High 26° / Low 17°</p>
              <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <span>📢</span> Light rain expected at 6 PM. Pack an umbrella! <span>☔</span>
              </div>
            </div>
            
            {/* 위치 관리 (LOCATION MANAGE) */}
            <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderLeft: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 15px 0' }}>LOCATION MANAGE</h4>
              <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '14px', lineHeight: '2.5' }}>
                <li style={{ cursor: 'pointer' }}>📍 Current Loc</li>
                <li style={{ cursor: 'pointer', color: '#3182ce' }}>➕ Add New Loc</li>
                <li style={{ fontWeight: 'bold', marginTop: '10px' }}>1. Bucheon-si (HI)</li>
                <li style={{ color: '#666' }}>2. Seoul</li>
                <li style={{ color: '#666' }}>3. Busan</li>
              </ul>
            </div>
          </div>

          {/* 시간대별 예보 (HOURLY FORECAST) */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: '0', fontSize: '14px' }}>HOURLY FORECAST</h4>
              <div style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}><span>&lt;</span><span>&gt;</span></div>
            </div>
            <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>Today</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[
                { time: 'NOW', icon: '☀️', temp: '24°' },
                { time: '14:00', icon: '☀️', temp: '25°' },
                { time: '15:00', icon: '⛅', temp: '25°' },
                { time: '16:00', icon: '☁️', temp: '23°' },
                { time: '17:00', icon: '🌧️', temp: '20°' },
                { time: '18:00', icon: '☁️', temp: '19°' }
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

        {/* 오른쪽 영역 (로그인 + 현재 상태 상세) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 로그인 카드 */}
          <div style={{ ...cardStyle, alignItems: 'center', padding: '30px 20px' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Login</h2>
            <input type="text" placeholder="Username" style={{ width: '80%', padding: '12px', marginBottom: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            <input type="password" placeholder="Password" style={{ width: '80%', padding: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            <button style={{ width: '85%', padding: '12px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
              Log In
            </button>
            <p style={{ margin: '0', fontSize: '12px', color: '#666', cursor: 'pointer' }}>Forgot Password?</p>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#3182ce', cursor: 'pointer' }}>Sign Up</p>
          </div>

          {/* 현재 조건 상세 (CURRENT CONDITIONS) */}
          <div style={{ ...cardStyle, flexGrow: 1, justifyContent: 'center' }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '14px' }}>CURRENT CONDITIONS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>AIR QUALITY:</span>
                <span style={{ fontWeight: 'bold' }}>Good (22)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>HUMIDITY:</span>
                <span style={{ fontWeight: 'bold' }}>55%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>WIND:</span>
                <span style={{ fontWeight: 'bold' }}>10 km/h (W)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>UV INDEX:</span>
                <span style={{ fontWeight: 'bold' }}>High</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;