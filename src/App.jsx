import React, { useState, useEffect, useMemo } from 'react';
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

export const MOUNTAINS_LIST = [
  { name: '북한산', elevation: 836, peak: '백운대', region: '서울/경기', terrain: '화강암 암릉', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '백운대 정상 부근 바위가 미끄러우니 접지력이 좋은 등산화와 장갑을 착용하세요.', courses: [{ name: '백운대 최단 코스 (탐방지원센터)', distance: '4km', time: 180, diff: '중상' }, { name: '대남문 능선 코스 (구기동)', distance: '8.5km', time: 270, diff: '중' }, { name: '숨은벽 능선 코스 (밤골)', distance: '7.6km', time: 240, diff: '상' }] },
  { name: '설악산', elevation: 1708, peak: '대청봉', region: '강원 속초/인제', terrain: '고산 암릉', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '정상 능선에 강한 칼바람이 불어 사계절 방풍 재킷이 필수입니다.', courses: [{ name: '대청봉 최단 (오색 코스)', distance: '10km', time: 480, diff: '상' }, { name: '한계령~대청봉 종주 코스', distance: '13.5km', time: 660, diff: '최상' }] },
  { name: '한라산', elevation: 1947, peak: '백록담', region: '제주', terrain: '화산지형', difficulty: '상', cctv_url: 'https://www.jeju.go.kr/hallasan/info/cctv.htm', course_tip: '성판악 코스는 탐방 예약이 필수이며, 정상은 평지보다 12°C 이상 낮습니다.', courses: [{ name: '성판악~백록담 코스', distance: '19.2km', time: 540, diff: '중상' }, { name: '관음사~백록담 코스', distance: '17.4km', time: 600, diff: '상' }] },
  { name: '지리산', elevation: 1915, peak: '천왕봉', region: '경남/전남/전북', terrain: '고산 능선', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '장거리 산행이므로 일몰 시간과 체력을 고려해 헤드랜턴을 준비하세요.', courses: [{ name: '중산리~천왕봉 단거리', distance: '10.8km', time: 480, diff: '상' }, { name: '백무동~천왕봉 코스', distance: '15km', time: 570, diff: '중상' }] },
  { name: '계룡산', elevation: 845, peak: '관음봉', region: '충남 공주', terrain: '암릉·가파른 계단', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '자연성릉 바위 능선과 고깔바위 계단이 가팔라 체력 소모가 큽니다.', courses: [{ name: '동학사~관음봉 순환 코스', distance: '8.5km', time: 300, diff: '중상' }, { name: '갑사~관음봉 코스', distance: '7km', time: 240, diff: '중' }] },
  { name: '덕유산', elevation: 1614, peak: '향적봉', region: '전북 무주', terrain: '아고산대 능선', difficulty: '중하', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '정상 능선은 습도가 높고 상고대·강풍이 잦아 보온에 유의하세요.', courses: [{ name: '곤돌라~향적봉 코스', distance: '1.2km', time: 40, diff: '하' }, { name: '구천동~향적봉 코스', distance: '17km', time: 510, diff: '중상' }] },
  { name: '소백산', elevation: 1439, peak: '비로봉', region: '충북 단양', terrain: '초원 능선(육산)', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '나무가 없는 탁 트인 능선이라 방풍·방한모를 꼭 챙기세요.', courses: [{ name: '어의곡~비로봉 코스', distance: '10km', time: 300, diff: '중' }] },
  { name: '태백산', elevation: 1567, peak: '장군봉', region: '강원 태백', terrain: '완만한 육산', difficulty: '중하', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '경사가 완만해 초보자도 오르기 좋으며 일출 조망이 뛰어납니다.', courses: [{ name: '유일사~천제단 코스', distance: '8km', time: 240, diff: '중하' }] },
  { name: '오대산', elevation: 1563, peak: '비로봉', region: '강원 평창', terrain: '부드러운 흙길', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '흙길이 잘 정비되어 있으나 정상 직전 오르막이 가파릅니다.', courses: [{ name: '상원사~비로봉 코스', distance: '7km', time: 210, diff: '중' }] },
  { name: '치악산', elevation: 1288, peak: '비로봉', region: '강원 원주', terrain: '급경사 철계단', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '급경사 철계단이 이어지므로 무릎 보호대와 스틱이 필수입니다.', courses: [{ name: '구룡사~사다리병창 코스', distance: '11km', time: 360, diff: '상' }] },
  { name: '월악산', elevation: 1097, peak: '영봉', region: '충북 제천', terrain: '험준한 암릉', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '수백 개의 가파른 철계단과 충주호 골바람에 주의하세요.', courses: [{ name: '보덕암~영봉 코스', distance: '8km', time: 330, diff: '상' }] },
  { name: '속리산', elevation: 1058, peak: '문장대', region: '충북 보은', terrain: '기암괴석·암릉', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '문장대 바위 정상 난간 구간에서 강풍이 불 때 안전에 유의하세요.', courses: [{ name: '법주사~문장대 코스', distance: '12km', time: 330, diff: '중' }] },
  { name: '가야산', elevation: 1430, peak: '상왕봉', region: '경남 합천', terrain: '뾰족한 암봉', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '정상 부근 암릉 구간이 험준하므로 미끄럼을 조심하세요.', courses: [{ name: '백운동~상왕봉 코스', distance: '7.5km', time: 270, diff: '중상' }] },
  { name: '무등산', elevation: 1187, peak: '서석대', region: '광주/전남', terrain: '주상절리대', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '서석대 능선은 그늘이 적고 바람이 강해 방풍 준비가 필요합니다.', courses: [{ name: '증심사~서석대 코스', distance: '12km', time: 330, diff: '중' }] },
  { name: '주왕산', elevation: 721, peak: '주봉', region: '경북 청송', terrain: '협곡·흙길', difficulty: '하', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '험한 구간이 적어 초보자 산행에 적합하며 아침 물안개가 자주 낍니다.', courses: [{ name: '대전사~주봉 코스', distance: '9km', time: 270, diff: '하' }] },
  { name: '도봉산', elevation: 740, peak: '신선대', region: '서울/경기', terrain: '거대 화강암', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '신선대 오름길은 가파른 쇠난간을 잡아야 하므로 장갑을 권장합니다.', courses: [{ name: '도봉탐방센터~신선대', distance: '6.5km', time: 210, diff: '중상' }] },
  { name: '관악산', elevation: 632, peak: '연주대', region: '서울/경기과천', terrain: '바위 능선', difficulty: '중', cctv_url: 'https://www.youtube.com/results?search_query=%EA%B4%80%EC%95%85%EC%82%B0+%EC%97%B0%EC%A3%BC%EB%8C%80+%EC%8B%A4%EC%8B%9C%EA%B0%84', course_tip: '사당 코스는 노출된 바위 능선이 많아 비 온 뒤 미끄럼에 주의하세요.', courses: [{ name: '서울대~연주대 코스', distance: '6km', time: 210, diff: '중' }] },
  { name: '대둔산', elevation: 878, peak: '마천대', region: '충남/전북', terrain: '구름다리·철계단', difficulty: '중', cctv_url: 'https://www.youtube.com/results?search_query=%EB%8C%80%EB%91%94%EC%82%B0+%EB%A7%88%EC%B2%9C%EB%8C%80+%EC%8B%A4%EC%8B%9C%EA%B0%84', course_tip: '삼선계단은 경사가 매우 가파르고 일방통행이므로 우회로를 체크하세요.', courses: [{ name: '케이블카~마천대 코스', distance: '2km', time: 90, diff: '하' }, { name: '수락계곡~마천대 코스', distance: '7km', time: 240, diff: '중' }] },
  { name: '내장산', elevation: 763, peak: '신선봉', region: '전북 정읍', terrain: '단풍 계곡·암릉', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '신선봉 정상으로 오르는 능선은 경사가 급하고 습기가 많습니다.', courses: [{ name: '일주문~신선봉 코스', distance: '8km', time: 270, diff: '중' }] },
  { name: '마이산', elevation: 686, peak: '암마이봉', region: '전북 진안', terrain: '역암 바위', difficulty: '중하', cctv_url: 'https://www.youtube.com/results?search_query=%EB%A7%88%EC%9D%B4%EC%82%B0+%EC%8B%A4%EC%8B%9C%EA%B0%84', course_tip: '암마이봉 구간은 겨울철 결빙 시 통제될 수 있으니 노면을 확인하세요.', courses: [{ name: '탑사~암마이봉 코스', distance: '5km', time: 150, diff: '중하' }] }
];

const MOUNTAINS = MOUNTAINS_LIST.map(m => m.name);

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

  const [isMountainMode, setIsMountainMode] = useState(false);
  const [mountainInfo, setMountainInfo] = useState(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0); 

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
    region: '불러오는 중...', date: getTodayDateString(), temp: 0, feelsLike: 0, tempDiff: 0,
    baseTemp: 0, summitDrop: 0, safeDescentTime: '15:30',
    condition: '대기 중...', highLow: '최고 -° / 최저 -°',
    icon: <span style={{ fontSize: '60px' }}>☀️</span>, uv: '높음',
    humidity: 0, dust: '확인 중...', wind_speed: 0, 
    sunrise: '06:00', sunset: '18:00', elevation: 0
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser.id, current_password: currentPassword, name, new_password: newPassword || null }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || '정보 수정에 실패했습니다.'); return false; }
      const updated = { ...loggedInUser, name: data.name };
      localStorage.setItem('loggedInUser', JSON.stringify(updated));
      setLoggedInUser(updated);
      showToast('내 정보가 성공적으로 수정되었습니다.');
      return true;
    } catch (e) {
      alert('서버에 연결할 수 없습니다.'); return false;
    }
  };

  const handleDeleteAccount = async () => {
    if (!loggedInUser) return;
    if (!window.confirm('정말 회원 탈퇴하시겠습니까? 저장된 관심 지역 정보도 함께 삭제됩니다.')) return;
    const password = window.prompt('본인 확인을 위해 비밀번호를 입력해 주세요.');
    if (!password) return;

    try {
      const res = await fetch(`${API}/api/users/delete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser.id, password }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || '회원 탈퇴에 실패했습니다.'); return; }
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
    localStorage.setItem(`favorites_${loggedInUser.id}`, JSON.stringify(newFavs));
  };

  const updateWeatherState = (data, regionName, elevation = 0, mInfo = null) => {
    const c = data.current;
    const aqi = data.air_quality;
    const iconCode = c.icon || '';
    if (iconCode.includes('n')) setBgTheme('night');
    else if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) setBgTheme('rain');
    else if (iconCode.includes('03') || iconCode.includes('04')) setBgTheme('cloud');
    else setBgTheme('clear');

    setMountainInfo(mInfo);
    setSelectedDateIdx(0);

    setWeatherData((prev) => ({
      ...prev,
      region: regionName ?? c.city ?? '위치 알 수 없음',
      date: getTodayDateString(),
      temp: Math.round(c.temp),
      feelsLike: Math.round(c.feels_like),
      tempDiff: c.temp_diff ?? 0,
      baseTemp: c.base_temp ?? Math.round(c.temp),
      summitDrop: c.summit_drop ?? 0,
      safeDescentTime: c.safe_descent_time || '15:30',
      icon: <span style={{ fontSize: '70px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}>{getEmojiIcon(c.icon)}</span>,
      condition: `${c.description} (체감 ${Math.round(c.feels_like)}°C)`,
      highLow: `최고 ${Math.round(c.temp_max)}° / 최저 ${Math.round(c.temp_min)}°`,
      humidity: c.humidity, 
      wind_speed: c.wind_speed,
      dust: aqi ? `${aqi.level} (${aqi.pm25})` : (prev.dust || '보통 (15)'),
      sunrise: c.sunrise || '06:00',
      sunset: c.sunset || '18:00',
      elevation: elevation
    }));
    
    setHourlyData(Array.isArray(data.hourly) ? data.hourly : []);
    setWeeklyData(Array.isArray(data.weekly) ? data.weekly : []); 
  };

  const loadWeather = async (lat, lon, regionName) => {
    setForecastError('');
    setIsAiLoading(true);
    try {
      const res = await fetch(`${API}/api/weather/summary?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`요청 실패`);
      const data = await res.json();
      
      updateWeatherState(data, regionName, 0, null);
      setIsAiLoading(false);
      setAiMessage('✨ AI가 실시간 날씨를 분석 중이에요...');
      
      const aiRes = await fetch(`${API}/api/weather/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: data.current, forecast: data.hourly, air_quality: data.air_quality, mountain_info: null })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiMessage(aiData.advice?.[0] || '오늘도 좋은 하루 보내세요!');
        setAiBriefing(aiData.ai_briefing || 'AI 날씨 전망을 불러오지 못했습니다.');
      }
    } catch (error) {
      setForecastError('서버 상태를 확인해주세요.');
      setIsAiLoading(false);
    }
  };

  const loadMountainWeather = async (mountainName) => {
    setForecastError('');
    const localMInfo = MOUNTAINS_LIST.find(m => m.name === mountainName) || MOUNTAINS_LIST[0];
    setIsAiLoading(true);
    try {
      const res = await fetch(`${API}/api/mountain/summary?name=${encodeURIComponent(mountainName)}`);
      if (!res.ok) { showToast('해당 산의 날씨 데이터를 찾을 수 없습니다.'); setIsAiLoading(false); return; }
      const data = await res.json();
      const mergedMInfo = { ...localMInfo, ...data.mountain_info };
      
      updateWeatherState(data, data.mountain_name, data.elevation, mergedMInfo);
      setIsAiLoading(false);
      setAiMessage(`🧗 AI 산악 가이드가 ${data.mountain_name} 등산 환경을 분석 중이에요...`);
      
      const aiRes = await fetch(`${API}/api/weather/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: data.current, forecast: data.hourly, air_quality: data.air_quality || { level: '좋음', pm25: 10 }, mountain_info: mergedMInfo })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiMessage(aiData.advice?.[0] || '안전한 산행 되세요!');
        setAiBriefing(aiData.ai_briefing || '산악 전망을 불러오지 못했습니다.');
      }
    } catch (error) {
      setForecastError('서버 상태를 확인해주세요.');
      setIsAiLoading(false);
    }
  };

  const handleToggleMountainMode = () => {
    const nextMode = !isMountainMode;
    setIsMountainMode(nextMode);
    setSearchInput('');
    setAutoCompleteList([]);

    if (nextMode) {
      loadMountainWeather(mountainInfo?.name || '북한산');
      showToast('⛰️ 산악 기상 모드로 전환되었습니다.');
    } else {
      const targetFav = favorites[0] || { name: '부천시', lat: 37.5034, lon: 126.7660 };
      loadWeather(targetFav.lat, targetFav.lon, targetFav.name);
      showToast('🏕️ 일반 도시 날씨 모드로 전환되었습니다.');
    }
  };

  const executeSearch = async (query) => {
    if (!query) return;
    setIsSearchFocused(false);
    setSearchInput('');
    try {
      setIsAiLoading(true);
      if (isMountainMode) {
        const res = await fetch(`${API}/api/mountain/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) { showToast('지원하지 않는 산 이름입니다.'); setIsAiLoading(false); return; }
        const loc = await res.json();
        await loadMountainWeather(loc.name);
      } else {
        const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) { showToast('해당 지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
        const loc = await res.json();
        const updatedSearches = [loc.name, ...recentSearches.filter(t => t !== loc.name)].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        await loadWeather(loc.lat, loc.lon, loc.name);
      }
    } catch (error) { showToast('검색 중 오류가 발생했습니다.'); setIsAiLoading(false); }
  };

  const handleSearch = () => executeSearch(searchInput.trim());

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value.trim() === '') setAutoCompleteList([]);
    else {
      const sourceList = isMountainMode ? MOUNTAINS : KOREA_REGIONS;
      setAutoCompleteList(sourceList.filter(region => region.toLowerCase().includes(value.toLowerCase())));
    }
  };

  const handleOpenAddRegion = () => {
    if (!loggedInUser) { showToast('로그인 후 관심 지역을 관리할 수 있습니다.'); return; }
    setIsAddRegionOpen(true);
  };

  const handleAddFavorite = async (query) => {
    if (!loggedInUser) { showToast('로그인이 필요한 기능입니다.'); return; }
    try {
      setIsAiLoading(true);
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { showToast('지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
      const loc = await res.json();
      if (favorites.some(fav => fav.name === loc.name)) { showToast('이미 관심 지역에 등록되어 있습니다.'); setIsAiLoading(false); return; }
      const newFavs = [...favorites, { name: loc.name, lat: loc.lat, lon: loc.lon }];
      saveFavorites(newFavs);
      setIsAddRegionOpen(false);
      showToast(`'${loc.name}' 지역이 성공적으로 추가되었습니다!`);
      if (isMountainMode) setIsMountainMode(false);
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (error) { showToast('지역 추가 중 오류가 발생했습니다.'); setIsAiLoading(false); }
  };

  const handleRemoveFavorite = (nameToRemove) => {
    if (!loggedInUser) { showToast('로그인 후 관심 지역을 관리할 수 있습니다.'); return; }
    const newFavs = favorites.filter(fav => fav.name !== nameToRemove);
    saveFavorites(newFavs);
    showToast('관심 지역이 삭제되었습니다.');
  };

  const handleCurrentLocation = () => {
    if (isMountainMode) { showToast('산악 모드에서는 우측 20대 명산 목록을 선택해 주세요.'); return; }
    if (!navigator.geolocation) { showToast('브라우저에서 위치 서비스를 지원하지 않습니다.'); return; }
    setIsAiLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await loadWeather(latitude, longitude, null);
        showToast('현재 위치의 날씨를 성공적으로 불러왔습니다.');
      },
      (error) => { setIsAiLoading(false); showToast('위치 접근 권한을 허용해 주세요.'); }
    );
  };

  const handleAdminAuth = async () => {
    try {
      const res = await fetch(`${API}/api/admin/verify`, { method: 'POST', headers: { 'x-admin-password': adminPasswordInput } });
      if (!res.ok) { alert('비밀번호가 틀렸습니다. 접근 권한이 없습니다.'); setAdminPasswordInput(''); return; }
      setAdminPw(adminPasswordInput); setIsAdminAuthOpen(false); setAdminPasswordInput(''); setIsAdminPageOpen(true);
    } catch (e) { alert('서버에 연결할 수 없습니다.'); }
  };

  const getBgColor = () => {
    switch (bgTheme) { case 'night': return '#1a202c'; case 'rain': return '#cbd5e1'; case 'cloud': return '#e2e8f0'; default: return '#f8f6f0'; }
  };
  const getNavColor = () => {
    switch (bgTheme) { case 'night': return '#000000'; case 'rain': return '#334155'; case 'cloud': return '#475569'; default: return '#1a365d'; }
  };

  const activeWeather = useMemo(() => {
    if (selectedDateIdx === 0 || !weeklyData[selectedDateIdx]) return weatherData;
    const target = weeklyData[selectedDateIdx];
    const tempDrop = isMountainMode ? (weatherData.summitDrop || 5) : 0;
    
    return {
      ...weatherData,
      date: `${target.date} (${target.day})`,
      temp: target.temp_max,
      feelsLike: target.temp_max - (target.wind_speed >= 5 ? 3 : 0), 
      baseTemp: target.temp_max + tempDrop,
      condition: '주간 예보 기준',
      highLow: `최고 ${target.temp_max}° / 최저 ${target.temp_min}°`,
      icon: <span style={{ fontSize: '70px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}>{getEmojiIcon(target.icon)}</span>,
      wind_speed: target.wind_speed || weatherData.wind_speed,
      humidity: target.humidity || weatherData.humidity,
      targetPop: target.pop,
      isFuture: true
    };
  }, [weatherData, weeklyData, selectedDateIdx, isMountainMode]);

  return (
    <div style={{ backgroundColor: getBgColor(), minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.8s ease', position: 'relative' }}>
      {/* 💡 모바일·태블릿 완벽 대응 반응형 CSS 추가 */}
      <style>{`
        @keyframes skeleton-loading { 0% { background-color: #e2e8f0; } 50% { background-color: #cbd5e1; } 100% { background-color: #e2e8f0; } }
        .skeleton { animation: skeleton-loading 1.5s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media (max-width: 900px) {
          .main-container {
            grid-template-columns: 1fr !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 16px !important;
            gap: 16px !important;
          }
          .top-nav {
            padding: 12px 16px !important;
          }
          .top-nav-inner {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .search-wrapper {
            width: 100% !important;
            max-width: 100% !important;
          }
          .weather-main-card {
            flex-direction: column !important;
          }
          .weather-main-right {
            border-left: none !important;
            border-top: 1px solid #e2e8f0 !important;
          }
          .app-footer {
            flex-direction: column !important;
            gap: 10px !important;
            padding: 16px !important;
            text-align: center !important;
          }
        }
      `}</style>

      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, backgroundColor: '#166534', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', transform: toast.visible ? 'translateY(0)' : 'translateY(100px)', opacity: toast.visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
        <FiCheckCircle size={18} /> {toast.message}
      </div>

      <nav className="top-nav" style={{ backgroundColor: getNavColor(), padding: '15px 40px', display: 'flex', justifyContent: 'center', transition: 'background-color 0.8s ease' }}>
        <div className="top-nav-inner" style={{ display: 'flex', width: '100%', maxWidth: '1000px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div className="search-wrapper" style={{ position: 'relative', display: 'flex', width: '44%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', width: '100%', backgroundColor: 'white', borderRadius: '30px', padding: '5px 20px', alignItems: 'center', zIndex: 10 }}>
              <input 
                type="text" 
                placeholder={isMountainMode ? "20대 명산 검색 (예: 북한산, 설악산, 한라산)" : "검색할 지역을 입력하세요"} 
                value={searchInput} 
                onChange={handleInputChange} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                onFocus={() => setIsSearchFocused(true)} 
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)} 
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, padding: '10px', fontSize: '15px', backgroundColor: 'transparent', color: '#333' }} 
              />
              <button type="button" onClick={handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1a365d' }}>
                <FiSearch size={20} />
              </button>
            </div>

            {isSearchFocused && (
              <div className="no-scrollbar" style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginTop: '10px', zIndex: 50, padding: '15px', maxHeight: '320px', overflowY: 'auto' }}>
                {searchInput.trim() === '' && !isMountainMode ? (
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
                    ) : <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>최근 검색어가 없습니다.</p>}
                  </>
                ) : searchInput.trim() === '' && isMountainMode ? (
                  <>
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>⛰️ 한국의 20대 명산 전체 목록 (클릭 시 이동)</h4>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {MOUNTAINS_LIST.map((m, idx) => (
                        <li key={idx} onMouseDown={(e) => { e.preventDefault(); loadMountainWeather(m.name); setIsSearchFocused(false); }} style={{ padding: '9px 6px', cursor: 'pointer', color: '#333', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }}>
                          <span><strong>{m.name}</strong> <span style={{ fontSize: '12px', color: '#64748b' }}>({m.peak} · {m.region})</span></span>
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>해발 {m.elevation}m</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: '0', fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '5px' }}><FiSearch size={12}/> 일치하는 {isMountainMode ? '산 이름' : '지역명'}</h4>
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
                    ) : <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>결과가 없습니다.</p>}
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
            weatherData={activeWeather} 
            hourlyData={hourlyData}
            weeklyData={weeklyData}
            selectedDateIdx={selectedDateIdx}
            onSelectDate={(idx) => setSelectedDateIdx(idx)}
            isAiLoading={isAiLoading} 
            aiMessage={aiMessage} 
            favorites={favorites} 
            onAddClick={handleOpenAddRegion} 
            onFavoriteClick={(fav) => { if (isMountainMode) setIsMountainMode(false); loadWeather(fav.lat, fav.lon, fav.name); }} 
            onRemoveFavorite={handleRemoveFavorite} 
            onCurrentLocationClick={handleCurrentLocation}
            isMountainMode={isMountainMode}
            onToggleMountainMode={handleToggleMountainMode}
            mountainInfo={mountainInfo}
            mountainsList={MOUNTAINS_LIST}
            onSelectMountain={(mName) => loadMountainWeather(mName)}
          />
          
          <HourlyForecast 
            hourlyData={hourlyData} 
            isLoading={isAiLoading} 
            error={forecastError} 
            isMountainMode={isMountainMode}
            mountainInfo={mountainInfo}
            weatherData={activeWeather}
            onShowToast={showToast}
          />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <WeatherOutlook 
              weeklyData={weeklyData} 
              aiBriefing={aiBriefing} 
              isMountainMode={isMountainMode} 
              mountainInfo={mountainInfo} 
            />
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
              temp: activeWeather.temp, 
              feelsLike: activeWeather.feelsLike,
              baseTemp: activeWeather.baseTemp,
              humidity: activeWeather.humidity, 
              wind_speed: activeWeather.wind_speed, 
              description: activeWeather.condition,
              sunrise: activeWeather.sunrise,
              sunset: activeWeather.sunset,
              safeDescentTime: activeWeather.safeDescentTime,
              elevation: activeWeather.elevation,
              targetPop: activeWeather.targetPop,
              isFuture: activeWeather.isFuture
            }} 
            airQuality={{ 
              level: (activeWeather.dust && activeWeather.dust.split(' ')[0]) || '보통', 
              pm25: (activeWeather.dust && activeWeather.dust.match(/\d+/)) ? parseInt(activeWeather.dust.match(/\d+/)[0]) : 15 
            }}
            isMountainMode={isMountainMode}
            mountainInfo={mountainInfo}
          />
          
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <WeeklyForecast weeklyData={weeklyData} isLoading={isAiLoading} />
          </div>
        </div>
      </main>

      <footer className="app-footer" style={{ backgroundColor: bgTheme === 'night' ? '#111827' : '#e2e8f0', transition: 'background-color 0.8s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', color: '#718096', fontSize: '13px' }}>
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