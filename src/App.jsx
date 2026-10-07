import React, { useState } from 'react';
import LoginCard from './components/LoginCard';
import HourlyForecast from './components/HourlyForecast';
import NoticeModal from './components/NoticeModal';
import WeatherMain from './components/WeatherMain';
import WeatherDetails from './components/WeatherDetails';
import { FiSun, FiCloud, FiCloudRain, FiSearch, FiBell } from 'react-icons/fi';

function App() {
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
    icon: <FiSun style={{ color: '#fbbf24' }} />, 
    uv: "높음",
    humidity: 55,
    dust: "좋음 (22)",
    wind: "10 km/h (서풍)"
  });

  const handleSearch = () => {
    if (searchInput.trim() === "") return;

    const randomTemp = Math.floor(Math.random() * 15) + 10;
    const randomUv = ["낮음", "보통", "높음", "매우높음"][Math.floor(Math.random() * 4)];
    const dustLevels = ["좋음 (15)", "좋음 (25)", "보통 (45)", "보통 (60)", "나쁨 (95)", "매우나쁨 (160)"];
    const randomDust = dustLevels[Math.floor(Math.random() * dustLevels.length)];
    const randomHumidity = Math.floor(Math.random() * 60) + 30;

    const iconList = [
      <FiSun style={{ color: '#fbbf24' }} />, 
      <FiCloud style={{ color: '#9ca3af' }} />, 
      <FiCloudRain style={{ color: '#60a5fa' }} />
    ];

    const newWeatherData = {
      ...weatherData,
      region: searchInput,
      temp: randomTemp,
      icon: iconList[Math.floor(Math.random() * iconList.length)],
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
      if (randomDust.includes("나쁨")) generatedMessage = "미세먼지가 나쁩니다. 보건용 마스크를 꼭 착용하세요! 😷";
      else if (randomTemp >= 23 && randomUv.includes("높음")) generatedMessage = "자외선 차단제를 꼼꼼히 바르세요! 🕶️";
      
      setAiMessage(generatedMessage);
      setIsAiLoading(false); 
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: '#f8f6f0', minHeight: '100vh', position: 'relative' }}>
      
      <nav style={{ backgroundColor: '#1a365d', padding: '15px 40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1120px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '40%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '30px', padding: '5px 20px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="검색할 지역을 입력하세요"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ border: 'none', outline: 'none', flex: 1, padding: '10px', fontSize: '16px', backgroundColor: 'transparent', color: '#333' }}
            />
            <button onClick={handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1a365d' }}>
              <FiSearch size={20} />
            </button>
          </div>
          
          <button onClick={() => setIsNoticeOpen(true)} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBell size={16} /> 공지사항
          </button>
        </div>
      </nav>

      {/* 💡 CSS로 분리한 클래스 적용 (최대 너비 고정 & 모바일 반응형) */}
      <main className="main-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <WeatherMain weatherData={weatherData} isAiLoading={isAiLoading} aiMessage={aiMessage} />
          <HourlyForecast baseTemp={weatherData.temp} currentIcon={weatherData.icon} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <LoginCard />
          <WeatherDetails weatherData={weatherData} />
        </div>
      </main>

      {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
    </div>
  );
}

export default App;