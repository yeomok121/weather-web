import React, { useState } from 'react';
import LoginCard from './components/LoginCard';
import HourlyForecast from './components/HourlyForecast';
import NoticeModal from './components/NoticeModal';
import WeatherMain from './components/WeatherMain';
import WeatherDetails from './components/WeatherDetails';

function App() {
  // 1. 상태(Data) 관리 로직
  const [searchInput, setSearchInput] = useState("");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("✨ 완벽한 가을 날씨네요. 가벼운 산책을 추천합니다!");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [weatherData, setWeatherData] = useState({
    region: "경기도 부천시",
    date: "10월 7일 수요일",
    temp: 24,
    condition: "맑음 (체감 25°C)",
    highLow: "최고 26° / 최저 17°",
    icon: "⛅",
    uv: "높음",
    humidity: 55,
    dust: "좋음 (22)",
    wind: "10 km/h (서풍)"
  });

  // 2. 검색 및 데이터 통신 로직
  const handleSearch = () => {
    if (searchInput.trim() === "") return;

    const randomTemp = Math.floor(Math.random() * 15) + 10;
    const randomUv = ["낮음", "보통", "높음", "매우높음"][Math.floor(Math.random() * 4)];
    const dustLevels = ["좋음 (15)", "좋음 (25)", "보통 (45)", "보통 (60)", "나쁨 (95)", "매우나쁨 (160)"];
    const randomDust = dustLevels[Math.floor(Math.random() * dustLevels.length)];
    const randomHumidity = Math.floor(Math.random() * 60) + 30;

    const newWeatherData = {
      ...weatherData,
      region: searchInput,
      temp: randomTemp,
      icon: ["☀️", "⛅", "☁️", "🌧️"][Math.floor(Math.random() * 4)],
      condition: `날씨 상태 (체감 ${randomTemp + 1}°C)`,
      uv: randomUv,
      humidity: randomHumidity,
      dust: randomDust,
      wind: `${Math.floor(Math.random() * 15) + 1} km/h (서풍)`
    };

    setWeatherData(newWeatherData);
    setSearchInput("");
    setIsAiLoading(true); 
    
    setTimeout(() => {
      let generatedMessage = "✨ 쾌적한 날씨입니다. 즐거운 하루 보내세요!";
      if (newWeatherData.icon === "🌧️") generatedMessage = "외출 시 튼튼한 우산을 꼭 챙기세요! ☔";
      else if (randomDust.includes("나쁨")) generatedMessage = "미세먼지가 나쁩니다. 보건용 마스크를 착용하세요! 😷";
      else if (randomTemp >= 23 && randomUv.includes("높음")) generatedMessage = "자외선 차단제를 꼼꼼히 바르세요! 🕶️";
      
      setAiMessage(generatedMessage);
      setIsAiLoading(false); 
    }, 1500);
  };

  // 3. 화면 UI 조립(렌더링) 영역
  return (
    <div style={{ backgroundColor: '#f8f6f0', minHeight: '100vh', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* 상단 네비게이션 */}
      <nav style={{ backgroundColor: '#1a365d', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: '40%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '30px', padding: '5px 20px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="검색할 지역을 입력하세요"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ border: 'none', outline: 'none', flex: 1, padding: '10px', fontSize: '16px', backgroundColor: 'transparent', color: '#333' }}
          />
          <button onClick={handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🔍</button>
        </div>
        <button onClick={() => setIsNoticeOpen(true)} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>📢 공지사항</button>
      </nav>

      {/* 메인 콘텐츠 그리드 */}
      <main style={{ padding: '30px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* 왼쪽 영역: 날씨 메인 카드 + 시간대별 예보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <WeatherMain weatherData={weatherData} isAiLoading={isAiLoading} aiMessage={aiMessage} />
          <HourlyForecast baseTemp={weatherData.temp} currentIcon={weatherData.icon} />
        </div>

        {/* 오른쪽 영역: 로그인 카드 + 상세 날씨 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <LoginCard />
          <WeatherDetails weatherData={weatherData} />
        </div>
      </main>

      {/* 공지사항 모달창 렌더링 (isNoticeOpen이 true일 때만 팝업 등장) */}
      {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
    </div>
  );
}

export default App;