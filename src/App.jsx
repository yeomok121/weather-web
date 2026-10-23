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
import WeeklyForecast, { getEmojiIcon } from './components/WeeklyForecast'; 
import WeatherOutlook from './components/WeatherOutlook'; 
import { FiSearch, FiBell, FiSettings, FiClock, FiCheckCircle } from 'react-icons/fi';
import { API } from './config';


const KOREA_REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '시흥시', '파주시', '광명시', '김포시', '군포시', '광주시', '이천시', '양주시', '오산시', '구리시', '안성시', '포천시', '의왕시', '하남시', '여주시', '양평군', '동두천시', '과천시', '가평군', '연천군',
  '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군',
  '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군',
  '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군',
  '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군',
  '목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군',
  '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군',
  '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군',
  '제주시', '서귀포시'
];

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
  const [autoCompleteList, setAutoCompleteList] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false); 
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminPageOpen, setIsAdminPageOpen] = useState(false);
  const [adminPw, setAdminPw] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '' });
  const [aiMessage, setAiMessage] = useState('✨ 날씨 정보를 불러오는 중입니다...');
  const [aiBriefing, setAiBriefing] = useState('데이터를 불러오는 중입니다...');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [forecastError, setForecastError] = useState('');
  const [bgTheme, setBgTheme] = useState('clear');

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const [weatherData, setWeatherData] = useState({
    region: '불러오는 중...', date: getTodayDateString(), temp: 0, tempDiff: 0,
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

    const savedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (savedUser) setLoggedInUser(savedUser);
  }, []);

  const handleLogin = (user) => {
    setLoggedInUser(user);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
    showToast('로그아웃 되었습니다.');
  };

  const handleUpdateUser = async ({ name, currentPassword, newPassword }) => {
    try {
      const res = await fetch(`${API}/api/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser.id,
          current_password: currentPassword,
          name,
          new_password: newPassword || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '정보 수정에 실패했습니다.');
        return false;
      }
      const updated = { ...loggedInUser, name: data.name };
      localStorage.setItem('loggedInUser', JSON.stringify(updated));
      setLoggedInUser(updated);
      showToast('내 정보가 성공적으로 수정되었습니다.');
      return true;
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    if (!loggedInUser) return;
    if (!window.confirm('정말 회원 탈퇴하시겠습니까? 저장된 관심 지역 정보도 함께 삭제됩니다.')) return;

    const password = window.prompt('본인 확인을 위해 비밀번호를 입력해 주세요.');
    if (!password) return;

    try {
      const res = await fetch(`${API}/api/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser.id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || '회원 탈퇴에 실패했습니다.');
        return;
      }
      localStorage.removeItem(`favorites_${loggedInUser.id}`);
      localStorage.removeItem('loggedInUser');
      setLoggedInUser(null);
      showToast('회원 탈퇴가 완료되었습니다.');
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
    }
  };

  useEffect(() => {
    const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];

    if (loggedInUser) {
      const userKey = `favorites_${loggedInUser.id}`;
      const savedFavs = JSON.parse(localStorage.getItem(userKey));
      if (savedFavs && savedFavs.length > 0) {
        setFavorites(savedFavs);
        loadWeather(savedFavs[0].lat, savedFavs[0].lon, savedFavs[0].name);
      } else {
        setFavorites(defaultFav);
        localStorage.setItem(userKey, JSON.stringify(defaultFav));
        loadWeather(defaultFav[0].lat, defaultFav[0].lon, defaultFav[0].name);
      }
    } else {
      setFavorites(defaultFav);
      loadWeather(defaultFav[0].lat, defaultFav[0].lon, defaultFav[0].name);
    }
  }, [loggedInUser?.id]);

  const saveFavorites = (newFavs) => {
    if (!loggedInUser) return;
    setFavorites(newFavs);
    const userKey = `favorites_${loggedInUser.id}`;
    localStorage.setItem(userKey, JSON.stringify(newFavs));
  };

  const updateWeatherState = (data, regionName) => {
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
      tempDiff: c.temp_diff ?? 0,
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
    setWeeklyData(Array.isArray(data.weekly) ? data.weekly : []); 
  };

  const loadWeather = async (lat, lon, regionName) => {
    setForecastError('');
    
    const cacheKey = `weather_cache_${lat}_${lon}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      updateWeatherState(JSON.parse(cachedData), regionName);
      setAiMessage('✨ AI가 오늘 날씨를 분석하고 있어요...');
      setIsAiLoading(false);
    } else {
      setIsAiLoading(true);
    }

    try {
      const res = await fetch(`${API}/api/weather/summary?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`요청 실패`);
      const data = await res.json();
      
      updateWeatherState(data, regionName);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setIsAiLoading(false);
      
      setAiMessage('✨ AI가 실시간 날씨를 분석 중이에요...');
      setAiBriefing('데이터를 불러오는 중입니다...');
      
      const aiRes = await fetch(`${API}/api/weather/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: data.current, forecast: data.hourly, air_quality: data.air_quality })
      });
      
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const advice = Array.isArray(aiData.advice) ? aiData.advice.join(' ') : (typeof aiData.advice === 'string' ? aiData.advice : '');
        setAiMessage(advice || '오늘도 좋은 하루 보내세요!');
        setAiBriefing(aiData.ai_briefing || 'AI 날씨 전망을 불러오지 못했습니다.');
      }
      
    } catch (error) {
      setForecastError('서버 상태를 확인해주세요.');
      setAiMessage('날씨 정보를 불러오지 못했어요.');
      setIsAiLoading(false);
    }
  };

  const executeSearch = async (query) => {
    if (!query) return;
    setIsSearchFocused(false);
    setSearchInput('');
    try {
      setIsAiLoading(true);
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { showToast('해당 지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
      const loc = await res.json();
      const updatedSearches = [loc.name, ...recentSearches.filter(t => t !== loc.name)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (error) {
      showToast('검색 중 오류가 발생했습니다.');
      setIsAiLoading(false);
    }
  };

  const handleSearch = () => executeSearch(searchInput.trim());

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim() === '') {
      setAutoCompleteList([]);
    } else {
      const filtered = KOREA_REGIONS.filter(region => 
        region.toLowerCase().includes(value.toLowerCase())
      );
      setAutoCompleteList(filtered);
    }
  };

  const handleOpenAddRegion = () => {
    if (!loggedInUser) {
      showToast('로그인 후 관심 지역을 관리할 수 있습니다.');
      return;
    }
    setIsAddRegionOpen(true);
  };

  const handleAddFavorite = async (query) => {
    if (!loggedInUser) {
      showToast('로그인이 필요한 기능입니다.');
      return;
    }
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
    if (!loggedInUser) {
      showToast('로그인 후 관심 지역을 관리할 수 있습니다.');
      return;
    }
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

  const handleAdminAuth = async () => {
    try {
      const res = await fetch(`${API}/api/admin/verify`, {
        method: 'POST',
        headers: { 'x-admin-password': adminPasswordInput },
      });
      if (!res.ok) {
        alert('비밀번호가 틀렸습니다. 접근 권한이 없습니다.');
        setAdminPasswordInput('');
        return;
      }
      setAdminPw(adminPasswordInput);
      setIsAdminAuthOpen(false);
      setAdminPasswordInput('');
      setIsAdminPageOpen(true);
    } catch (e) {
      alert('서버에 연결할 수 없습니다.');
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
        @keyframes skeleton-loading { 0% { background-color: #e2e8f0; } 50% { background-color: #cbd5e1; } 100% { background-color: #e2e8f0; } }
        .skeleton { animation: skeleton-loading 1.5s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, backgroundColor: '#3182ce', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', transform: toast.visible ? 'translateY(0)' : 'translateY(100px)', opacity: toast.visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
        <FiCheckCircle size={18} /> {toast.message}
      </div>

      <nav style={{ backgroundColor: getNavColor(), padding: '15px 40px', display: 'flex', justifyContent: 'center', transition: 'background-color 0.8s ease' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1000px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', display: 'flex', width: '40%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', width: '100%', backgroundColor: 'white', borderRadius: '30px', padding: '5px 20px', alignItems: 'center', zIndex: 10 }}>
              <input 
                type="text" 
                placeholder="검색할 지역을 입력하세요" 
                value={searchInput} 
                onChange={handleInputChange} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                onFocus={() => setIsSearchFocused(true)} 
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)} 
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, padding: '10px', fontSize: '16px', backgroundColor: 'transparent', color: '#333' }} 
              />
              <button type="button" onClick={handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1a365d' }}>
                <FiSearch size={20} />
              </button>
            </div>

            {isSearchFocused && (
              <div className="no-scrollbar" style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginTop: '10px', zIndex: 50, padding: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                {searchInput.trim() === '' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '5px' }}><FiClock /> 최근 검색어</h4>
                      {recentSearches.length > 0 && (
                        <button onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.setItem('recentSearches', '[]'); }} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: '12px', cursor: 'pointer' }}>전체 삭제</button>
                      )}
                    </div>
                    {recentSearches.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {recentSearches.map((term, idx) => (
                          <li key={idx} onMouseDown={(e) => { e.preventDefault(); executeSearch(term); }} style={{ padding: '10px 5px', cursor: 'pointer', color: '#333', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== recentSearches.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                            <span>{term}</span><FiSearch color="#cbd5e1" size={14} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>최근 검색어가 없습니다.</p>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '5px' }}><FiSearch size={12}/> 일치하는 지역명</h4>
                    </div>
                    {autoCompleteList.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {autoCompleteList.map((region, idx) => (
                          <li key={idx} onMouseDown={(e) => { e.preventDefault(); executeSearch(region); }} style={{ padding: '10px 5px', cursor: 'pointer', color: '#333', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }}>
                            <span>
                              {region.split(new RegExp(`(${searchInput})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchInput.toLowerCase() ? <span key={i} style={{ color: '#3182ce', fontWeight: 'bold' }}>{part}</span> : part
                              )}
                            </span>
                            <FiSearch color="#cbd5e1" size={14} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>'{searchInput}' 지역을 찾을 수 없습니다.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <button type="button" onClick={() => setIsNoticeOpen(true)} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBell size={16} /> 공지사항
          </button>
        </div>
      </nav>

      <main className="main-container" style={{ flexGrow: 1, maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, height: '100%' }}>
          <WeatherMain 
            weatherData={weatherData} 
            hourlyData={hourlyData}
            isAiLoading={isAiLoading} 
            aiMessage={aiMessage} 
            favorites={favorites} 
            onAddClick={handleOpenAddRegion} 
            onFavoriteClick={(fav) => loadWeather(fav.lat, fav.lon, fav.name)} 
            onRemoveFavorite={handleRemoveFavorite} 
            onCurrentLocationClick={handleCurrentLocation} 
          />
          <HourlyForecast hourlyData={hourlyData} isLoading={isAiLoading} error={forecastError} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <WeatherOutlook weeklyData={weeklyData} aiBriefing={aiBriefing} />
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, height: '100%' }}>
          <LoginCard 
            onSignUpClick={() => setIsSignUpOpen(true)} 
            onFindPasswordClick={() => setIsFindPasswordOpen(true)} 
            loggedInUser={loggedInUser} 
            onLogin={handleLogin} 
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            onDeleteAccount={handleDeleteAccount}
          />
          <WeatherDetails 
            current={{ 
              temp: weatherData.temp, 
              humidity: weatherData.humidity, 
              wind_speed: weatherData.wind_speed, 
              description: weatherData.condition,
              sunrise: weatherData.sunrise,
              sunset: weatherData.sunset
            }} 
            airQuality={{ 
              level: weatherData.dust.split(' ')[0], 
              pm25: weatherData.dust.match(/\d+/) ? parseInt(weatherData.dust.match(/\d+/)[0]) : 15 
            }} 
          />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <WeeklyForecast weeklyData={weeklyData} isLoading={isAiLoading} />
          </div>
        </div>
      </main>

      <footer style={{ backgroundColor: bgTheme === 'night' ? '#111827' : '#e2e8f0', transition: 'background-color 0.8s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', color: '#718096', fontSize: '13px' }}>
        <div>
          <span>© 2026 Weather Web Project.</span><span style={{ margin: '0 15px' }}>|</span>
          <span style={{ cursor: 'pointer' }} onClick={() => showToast('이용약관 페이지는 준비 중입니다.')}>이용약관</span><span style={{ margin: '0 15px' }}>|</span>
          <span style={{ cursor: 'pointer' }} onClick={() => showToast('개인정보처리방침 페이지는 준비 중입니다.')}>개인정보처리방침</span>
        </div>
        <button onClick={() => setIsAdminAuthOpen(true)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', opacity: 0.1 }} title="Admin"><FiSettings size={18} /></button>
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
      {isAdminPageOpen && (
        <AdminPage adminPassword={adminPw} onClose={() => { setIsAdminPageOpen(false); setAdminPw(''); }} />
      )}
    </div>
  );
}

export default App;