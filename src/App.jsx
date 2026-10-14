import React, { useState, useEffect } from 'react';
import LoginCard from './components/LoginCard';
import HourlyForecast from './components/HourlyForecast';
import NoticeModal from './components/NoticeModal';
import WeatherMain from './components/WeatherMain';
import WeatherDetails from './components/WeatherDetails';
import SignUpModal from './components/SignUpModal';
import FindPasswordModal from './components/FindPasswordModal';
import AddRegionModal from './components/AddRegionModal';
import AdminPage from './components/AdminPage'; // 💡 관리자 페이지 추가
import { FiSun, FiSearch, FiBell, FiSettings } from 'react-icons/fi'; // 💡 톱니바퀴 추가

const API = 'http://127.0.0.1:8000';

const iconUrl = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

function App() {
  const [searchInput, setSearchInput] = useState('');
  
  // 모달창 및 페이지 상태
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false); // 💡 관리자 페이지 열림/닫힘 상태

  const [aiMessage, setAiMessage] = useState('✨ 날씨 정보를 불러오는 중입니다...');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hourlyData, setHourlyData] = useState([]);
  const [forecastError, setForecastError] = useState('');

  // 관심 지역 배열
  const [favorites, setFavorites] = useState([
    { name: '부천시', lat: 37.5034, lon: 126.7660 }
  ]);

  const [weatherData, setWeatherData] = useState({
    region: '경기도 부천시', date: '10월 7일 수요일', temp: 24,
    condition: '맑음 (체감 25°C)', highLow: '최고 26° / 최저 17°',
    icon: <FiSun style={{ color: '#fbbf24' }} />, uv: '높음',
    humidity: 55, dust: '좋음 (22)', wind: '10 m/s',
  });

  const loadWeather = async (lat, lon, regionName) => {
    setIsAiLoading(true); setForecastError(''); setHourlyData([]);
    try {
      const res = await fetch(`${API}/api/weather/summary?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`날씨 요청 실패: ${res.status}`);
      const data = await res.json();
      const c = data.current;
      if (!c) throw new Error('현재 날씨 데이터가 없습니다.');

      setWeatherData((prev) => ({
        ...prev,
        region: regionName ?? c.city,
        temp: Math.round(c.temp),
        icon: c.icon ? <img src={iconUrl(c.icon)} width={60} height={60} alt="아이콘" /> : <span>정보 없음</span>,
        condition: `${c.description} (체감 ${Math.round(c.feels_like)}°C)`,
        highLow: `최고 ${Math.round(c.temp_max)}° / 최저 ${Math.round(c.temp_min)}°`,
        humidity: c.humidity, wind: `${c.wind_speed} m/s`,
      }));
      setHourlyData(Array.isArray(data.hourly) ? data.hourly : []);
      const advice = Array.isArray(data.advice) ? data.advice.join(' ') : (typeof data.advice === 'string' ? data.advice : '');
      setAiMessage(advice || '오늘도 좋은 하루 보내세요!');
    } catch (error) {
      console.error('오류:', error);
      setHourlyData([]); setForecastError('서버 상태를 확인해주세요.');
      setAiMessage('날씨 정보를 불러오지 못했어요.');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(37.5034, 126.7660, '경기도 부천시');
  }, []);

  const handleSearch = async () => {
    const query = searchInput.trim();
    if (!query || isAiLoading) return;
    try {
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { setAiMessage('지역을 찾을 수 없어요.'); return; }
      const loc = await res.json();
      await loadWeather(loc.lat, loc.lon, loc.name);
      setSearchInput('');
    } catch (error) {
      setAiMessage('지역 검색 중 오류가 발생했습니다.');
    }
  };

  const handleAddFavorite = async (query) => {
    try {
      setIsAiLoading(true);
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { alert('지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
      
      const loc = await res.json();
      if (favorites.some(fav => fav.name === loc.name)) {
        alert('이미 관심 지역에 등록되어 있습니다.');
        setIsAiLoading(false); return;
      }
      
      setFavorites(prev => [...prev, { name: loc.name, lat: loc.lat, lon: loc.lon }]);
      setIsAddRegionOpen(false);
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (error) {
      alert('지역 검색 중 오류가 발생했습니다.');
      setIsAiLoading(false);
    }
  };

  const handleRemoveFavorite = (nameToRemove) => {
    setFavorites(prev => prev.filter(fav => fav.name !== nameToRemove));
  };

  return (
    // 💡 화면 꽉 차게 만들고 아래쪽 Footer를 바닥으로 밀어내기 위해 Flex 속성 적용
    <div style={{ backgroundColor: '#f8f6f0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <nav style={{ backgroundColor: '#1a365d', padding: '15px 40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1120px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', width: '40%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '30px', padding: '5px 20px', alignItems: 'center' }}>
            <input
              type="text" placeholder="검색할 지역을 입력하세요" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, padding: '10px', fontSize: '16px', backgroundColor: 'transparent', color: '#333' }}
            />
            <button type="button" onClick={handleSearch} disabled={isAiLoading} style={{ background: 'transparent', border: 'none', cursor: isAiLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', color: '#1a365d', opacity: isAiLoading ? 0.5 : 1 }}>
              <FiSearch size={20} />
            </button>
          </div>

          <button type="button" onClick={() => setIsNoticeOpen(true)} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBell size={16} /> 공지사항
          </button>

        </div>
      </nav>

      {/* 💡 flexGrow: 1을 주어 메인 콘텐츠가 화면 중간을 다 차지하게 함 */}
      <main className="main-container" style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <WeatherMain
            weatherData={weatherData} isAiLoading={isAiLoading} aiMessage={aiMessage}
            favorites={favorites} 
            onAddClick={() => setIsAddRegionOpen(true)} 
            onFavoriteClick={(fav) => loadWeather(fav.lat, fav.lon, fav.name)}
            onRemoveFavorite={handleRemoveFavorite}
          />
          <HourlyForecast hourlyData={hourlyData} isLoading={isAiLoading} error={forecastError} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <LoginCard 
            onSignUpClick={() => setIsSignUpOpen(true)} 
            onFindPasswordClick={() => setIsFindPasswordOpen(true)} 
          />
          <WeatherDetails weatherData={weatherData} />
        </div>
      </main>

      {/* 💡 화면 하단을 멋지게 장식할 Footer (여기에 관리자 버튼이 숨겨져 있습니다) */}
      <footer style={{ padding: '20px 40px', backgroundColor: '#e2e8f0', color: '#718096', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span>© 2026 Weather Web Project.</span>
          <span style={{ margin: '0 15px' }}>|</span>
          <span style={{ cursor: 'pointer' }}>이용약관</span>
          <span style={{ margin: '0 15px' }}>|</span>
          <span style={{ cursor: 'pointer' }}>개인정보처리방침</span>
        </div>
        
        {/* 일반인 눈에는 잘 안 보이게 투명도를 0.1로 낮춘 이스터 에그 버튼 */}
        <button 
          onClick={() => setIsAdminOpen(true)} 
          style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', opacity: 0.1 }} 
          title="Admin"
        >
          <FiSettings size={18} />
        </button>
      </footer>

      {/* 팝업 모달창들 */}
      {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
      {isSignUpOpen && <SignUpModal onClose={() => setIsSignUpOpen(false)} />}
      {isFindPasswordOpen && <FindPasswordModal onClose={() => setIsFindPasswordOpen(false)} />}
      {isAddRegionOpen && (
        <AddRegionModal onClose={() => setIsAddRegionOpen(false)} onAddRegion={handleAddFavorite} isAiLoading={isAiLoading} />
      )}
      
      {/* 💡 관리자 페이지 렌더링 */}
      {isAdminOpen && <AdminPage onClose={() => setIsAdminOpen(false)} />}
      
    </div>
  );
}

export default App;