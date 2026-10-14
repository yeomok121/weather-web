import React, { useState, useEffect } from 'react';
import LoginCard from './components/LoginCard';
import HourlyForecast from './components/HourlyForecast';
import NoticeModal from './components/NoticeModal';
import WeatherMain from './components/WeatherMain';
import WeatherDetails from './components/WeatherDetails';
import SignUpModal from './components/SignUpModal';
import FindPasswordModal from './components/FindPasswordModal';
import AddRegionModal from './components/AddRegionModal';
import AdminPage from './components/AdminPage';
import WeeklyForecast, { getEmojiIcon } from './components/WeeklyForecast'; // 💡 주간 예보와 이모지 함수 가져오기!
import { FiSearch, FiBell, FiSettings, FiClock, FiCheckCircle } from 'react-icons/fi';

const API = 'https://weather-backend-api-goor.onrender.com';

const getTodayDateString = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const day = days[now.getDay()];
  return `${month}월 ${date}일 ${day}`;
};

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false); 
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminPageOpen, setIsAdminPageOpen] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '' });
  const [aiMessage, setAiMessage] = useState('✨ 날씨 정보를 불러오는 중입니다...');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]); // 💡 주간 예보 데이터 상태 추가
  const [forecastError, setForecastError] = useState('');
  const [bgTheme, setBgTheme] = useState('clear');

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const [weatherData, setWeatherData] = useState({
    region: '불러오는 중...', date: getTodayDateString(), temp: 0,
    condition: '대기 중...', highLow: '최고 -° / 최저 -°',
    icon: <span style={{ fontSize: '60px' }}>☀️</span>, uv: '높음',
    humidity: 0, dust: '확인 중...', wind_speed: 0, 
    sunrise: '06:00', sunset: '18:00'
  });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => { setToast({ visible: false, message: '' }); }, 3000);
  };

  useEffect(() => {
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(storedSearches);
  }, []);

  useEffect(() => {
    const userKey = loggedInUser ? `favorites_${loggedInUser.id}` : 'favorites_guest';
    const savedFavs = JSON.parse(localStorage.getItem(userKey));
    
    if (savedFavs && savedFavs.length > 0) {
      setFavorites(savedFavs);
      loadWeather(savedFavs[0].lat, savedFavs[0].lon, savedFavs[0].name);
    } else {
      const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
      setFavorites(defaultFav);
      loadWeather(defaultFav[0].lat, defaultFav[0].lon, defaultFav[0].name);
    }
  }, [loggedInUser]);

  const saveFavorites = (newFavs) => {
    setFavorites(newFavs);
    const userKey = loggedInUser ? `favorites_${loggedInUser.id}` : 'favorites_guest';
    localStorage.setItem(userKey, JSON.stringify(newFavs));
  };

  const loadWeather = async (lat, lon, regionName) => {
    setIsAiLoading(true); setForecastError(''); setHourlyData([]); setWeeklyData([]);
    try {
      const res = await fetch(`${API}/api/weather/summary?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`요청 실패`);
      const data = await res.json();
      const c = data.current;
      const aqi = data.air_quality;

      const iconCode = c.icon || '';
      if (iconCode.includes('n')) setBgTheme('night');
      else if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) setBgTheme('rain');
      else if (iconCode.includes('03') || iconCode.includes('04')) setBgTheme('cloud');
      else setBgTheme('clear');

      setWeatherData((prev) => ({
        ...prev,
        region: regionName ?? c.city ?? '위치 알 수 없음',
        date: getTodayDateString(),
        temp: Math.round(c.temp),
        // 💡 메인 날씨 카드에도 흐린 이미지 대신 선명하고 예쁜 이모지 적용!
        icon: <span style={{ fontSize: '70px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}>{getEmojiIcon(c.icon)}</span>,
        condition: `${c.description} (체감 ${Math.round(c.feels_like)}°C)`,
        highLow: `최고 ${Math.round(c.temp_max)}° / 최저 ${Math.round(c.temp_min)}°`,
        humidity: c.humidity, 
        wind_speed: c.wind_speed,
        dust: aqi ? `${aqi.level} (${aqi.pm25})` : prev.dust,
        sunrise: c.sunrise || '06:00',
        sunset: c.sunset || '18:00'
      }));
      
      setHourlyData(Array.isArray(data.hourly) ? data.hourly : []);
      setWeeklyData(Array.isArray(data.weekly) ? data.weekly : []); // 💡 주간 데이터 저장
      
      const advice = Array.isArray(data.advice) ? data.advice.join(' ') : (typeof data.advice === 'string' ? data.advice : '');
      setAiMessage(advice || '오늘도 좋은 하루 보내세요!');
    } catch (error) {
      setForecastError('서버 상태를 확인해주세요.');
      setAiMessage('날씨 정보를 불러오지 못했어요.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const executeSearch = async (query) => {
    if (!query || isAiLoading) return;
    setIsSearchFocused(false);
    try {
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { showToast('해당 지역을 찾을 수 없습니다.'); return; }
      
      const loc = await res.json();
      const updatedSearches = [loc.name, ...recentSearches.filter(t => t !== loc.name)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

      await loadWeather(loc.lat, loc.lon, loc.name);
      setSearchInput('');
    } catch (error) {
      showToast('검색 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = () => executeSearch(searchInput.trim());

  const handleAddFavorite = async (query) => {
    try {
      setIsAiLoading(true);
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { showToast('지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
      
      const loc = await res.json();
      if (favorites.some(fav => fav.name === loc.name)) {
        showToast('이미 관심 지역에 등록되어 있습니다.');
        setIsAiLoading(false); return;
      }
      
      const newFavs = [...favorites, { name: loc.name, lat: loc.lat, lon: loc.lon }];
      saveFavorites(newFavs);
      
      setIsAddRegionOpen(false);
      showToast(`'${loc.name}' 지역이 성공적으로 추가되었습니다!`);
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (error) {
      showToast('지역 추가 중 오류가 발생했습니다.');
      setIsAiLoading(false);
    }
  };

  const handleRemoveFavorite = (nameToRemove) => {
    const newFavs = favorites.filter(fav => fav.name !== nameToRemove);
    saveFavorites(newFavs);
    showToast('관심 지역이 삭제되었습니다.');
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('브라우저에서 위치 서비스를 지원하지 않습니다.');
      return;
    }
    setIsAiLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await loadWeather(latitude, longitude, null);
        showToast('현재 위치의 날씨를 성공적으로 불러왔습니다.');
      },
      (error) => {
        setIsAiLoading(false);
        showToast('위치 접근 권한을 허용해 주세요.');
      }
    );
  };

  const handleAdminAuth = () => {
    if (adminPasswordInput === 'rlaxotjd') {
      setIsAdminAuthOpen(false);
      setAdminPasswordInput('');
      setIsAdminPageOpen(true);
    } else {
      alert('비밀번호가 틀렸습니다. 접근 권한이 없습니다.');
      setAdminPasswordInput('');
    }
  };

  const getBgColor = () => {
    switch (bgTheme) {
      case 'night': return '#1a202c'; 
      case 'rain': return '#cbd5e1';  
      case 'cloud': return '#e2e8f0'; 
      default: return '#f8f6f0';      
    }
  };

  const getNavColor = () => {
    switch (bgTheme) {
      case 'night': return '#000000';
      case 'rain': return '#334155';
      case 'cloud': return '#475569';
      default: return '#1a365d';
    }
  };

  return (
    <div style={{ backgroundColor: getBgColor(), minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.8s ease', position: 'relative' }}>
      
      <style>{`
        @keyframes skeleton-loading {
          0% { background-color: #e2e8f0; }
          50% { background-color: #cbd5e1; }
          100% { background-color: #e2e8f0; }
        }
        .skeleton {
          animation: skeleton-loading 1.5s infinite ease-in-out;
        }
      `}</style>

      <div style={{ 
        position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999,
        backgroundColor: '#3182ce', color: 'white', padding: '15px 25px', borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '10px',
        fontWeight: 'bold', fontSize: '14px',
        transform: toast.visible ? 'translateY(0)' : 'translateY(100px)', 
        opacity: toast.visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        <FiCheckCircle size={18} /> {toast.message}
      </div>

      <nav style={{ backgroundColor: getNavColor(), padding: '15px 40px', display: 'flex', justifyContent: 'center', transition: 'background-color 0.8s ease' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1000px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', display: 'flex', width: '40%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', width: '100%', backgroundColor: 'white', borderRadius: '30px', padding: '5px 20px', alignItems: 'center', zIndex: 10 }}>
              <input
                type="text" placeholder="검색할 지역을 입력하세요" value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)}
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, padding: '10px', fontSize: '16px', backgroundColor: 'transparent', color: '#333' }}
              />
              <button type="button" onClick={handleSearch} disabled={isAiLoading} style={{ background: 'transparent', border: 'none', cursor: isAiLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', color: '#1a365d', opacity: isAiLoading ? 0.5 : 1 }}>
                <FiSearch size={20} />
              </button>
            </div>

            {isSearchFocused && recentSearches.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginTop: '10px', zIndex: 50, padding: '15px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiClock /> 최근 검색어
                  </h4>
                  <button onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.setItem('recentSearches', '[]'); }} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: '12px', cursor: 'pointer' }}>
                    전체 삭제
                  </button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recentSearches.map((term, idx) => (
                    <li key={idx} onMouseDown={(e) => { e.preventDefault(); executeSearch(term); }} style={{ padding: '10px 5px', cursor: 'pointer', color: '#333', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{term}</span>
                      <FiSearch color="#cbd5e1" size={14} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setIsNoticeOpen(true)} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBell size={16} /> 공지사항
          </button>
        </div>
      </nav>

      <main className="main-container" style={{ flexGrow: 1, maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <WeatherMain
            weatherData={weatherData} isAiLoading={isAiLoading} aiMessage={aiMessage}
            favorites={favorites} onAddClick={() => setIsAddRegionOpen(true)} 
            onFavoriteClick={(fav) => loadWeather(fav.lat, fav.lon, fav.name)}
            onRemoveFavorite={handleRemoveFavorite} onCurrentLocationClick={handleCurrentLocation}
          />
          <HourlyForecast hourlyData={hourlyData} isLoading={isAiLoading} error={forecastError} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <LoginCard 
            onSignUpClick={() => setIsSignUpOpen(true)} 
            onFindPasswordClick={() => setIsFindPasswordOpen(true)} 
            loggedInUser={loggedInUser}
            onLogin={(user) => setLoggedInUser(user)}
            onLogout={() => { setLoggedInUser(null); showToast('로그아웃 되었습니다.'); }}
          />
          <WeatherDetails current={weatherData} airQuality={{ level: weatherData.dust.split(' ')[0], pm25: weatherData.dust.match(/\d+/) ? weatherData.dust.match(/\d+/)[0] : 15 }} />
          <WeeklyForecast weeklyData={weeklyData} isLoading={isAiLoading} />
        </div>
      </main>

      <footer style={{ backgroundColor: bgTheme === 'night' ? '#111827' : '#e2e8f0', transition: 'background-color 0.8s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', color: '#718096', fontSize: '13px' }}>
        <div>
          <span>© 2026 Weather Web Project.</span>
          <span style={{ margin: '0 15px' }}>|</span><span style={{ cursor: 'pointer' }}>이용약관</span>
          <span style={{ margin: '0 15px' }}>|</span><span style={{ cursor: 'pointer' }}>개인정보처리방침</span>
        </div>
        <button onClick={() => setIsAdminAuthOpen(true)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', opacity: 0.1 }} title="Admin">
          <FiSettings size={18} />
        </button>
      </footer>

      {isAdminAuthOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🔒 관리자 인증</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#666' }}>관리자 권한 확인을 위해 비밀번호를 입력해 주세요.</p>
            <input type="password" placeholder="비밀번호 입력" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsAdminAuthOpen(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
              <button onClick={handleAdminAuth} style={{ flex: 1, padding: '12px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
      {isSignUpOpen && <SignUpModal onClose={() => setIsSignUpOpen(false)} />}
      {isFindPasswordOpen && <FindPasswordModal onClose={() => setIsFindPasswordOpen(false)} />}
      {isAddRegionOpen && <AddRegionModal onClose={() => setIsAddRegionOpen(false)} onAddRegion={handleAddFavorite} isAiLoading={isAiLoading} />}
      {isAdminPageOpen && <AdminPage onClose={() => setIsAdminPageOpen(false)} />}
      
    </div>
  );
}

export default App;