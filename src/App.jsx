import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import LoginCard from './components/LoginCard';
import HourlyForecast, { PACE_OPTIONS } from './components/HourlyForecast';
import NoticeModal from './components/NoticeModal';
import WeatherMain from './components/WeatherMain';
import WeatherDetails from './components/WeatherDetails';
import SignUpModal from './components/SignUpModal';
import FindPasswordModal from './components/FindPasswordModal';
import AddRegionModal from './components/AddRegionModal';
import AdminPage from './components/AdminPage';
import FishingPage from './components/FishingPage';
import WeeklyForecast, { getEmojiIcon } from './components/WeeklyForecast'; 
import WeatherOutlook from './components/WeatherOutlook'; 
import { FiSearch, FiBell, FiSettings, FiClock, FiCheckCircle } from 'react-icons/fi';
import { API } from './config';
import { assessHikingForecastWindow, getHourlyForecastIndex } from './components/mountainAssessment';
import { koreanDate, planDepartureAt } from './lib/hikingPlan';
import { readStoredJson, writeStoredJson } from './lib/browserStorage';
import WeatherConnectionStatus from './components/WeatherConnectionStatus';
import { requestJson, requestForecastJson } from './lib/apiClient';
import { forecastKey, isUsableForecast, isWeatherNumber, readForecastCache, writeForecastCache } from './lib/forecastCache';

const emptyWeather = (region = '부천시') => ({
  hasData: false, region, temp: null, feelsLike: null, tempDiff: null,
  baseTemp: null, summitDrop: null, humidity: null, wind_speed: null,
  safeDescentTime: null, sunrise: null, sunset: null, icon: null,
  dust: '확인 불가', condition: '기상 자료 확인 필요', highLow: '최고 · 최저 자료 없음',
  date: getTodayDateString(), elevation: 0,
});

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
  { name: '북한산', elevation: 836, peak: '백운대', region: '서울/경기', terrain: '화강암 암릉', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '백운대 정상 부근 바위가 미끄러우니 접지력이 좋은 등산화와 장갑을 착용하세요.', courses: [{ name: '백운대 최단 코스 (탐방지원센터)', distance: '4km', time: 180, diff: '중상', trailhead: '북한산 백운대탐방지원센터' }, { name: '대남문 능선 코스 (구기동)', distance: '8.5km', time: 270, diff: '중', trailhead: '북한산 구기탐방지원센터' }, { name: '숨은벽 능선 코스 (밤골)', distance: '7.6km', time: 240, diff: '상', trailhead: '북한산 밤골공원지킴터' }] },
  { name: '설악산', elevation: 1708, peak: '대청봉', region: '강원 속초/인제', terrain: '고산 암릉', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '정상 능선에 강한 칼바람이 불어 사계절 방풍 재킷이 필수입니다.', courses: [{ name: '대청봉 최단 (오색 코스)', distance: '10km', time: 480, diff: '상', trailhead: '설악산 남설악탐방지원센터' }, { name: '한계령~대청봉 종주 코스', distance: '13.5km', time: 660, diff: '최상', trailhead: '설악산 한계령탐방지원센터' }] },
  { name: '한라산', elevation: 1947, peak: '백록담', region: '제주', terrain: '화산지형', difficulty: '상', cctv_url: 'https://www.jeju.go.kr/hallasan/info/cctv.htm', course_tip: '성판악 코스는 탐방 예약이 필수이며, 정상은 평지보다 12°C 이상 낮습니다.', courses: [{ name: '성판악~백록담 코스', distance: '19.2km', time: 540, diff: '중상', trailhead: '한라산 성판악탐방안내소' }, { name: '관음사~백록담 코스', distance: '17.4km', time: 600, diff: '상', trailhead: '한라산 관음사지구야영장' }] },
  { name: '지리산', elevation: 1915, peak: '천왕봉', region: '경남/전남/전북', terrain: '고산 능선', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '장거리 산행이므로 일몰 시간과 체력을 고려해 헤드랜턴을 준비하세요.', courses: [{ name: '중산리~천왕봉 단거리', distance: '10.8km', time: 480, diff: '상', trailhead: '지리산 중산리탐방안내소' }, { name: '백무동~천왕봉 코스', distance: '15km', time: 570, diff: '중상', trailhead: '지리산 백무동탐방지원센터' }] },
  { name: '계룡산', elevation: 845, peak: '관음봉', region: '충남 공주', terrain: '암릉·가파른 계단', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '자연성릉 바위 능선과 고깔바위 계단이 가팔라 체력 소모가 큽니다.', courses: [{ name: '동학사~관음봉 순환 코스', distance: '8.5km', time: 300, diff: '중상', trailhead: '계룡산 동학사주차장' }, { name: '갑사~관음봉 코스', distance: '7km', time: 240, diff: '중', trailhead: '계룡산 갑사주차장' }] },
  { name: '덕유산', elevation: 1614, peak: '향적봉', region: '전북 무주', terrain: '아고산대 능선', difficulty: '중하', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '정상 능선은 습도가 높고 상고대·강풍이 잦아 보온에 유의하세요.', courses: [{ name: '곤돌라~향적봉 코스', distance: '1.2km', time: 40, diff: '하', trailhead: '무주덕유산리조트 관광곤도라' }, { name: '구천동~향적봉 코스', distance: '17km', time: 510, diff: '중상', trailhead: '덕유산 삼공탐방지원센터' }] },
  { name: '소백산', elevation: 1439, peak: '비로봉', region: '충북 단양', terrain: '초원 능선(육산)', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '나무가 없는 탁 트인 능선이라 바람을 막아줄 지형물이 없습니다. 체감온도가 급락하니 방풍·방한모를 꼭 챙기세요.', courses: [{ name: '어의곡~비로봉 코스', distance: '10km', time: 300, diff: '중', trailhead: '소백산 어의곡탐방지원센터' }] },
  { name: '태백산', elevation: 1567, peak: '장군봉', region: '강원 태백', terrain: '완만한 육산', difficulty: '중하', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '경사가 완만해 초보자도 오르기 좋으며 일출 조망이 뛰어납니다.', courses: [{ name: '유일사~천제단 코스', distance: '8km', time: 240, diff: '중하', trailhead: '태백산 유일사주차장' }] },
  { name: '오대산', elevation: 1563, peak: '비로봉', region: '강원 평창', terrain: '부드러운 흙길', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '흙길이 잘 정비되어 있으나 정상 직전 오르막이 가파릅니다.', courses: [{ name: '상원사~비로봉 코스', distance: '7km', time: 210, diff: '중', trailhead: '오대산 상원사주차장' }] },
  { name: '치악산', elevation: 1288, peak: '비로봉', region: '강원 원주', terrain: '급경사 철계단', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '급경사 철계단이 이어지므로 무릎 보호대와 스틱이 필수입니다.', courses: [{ name: '구룡사~사다리병창 코스', distance: '11km', time: 360, diff: '상', trailhead: '치악산 구룡탐방지원센터' }] },
  { name: '월악산', elevation: 1097, peak: '영봉', region: '충북 제천', terrain: '험준한 암릉', difficulty: '상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '수백 개의 가파른 철계단과 충주호 골바람에 주의하세요.', courses: [{ name: '보덕암~영봉 코스', distance: '8km', time: 330, diff: '상', trailhead: '월악산 보덕암주차장' }] },
  { name: '속리산', elevation: 1058, peak: '문장대', region: '충북 보은', terrain: '기암괴석·암릉', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '문장대 바위 정상 난간 구간에서 강풍이 불 때 안전에 유의하세요.', courses: [{ name: '법주사~문장대 코스', distance: '12km', time: 330, diff: '중', trailhead: '속리산 법주사소형주차장' }] },
  { name: '가야산', elevation: 1430, peak: '상왕봉', region: '경남 합천', terrain: '뾰족한 암봉', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '정상 부근 암릉 구간이 험준하므로 미끄럼을 조심하세요.', courses: [{ name: '백운동~상왕봉 코스', distance: '7.5km', time: 270, diff: '중상', trailhead: '가야산 백운동탐방지원센터' }] },
  { name: '무등산', elevation: 1187, peak: '서석대', region: '광주/전남', terrain: '주상절리대', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '서석대 능선은 그늘이 적고 바람이 강해 방풍 준비가 필요합니다.', courses: [{ name: '증심사~서석대 코스', distance: '12km', time: 330, diff: '중', trailhead: '무등산 증심사주차장' }] },
  { name: '주왕산', elevation: 721, peak: '주봉', region: '경북 청송', terrain: '협곡·흙길', difficulty: '하', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '험한 구간이 적어 초보자 산행에 적합하며 아침 물안개가 자주 낍니다.', courses: [{ name: '대전사~주봉 코스', distance: '9km', time: 270, diff: '하', trailhead: '주왕산 상의주차장' }] },
  { name: '도봉산', elevation: 740, peak: '신선대', region: '서울/경기', terrain: '거대 화강암', difficulty: '중상', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '신선대 오름길은 가파른 쇠난간을 잡아야 하므로 장갑을 권장합니다.', courses: [{ name: '도봉탐방센터~신선대', distance: '6.5km', time: 210, diff: '중상', trailhead: '도봉산탐방지원센터' }] },
  { name: '관악산', elevation: 632, peak: '연주대', region: '서울/경기과천', terrain: '바위 능선', difficulty: '중', cctv_url: 'https://www.youtube.com/results?search_query=%EA%B4%80%EC%95%85%EC%82%B0+%EC%97%B0%EC%A3%BC%EB%8C%80+%EC%8B%A4%EC%8B%9C%EA%B0%84', course_tip: '사당 코스는 노출된 바위 능선이 많아 비 온 뒤 미끄럼에 주의하세요.', courses: [{ name: '서울대~연주대 코스', distance: '6km', time: 210, diff: '중', trailhead: '관악산공원 입구' }] },
  { name: '대둔산', elevation: 878, peak: '마천대', region: '충남/전북', terrain: '구름다리·철계단', difficulty: '중', cctv_url: 'https://www.youtube.com/results?search_query=%EB%8C%80%EB%91%94%EC%82%B0+%EB%A7%88%EC%B2%9C%EB%8C%80+%EC%8B%A4%EC%8B%9C%EA%B0%84', course_tip: '삼선계단은 경사가 매우 가파르고 일방통행이므로 우회로를 체크하세요.', courses: [{ name: '케이블카~마천대 코스', distance: '2km', time: 90, diff: '하', trailhead: '대둔산케이블카' }, { name: '수락계곡~마천대 코스', distance: '7km', time: 240, diff: '중', trailhead: '대둔산 수락계곡주차장' }] },
  { name: '내장산', elevation: 763, peak: '신선봉', region: '전북 정읍', terrain: '단풍 계곡·암릉', difficulty: '중', cctv_url: 'https://www.knps.or.kr/portal/main/contents.do?menuNo=8000159', course_tip: '신선봉 정상으로 오르는 능선은 경사가 급하고 습기가 많습니다.', courses: [{ name: '일주문~신선봉 코스', distance: '8km', time: 270, diff: '중', trailhead: '내장산 일주문' }] },
  { name: '마이산', elevation: 686, peak: '암마이봉', region: '전북 진안', terrain: '역암 바위', difficulty: '중하', cctv_url: 'https://www.youtube.com/results?search_query=%EB%A7%88%EC%9D%B4%EC%82%B0+%EC%8B%A4%EC%8B%9C%EA%B0%84', course_tip: '암마이봉 구간은 겨울철 결빙 시 통제될 수 있으니 노면 상태를 꼭 확인하세요.', courses: [{ name: '탑사~암마이봉 코스', distance: '5km', time: 150, diff: '중하', trailhead: '마이산 남부주차장' }] }
];

const MOUNTAINS = MOUNTAINS_LIST.map(m => m.name);

const getTodayDateString = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${month}월 ${date}일 ${days[now.getDay()]}`;
};

const WeatherBackground = ({ theme }) => {
  const isRain = theme === 'rain';
  const isSnow = theme === 'snow';

  return (
    <div className={`weather-bg ${theme}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, transition: 'background 1.5s ease' }}>
      {isRain && (
        <div className="rain-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="rain-drop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s`, animationDelay: `${Math.random()}s` }}></div>
          ))}
        </div>
      )}
      {isSnow && (
        <div className="snow-container">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="snow-flake" style={{ left: `${Math.random() * 100}%`, animationDuration: `${4 + Math.random() * 5}s`, animationDelay: `${Math.random() * 3}s` }}></div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [autoCompleteList, setAutoCompleteList] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isMountainMode, setIsMountainMode] = useState(false);
  const [isFishingPage, setIsFishingPage] = useState(false);
  const [mountainInfo, setMountainInfo] = useState(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0); 

  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [paceType, setPaceType] = useState('normal');
  const [departureOffsetHours, setDepartureOffsetHours] = useState(0);
  const [planReferenceAt, setPlanReferenceAt] = useState(() => Date.now());
  const [restoredDepartureAt, setRestoredDepartureAt] = useState(null);
  const [customGearList, setCustomGearList] = useState([]);

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false); 
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminPageOpen, setIsAdminPageOpen] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminRole, setAdminRole] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '' });
  const [aiMessage, setAiMessage] = useState('✨ 날씨 정보를 불러오는 중입니다...');
  const [aiBriefing, setAiBriefing] = useState('데이터를 불러오는 중입니다...');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [forecastError, setForecastError] = useState('');
  const [weatherFetchedAt, setWeatherFetchedAt] = useState(null);
  const [connectionState, setConnectionState] = useState({ phase: 'connecting' });
  const [bgTheme, setBgTheme] = useState('clear-day');

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(0);
  const [favorites, setFavorites] = useState([]);

  const [weatherData, setWeatherData] = useState(() => emptyWeather());
  const lastWeatherRequestRef = useRef({ kind: 'weather', lat: 37.5034, lon: 126.7660, regionName: '부천시' });
  const forecastControllerRef = useRef(null);
  const displayedForecastKeyRef = useRef('');
  const recoveryStateRef = useRef({ phase: 'connecting' });
  const initialMountainRef = useRef(new URLSearchParams(window.location.search).get('mountain'));

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => { setToast({ visible: false, message: '' }); }, 3000);
  };

  useEffect(() => {
    const storedSearches = readStoredJson('recentSearches', []).filter(value => typeof value === 'string');
    setRecentSearches(storedSearches);
    const savedUser = readStoredJson('loggedInUser', null);
    if (typeof savedUser?.accessToken === 'string' && typeof savedUser?.id === 'string') setLoggedInUser(savedUser);
  }, []);

  const handleLogin = (user) => {
    const guestFavorites = readStoredJson('guestFavorites', []).filter(item => item?.name);
    const accountKey = `favorites_${user.id}`;
    const accountFavorites = readStoredJson(accountKey, []).filter(item => item?.name);
    const mergedFavorites = [...accountFavorites, ...guestFavorites.filter(guest => !accountFavorites.some(saved => saved.name === guest.name))].slice(0, 5);
    if (mergedFavorites.length) writeStoredJson(accountKey, mergedFavorites);
    setLoggedInUser(user);
    writeStoredJson('loggedInUser', user);
    showToast('로그인되었습니다. 관심 지역을 계정과 동기화하고 있어요.');
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

  const handleDeleteAccount = async (password) => {
    if (!loggedInUser) throw new Error('로그인 상태를 확인해 주세요.');
    const account = loggedInUser;
    await requestJson('/api/users/delete', {
      method: 'POST', timeoutMs: 20000, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.id, password }),
    });
    try {
      localStorage.removeItem(`favorites_${account.id}`);
      localStorage.removeItem(`favorites_pending_${account.id}`);
      localStorage.removeItem(`hiking:last-party:${account.id}`);
      Object.keys(localStorage).filter(key => key.startsWith(`hiking:draft:${account.id}:`)).forEach(key => localStorage.removeItem(key));
      const saved = readStoredJson('loggedInUser', null);
      if (saved?.accessToken === account.accessToken) localStorage.removeItem('loggedInUser');
    } catch { /* Account deletion has already succeeded on the server. */ }
    setLoggedInUser(current => current?.accessToken === account.accessToken ? null : current);
    showToast('회원 탈퇴가 완료되었습니다.');
  };

  useEffect(() => {
    const defaultFav = [{ name: '부천시', lat: 37.5034, lon: 126.7660 }];
    let cancelled = false;
    const getStoredList = (key) => {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(stored) ? stored : [];
      } catch {
        return [];
      }
    };
    if (loggedInUser) {
      const userKey = `favorites_${loggedInUser.id}`;
      const pendingKey = `favorites_pending_${loggedInUser.id}`;
      const localAccountFavorites = getStoredList(userKey);
      const guestFavorites = getStoredList('guestFavorites');
      const hasPendingSync = localStorage.getItem(pendingKey) !== null;
      const pendingFavorites = getStoredList(pendingKey);
      const showFallback = (items) => {
        if (cancelled) return;
        const visible = items.length ? items : defaultFav;
        setFavorites(visible);
        if (initialMountainRef.current && MOUNTAINS_LIST.some(item => item.name === initialMountainRef.current)) {
          setIsMountainMode(true);
          loadMountainWeather(initialMountainRef.current, { initial: true });
        } else if (!isMountainMode) loadWeather(visible[0].lat, visible[0].lon, visible[0].name);
      };
      showFallback(hasPendingSync ? pendingFavorites : (localAccountFavorites.length ? localAccountFavorites : guestFavorites));
      const syncFavorites = async () => {
        try {
          const serverFavorites = await requestJson('/api/users/me/favorites', {
            headers: { Authorization: `Bearer ${loggedInUser.accessToken}` },
          });
          const serverList = serverFavorites.map(item => ({ ...item, lat: Number(item.lat), lon: Number(item.lon) }));
          const baseFavorites = hasPendingSync ? pendingFavorites : (serverList.length ? serverList : localAccountFavorites);
          const guestOnlyFavorites = guestFavorites.filter(guest => !baseFavorites.some(saved => saved.name === guest.name));
          const allFavorites = [...baseFavorites, ...guestOnlyFavorites];
          const mergedFavorites = allFavorites.slice(0, 5);
          const remainingGuestFavorites = allFavorites.slice(5);
          const needsUpload = hasPendingSync || guestFavorites.length > 0 || serverList.length !== mergedFavorites.length || (!serverList.length && localAccountFavorites.length > 0);
          if (needsUpload) {
            await requestJson('/api/users/me/favorites', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loggedInUser.accessToken}` },
              body: JSON.stringify({ favorites: mergedFavorites }),
            });
          }
          if (cancelled) return;
          localStorage.setItem(userKey, JSON.stringify(mergedFavorites));
          localStorage.removeItem(pendingKey);
          if (remainingGuestFavorites.length) localStorage.setItem('guestFavorites', JSON.stringify(remainingGuestFavorites));
          else localStorage.removeItem('guestFavorites');
          setFavorites(mergedFavorites.length ? mergedFavorites : defaultFav);
          // Keep the weather the user is viewing while account sync completes.
          if (remainingGuestFavorites.length) showToast('계정에는 관심 지역 5곳을 저장했고, 나머지는 이 브라우저에 남겨뒀어요.');
          else if (guestFavorites.length) showToast('이 기기의 관심 지역을 계정에 저장했어요.');
        } catch (error) {
          if (cancelled) return;
          if (error.status === 401) {
            const recoverable = hasPendingSync ? pendingFavorites : (localAccountFavorites.length ? localAccountFavorites : guestFavorites);
            if (recoverable.length && !guestFavorites.length) localStorage.setItem('guestFavorites', JSON.stringify(recoverable));
            localStorage.removeItem('loggedInUser');
            setLoggedInUser(null);
            showToast('로그인 정보가 만료되어 관심 지역을 이 브라우저에 보관했어요. 다시 로그인해주세요.');
            return;
          }
          showToast('계정 동기화에 실패해 이 브라우저의 관심 지역을 표시합니다.');
        }
      };
      syncFavorites();
    } else {
      const guestFavorites = getStoredList('guestFavorites');
      setFavorites(guestFavorites);
      const initialLocation = guestFavorites[0] || defaultFav[0];
      if (initialMountainRef.current && MOUNTAINS_LIST.some(item => item.name === initialMountainRef.current)) {
        setIsMountainMode(true); loadMountainWeather(initialMountainRef.current, { initial: true });
      } else if (!isMountainMode) loadWeather(initialLocation.lat, initialLocation.lon, initialLocation.name);
    }
    return () => { cancelled = true; };
  }, [loggedInUser?.id, loggedInUser?.accessToken]);

  const saveFavorites = async (newFavs) => {
    setFavorites(newFavs);
    const user = loggedInUser;
    localStorage.setItem(user ? `favorites_${user.id}` : 'guestFavorites', JSON.stringify(newFavs));
    if (!user?.accessToken) return true;
    const pendingKey = `favorites_pending_${user.id}`;
    try {
      await requestJson('/api/users/me/favorites', { method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.accessToken}` },
        body: JSON.stringify({ favorites: newFavs }),
      });
      localStorage.removeItem(pendingKey);
      return true;
    } catch (error) {
      localStorage.setItem(pendingKey, JSON.stringify(newFavs));
      if (error.status === 401) {
        localStorage.setItem('guestFavorites', JSON.stringify(newFavs));
        localStorage.removeItem('loggedInUser'); setLoggedInUser(null);
        showToast('로그인 정보가 만료되었습니다. 변경 내용은 이 브라우저에 보관했어요.');
      }
      return false;
    }
  };

  const updateWeatherState = (data, regionName, elevation = 0, mInfo = null, { fetchedAt = Date.now(), preservePlan = false } = {}) => {
    const c = data.current;
    const aqi = data.air_quality;
    const desc = c.description || '하늘 상태 자료 없음';
    const isNight = (c.icon || '').includes('n');
    setBgTheme(desc.includes('눈') ? 'snow' : /비|소나기/.test(desc) ? 'rain' : /구름|흐림/.test(desc) ? (isNight ? 'cloudy-night' : 'cloudy-day') : (isNight ? 'clear-night' : 'clear-day'));
    setMountainInfo(mInfo);
    setWeatherFetchedAt(new Date(fetchedAt));
    if (!preservePlan) {
      setSelectedDateIdx(0);
      setSelectedCourseIdx(0);
      setDepartureOffsetHours(0); setRestoredDepartureAt(null); setPlanReferenceAt(Date.now());
    }
    const value = raw => isWeatherNumber(raw) ? Math.round(Number(raw)) : null;
    const feelsLike = value(c.feels_like);
    setWeatherData({
      hasData: true,
      region: regionName ?? c.city ?? '위치 알 수 없음',
      date: getTodayDateString(), forecastDate: koreanDate(fetchedAt), temp: value(c.temp), feelsLike,
      tempDiff: value(c.temp_diff), baseTemp: value(c.base_temp ?? c.temp),
      summitDrop: value(c.summit_drop),
      safeDescentTime: c.safe_descent_time || null,
      safeDescentTimeLabel: c.safe_descent_time_label || '권장 하산 시작 시각',
      weatherSources: c.weather_sources || null, dataAsOf: c.data_as_of || data.metadata?.generated_at || null,
      dataNote: c.data_note || '',
      icon: c.icon ? <span style={{ fontSize: '70px' }}>{getEmojiIcon(c.icon)}</span> : null,
      condition: feelsLike === null ? desc : `${desc} (체감 ${feelsLike}°C)`,
      highLow: `최고 ${value(c.temp_max) ?? '—'}° / 최저 ${value(c.temp_min) ?? '—'}°`,
      humidity: isWeatherNumber(c.humidity) ? Number(c.humidity) : null,
      wind_speed: isWeatherNumber(c.wind_speed) ? Number(c.wind_speed) : null,
      dust: aqi && aqi.level !== '점검중' && isWeatherNumber(aqi.pm25) ? `${aqi.level} (${aqi.pm25})` : '확인 불가',
      sunrise: c.sunrise || null, sunset: c.sunset || null, elevation,
    });
    setHourlyData(Array.isArray(data.hourly) ? data.hourly : []);
    setWeeklyData(Array.isArray(data.weekly) ? data.weekly : []);
  };

  const loadForecast = async (request) => {
    forecastControllerRef.current?.abort();
    const controller = new AbortController();
    forecastControllerRef.current = controller;
    lastWeatherRequestRef.current = request;
    const key = forecastKey(request);
    const preservePlan = displayedForecastKeyRef.current === key;
    const cached = readForecastCache(key);
    const localMountain = request.kind === 'mountain'
      ? MOUNTAINS_LIST.find(item => item.name === request.mountainName) : null;
    const label = request.kind === 'mountain' ? request.mountainName : (request.regionName || '현재 위치');
    const apply = (data, fetchedAt) => {
      const info = localMountain ? { ...localMountain, ...data.mountain_info, courses: localMountain.courses } : null;
      updateWeatherState(data, request.kind === 'mountain' ? data.mountain_name : request.regionName,
        data.elevation || 0, info, { fetchedAt, preservePlan });
      displayedForecastKeyRef.current = key;
    };
    if (cached) apply(cached.data, cached.savedAt);
    else if (!preservePlan) {
      displayedForecastKeyRef.current = '';
      setWeatherData(emptyWeather(label)); setHourlyData([]); setWeeklyData([]);
      setWeatherFetchedAt(null); setMountainInfo(localMountain);
    }
    setForecastError('');
    setIsAiLoading(true);
    setAiMessage('최신 기상 자료를 확인하고 있어요.');
    const path = request.kind === 'mountain'
      ? `/api/mountain/summary?name=${encodeURIComponent(request.mountainName)}`
      : `/api/weather/summary?lat=${request.lat}&lon=${request.lon}`;
    try {
      const data = await requestForecastJson(path, {
        signal: controller.signal,
        onState: state => { if (!controller.signal.aborted) setConnectionState({ ...state, cached: !!cached || preservePlan }); },
      });
      if (controller.signal.aborted) return false;
      if (!isUsableForecast(data)) throw new Error('기온 자료를 받지 못했습니다. 잠시 후 다시 확인해 주세요.');
      apply(data, Date.now());
      writeForecastCache(key, data);
      setConnectionState({ phase: 'success' });
      setIsAiLoading(false);
      setAiMessage('시간별 예보와 선택한 일정을 확인해 주세요.');
      setAiBriefing('기상 자료를 바탕으로 안내를 준비하고 있어요.');
      // Numeric weather is usable immediately; AI failure must not hide it.
      requestJson('/api/weather/ai', {
        method: 'POST', timeoutMs: 18000, signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: data.current, forecast: data.hourly || [], air_quality: data.air_quality || {}, mountain_info: data.mountain_info || null }),
      }).then(ai => {
        if (controller.signal.aborted) return;
        setAiMessage(ai.advice?.[0] || '기상 수치와 공식 통제 정보를 함께 확인하세요.');
        setAiBriefing(ai.ai_briefing || '시간별 예보와 선택한 일정을 확인해 주세요.');
      }).catch(() => {
        if (controller.signal.aborted) return;
        setAiMessage('AI 안내를 받지 못했습니다. 아래 수치 예보를 확인해 주세요.');
        setAiBriefing('AI 안내 연결이 지연되어 수치 예보를 제공합니다.');
      });
      return true;
    } catch (error) {
      if (controller.signal.aborted) return false;
      const message = error.message || '날씨 서버에 연결하지 못했습니다.';
      setForecastError(message);
      setConnectionState({ phase: cached || preservePlan ? 'stale' : 'error', message, requestId: error.requestId });
      setAiMessage(cached || preservePlan ? '지난 자료입니다. 출발 전에 최신 날씨를 다시 확인해 주세요.' : '기상 자료를 확인한 뒤 활동 안내를 제공합니다.');
      setAiBriefing(message);
      setIsAiLoading(false);
      return false;
    }
  };

  const loadWeather = (lat, lon, regionName) => { initialMountainRef.current = null; return loadForecast({ kind: 'weather', lat, lon, regionName }); };
  const loadMountainWeather = (mountainName, { initial = false } = {}) => { if (!initial) initialMountainRef.current = null; return loadForecast({ kind: 'mountain', mountainName }); };
  const retryForecast = () => loadForecast(lastWeatherRequestRef.current);

  useEffect(() => { recoveryStateRef.current = connectionState; }, [connectionState]);
  useEffect(() => {
    const recover = () => {
      if (navigator.onLine && ['error', 'stale'].includes(recoveryStateRef.current.phase)) {
        loadForecast(lastWeatherRequestRef.current);
      }
    };
    window.addEventListener('online', recover);
    window.addEventListener('focus', recover);
    return () => { window.removeEventListener('online', recover); window.removeEventListener('focus', recover); forecastControllerRef.current?.abort(); };
  }, []);

  const handleApplyHikingPlan = async (plan) => {
    setIsMountainMode(true);
    if (plan.mountain_name && plan.mountain_name !== mountainInfo?.name) {
      const loaded = await loadMountainWeather(plan.mountain_name);
      if (!loaded) throw new Error('산악 예보를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.');
    }
    const parsedDeparture = Date.parse(plan.departure_at);
    const isUpcoming = Number.isFinite(parsedDeparture) && parsedDeparture >= Date.now();
    const validDeparture = isUpcoming;
    setSelectedDateIdx(0);
    const mountain = MOUNTAINS_LIST.find(item => item.name === plan.mountain_name);
    const namedCourseIndex = mountain?.courses.findIndex(course => course.name === plan.course_name) ?? -1;
    setSelectedCourseIdx(namedCourseIndex >= 0 ? namedCourseIndex : Number(plan.course_index) || 0);
    setPaceType(plan.pace || 'normal');
    setDepartureOffsetHours(0);
    setRestoredDepartureAt(validDeparture ? new Date(parsedDeparture).toISOString() : null);
    setPlanReferenceAt(Date.now());
    showToast(validDeparture ? '저장한 날짜·출발 시각과 준비물을 불러왔어요. 예보 제공 범위를 확인해 주세요.' : '지난 출발 일정입니다. 코스와 준비물을 불러왔으니 새 출발 시각을 선택해 주세요.');
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
    setIsAddRegionOpen(true);
  };

  const handleAddFavorite = async (query) => {
    try {
      setIsAiLoading(true);
      const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) { showToast('지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
      const loc = await res.json();
      if (favorites.some(fav => fav.name === loc.name)) { showToast('이미 관심 지역에 등록되어 있습니다.'); setIsAiLoading(false); return; }
      const newFavs = [...favorites, { name: loc.name, lat: loc.lat, lon: loc.lon }];
      if (newFavs.length > 5) { showToast('관심 지역은 최대 5곳까지 저장할 수 있어요.'); setIsAiLoading(false); return; }
      const synced = await saveFavorites(newFavs);
      setIsAddRegionOpen(false);
      showToast(loggedInUser
        ? (synced ? `'${loc.name}'을(를) 계정에 저장했어요.` : '이 브라우저에는 저장했지만 계정 동기화에 실패했어요.')
        : `'${loc.name}'을(를) 이 브라우저에 저장했어요. 로그인하면 계정별 목록으로 관리할 수 있어요.`);
      if (isMountainMode) setIsMountainMode(false);
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (error) { showToast('지역 추가 중 오류가 발생했습니다.'); setIsAiLoading(false); }
  };

  const handleRemoveFavorite = async (nameToRemove) => {
    const newFavs = favorites.filter(fav => fav.name !== nameToRemove);
    const synced = await saveFavorites(newFavs);
    showToast(loggedInUser && !synced ? '이 브라우저에서는 삭제했지만 계정 동기화에 실패했어요.' : '관심 지역에서 삭제했어요.');
  };

  const handleCurrentLocation = () => {
    if (isMountainMode) { showToast('산악 모드에서는 우측 20대 명산 목록을 선택해 주세요.'); return; }
    if (!navigator.geolocation) { showToast('브라우저에서 위치 서비스를 지원하지 않습니다.'); return; }
    setIsAiLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loaded = await loadWeather(latitude, longitude, null);
        if (loaded) showToast('현재 위치의 날씨를 성공적으로 불러왔습니다.');
      },
      (error) => { setIsAiLoading(false); showToast('위치 접근 권한을 허용해 주세요.'); }
    );
  };

  const handleAdminAuth = async () => {
    try {
      const res = await fetch(`${API}/api/admin/verify`, { method: 'POST', headers: { 'x-admin-password': adminPasswordInput } });
      if (!res.ok) { alert('비밀번호가 틀렸습니다. 접근 권한이 없습니다.'); setAdminPasswordInput(''); return; }
      const data = await res.json();
      setAdminRole(data.role || 'superadmin'); setAdminPw(adminPasswordInput); setIsAdminAuthOpen(false); setAdminPasswordInput(''); setIsAdminPageOpen(true);
    } catch (e) { alert('서버에 연결할 수 없습니다.'); }
  };

  const openAdmin = async () => {
    if (!loggedInUser?.accessToken) { setIsAdminAuthOpen(true); return; }
    try {
      const res = await fetch(`${API}/api/admin/verify`, { method: 'POST', headers: { Authorization: `Bearer ${loggedInUser.accessToken}` } });
      if (res.status === 403) { alert('관리자 권한이 없는 계정입니다.'); return; }
      if (!res.ok) { alert('로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.'); return; }
      const data = await res.json();
      setAdminPw(''); setAdminRole(data.role); setIsAdminPageOpen(true);
    } catch { alert('관리자 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
  };

  const activeWeather = useMemo(() => {
    if (selectedDateIdx === 0 || !weeklyData[selectedDateIdx]) return weatherData;
    const target = weeklyData[selectedDateIdx];
    const tempDrop = isMountainMode ? (weatherData.summitDrop || 5) : 0;
    
    return {
      ...weatherData,
      date: `${target.date} (${target.day})`,
      forecastDate: target.full_date || null,
      temp: target.temp_max,
      feelsLike: target.temp_max - (target.wind_speed >= 5 ? 3 : 0), 
      baseTemp: target.temp_max + tempDrop,
      condition: '주간 예보 기준',
      highLow: `최고 ${target.temp_max}° / 최저 ${target.temp_min}°`,
      icon: <span style={{ fontSize: '70px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }}>{getEmojiIcon(target.icon)}</span>,
      wind_speed: target.wind_speed || weatherData.wind_speed,
      humidity: target.humidity || weatherData.humidity,
      targetPop: target.pop,
      isFuture: true,
      weatherSources: isMountainMode ? {
        temperature: '주간 예보 기반 고도 보정 추정값',
        wind: '주간 예보 기반 고도·지형 보정 추정값',
        humidity: '주간 예보 기반 추정값',
      } : {
        temperature: 'OpenWeather 주간 예보',
        wind: 'OpenWeather 주간 예보',
        humidity: 'OpenWeather 주간 예보',
      },
      dataAsOf: null,
      dataNote: isMountainMode
        ? '선택 날짜의 주간 예보를 고도·지형 보정해 표시합니다. 정상 실측값이 아닙니다.'
        : '선택 날짜의 주간 예보입니다.'
    };
  }, [weatherData, weeklyData, selectedDateIdx, isMountainMode]);

  const hikingPlanSummary = useMemo(() => {
    if (!isMountainMode || !activeWeather.hasData) return null;
    const courses = mountainInfo?.courses || [{ name: '기본 탐방로', distance: '5km', time: 180, diff: '중' }];
    const selectedCourse = courses[selectedCourseIdx] || courses[0];
    const paceObj = PACE_OPTIONS.find(p => p.key === paceType) || PACE_OPTIONS[1];
    const totalMins = Math.max(20, Math.round((selectedCourse.time * paceObj.multiplier) / 10) * 10);
    const ascentMins = Math.max(15, Math.round((totalMins * 0.55) / 5) * 5);

    const parseTime = (str, fallback = 1080) => {
      if (!str || !str.includes(':')) return fallback;
      const [h, m] = str.split(':').map(Number);
      return (Number.isFinite(h) ? h : 18) * 60 + (Number.isFinite(m) ? m : 0);
    };
    const formatTime = (mins) => {
      const normalized = ((mins % 1440) + 1440) % 1440;
      return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
    };

    const now = new Date();
    const departureAt = planDepartureAt({ referenceAt: planReferenceAt, date: activeWeather.forecastDate,
      isFuture: activeWeather.isFuture, offsetHours: departureOffsetHours, restoredAt: restoredDepartureAt });
    const departureDate = new Date(departureAt);
    const todayMidnight = Date.parse(`${koreanDate(now)}T00:00:00+09:00`);
    const depMins = Math.round((departureDate.getTime() - todayMidnight) / 60000);
    const forecastOffsetHours = (departureDate.getTime() - now.getTime()) / 3600000;

    const summitArrivalMins = depMins + ascentMins;
    const descentFinishMins = depMins + totalMins;
    const isNextDayPlan = !activeWeather.isFuture && Math.floor(depMins / 1440) > 0;

    const safeDescentMins = parseTime(activeWeather.safeDescentTime || '15:30', 930);
    const sunsetMins = parseTime(activeWeather.sunset || '18:00', 1080);
    // safeDescentTime은 '하산 완료'가 아니라 '하산을 시작하도록 권장하는 시각'입니다.
    const descentStartMins = summitArrivalMins;
    const recommendedDepDeadlineMins = safeDescentMins - ascentMins;

    const temp = Number(activeWeather.temp || 0);
    const wind = isWeatherNumber(activeWeather.wind_speed) ? Number(activeWeather.wind_speed) : null;
    const cond = activeWeather.condition || '';
    const pm25Match = (activeWeather.dust || '').match(/\d+/);
    const pm25 = pm25Match ? parseInt(pm25Match[0], 10) : 15;
    const scheduleAssessment = assessHikingForecastWindow({
      hourlyData,
      now,
      departureOffsetHours: Math.max(0, forecastOffsetHours),
      durationMinutes: totalMins,
      isFuture: !!activeWeather.isFuture,
      fallbackWeather: {
        temp,
        wind,
        condition: cond,
        targetPop: activeWeather.targetPop,
        pm25,
        humidity: activeWeather.humidity,
      },
    });
    const unavailableWindow = !activeWeather.isFuture && scheduleAssessment.mode === 'current_only' && forecastOffsetHours > 0.5;
    const weatherAssessment = unavailableWindow ? { ...scheduleAssessment.weatherAssessment, score: null, status: '선택 시간대 자료 없음', color: '#64748b', reasons: ['해당 시간의 예보를 확인할 수 없습니다'] } : scheduleAssessment.weatherAssessment;
    const viewEstimate = unavailableWindow ? { ...scheduleAssessment.viewEstimate, score: null, gradeText: '선택 시간대 자료 없음', gradeColor: '#64748b', summaryReason: '해당 시간의 예보를 확인할 수 없습니다', seaOfCloudsHint: null } : scheduleAssessment.viewEstimate;

    let scoreBasisLabel;
    if (activeWeather.isFuture) {
      scoreBasisLabel = '선택일 요약 예보 기준 · 출발 시각별 차이는 미반영';
    } else if (scheduleAssessment.mode === 'course_window') {
      scoreBasisLabel = `${formatTime(depMins)}–${formatTime(descentFinishMins)} 산행 시간대 ${scheduleAssessment.sampleCount}개 시점 중 최저`;
    } else if (scheduleAssessment.mode === 'partial_window') {
      scoreBasisLabel = `${formatTime(depMins)}–${formatTime(descentFinishMins)} 중 시간별 예보 제공 구간만 반영 (${scheduleAssessment.sampleCount}개 시점)`;
    } else if (forecastOffsetHours <= 0.5) {
      scoreBasisLabel = '현재 조건 기준 · 산행 시간대 예보 자료 없음';
    } else {
      scoreBasisLabel = '선택 시간대의 예보가 없어 점수를 표시하지 않습니다';
    }

    let timeSafetyStatus = '시간 여유 있음';
    let timeSafetyColor = '#166534';
    if (activeWeather.isFuture || isNextDayPlan || !activeWeather.sunset || !activeWeather.safeDescentTime) {
      timeSafetyStatus = '날짜별 일몰 정보 확인 필요';
      timeSafetyColor = '#d97706';
    } else if (descentFinishMins > sunsetMins) {
      timeSafetyStatus = '위험 (일몰 후 하산 예상)';
      timeSafetyColor = '#dc2626';
    } else if (descentStartMins > safeDescentMins) {
      timeSafetyStatus = '주의 (권장 하산 시작 시각 경과)';
      timeSafetyColor = '#d97706';
    }

    let summitForecast = null;
    if (!activeWeather.isFuture && Array.isArray(hourlyData) && hourlyData.length > 0) {
      const elapsedHoursToSummit = getHourlyForecastIndex({
        now,
        departureOffsetHours: Math.max(0, forecastOffsetHours),
        hourlyData,
        ascentMinutes: ascentMins,
      });
      if (elapsedHoursToSummit >= 0 && elapsedHoursToSummit < hourlyData.length) {
        const matched = hourlyData[elapsedHoursToSummit];
        const mTemp = Number(matched.temp);
        const estFeels = mTemp <= 15 ? Math.round(mTemp - (wind * 0.7)) : mTemp;
        summitForecast = {
          available: true,
          targetHourLabel: matched.time,
          temp: mTemp,
          feelsLike: estFeels,
          pop: Math.round(Number(matched.pop || 0) * 100),
          description: matched.description || '예보',
          icon: matched.icon
        };
      } else {
        summitForecast = { available: false, reason: '예측 불가 (제공된 시간별 예보 범위 밖)' };
      }
    } else {
      summitForecast = { available: false, reason: '예측 불가 (미래 일자는 시간별 상세 예보 미제공)' };
    }

    return {
      course: selectedCourse,
      departureAt,
      paceObj,
      totalMins,
      ascentMins,
      departureTimeStr: formatTime(depMins),
      summitArrivalTimeStr: formatTime(summitArrivalMins),
      descentFinishTimeStr: formatTime(descentFinishMins),
      recommendedDepDeadlineStr: activeWeather.isFuture || isNextDayPlan || !activeWeather.safeDescentTime ? '날짜별 일몰 정보 확인 필요' : formatTime(recommendedDepDeadlineMins),
      descentStartTimeStr: formatTime(descentStartMins),
      safeDescentStartTime: activeWeather.isFuture || isNextDayPlan || !activeWeather.safeDescentTime ? '날짜별 확인 필요' : activeWeather.safeDescentTime,
      weatherScore: weatherAssessment.score,
      weatherAssessmentStatus: weatherAssessment.status,
      weatherAssessmentReasons: weatherAssessment.reasons,
      weatherAssessment,
      viewEstimate,
      scoreBasisLabel,
      weatherWorstTime: scheduleAssessment.weatherWorstTime,
      viewWorstTime: scheduleAssessment.viewWorstTime,
      timeSafetyStatus,
      timeSafetyColor,
      isNextDayPlan,
      summitForecast,
      gearList: customGearList
    };
  }, [isMountainMode, mountainInfo, selectedCourseIdx, paceType, departureOffsetHours, activeWeather, hourlyData, customGearList, planReferenceAt, restoredDepartureAt]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      <style>{`
        .weather-bg { background-size: auto; animation: none; }
        .clear-day { background: radial-gradient(ellipse at 12% 0%, rgba(125, 211, 252, 0.28), transparent 42%), radial-gradient(ellipse at 88% 70%, rgba(167, 243, 208, 0.2), transparent 35%), #eef4fa; }
        .clear-night { background: radial-gradient(ellipse at 88% 0%, rgba(165, 180, 252, 0.25), transparent 40%), radial-gradient(ellipse at 12% 72%, rgba(125, 211, 252, 0.16), transparent 35%), #eef3fa; }
        .cloudy-day, .cloudy-night { background: radial-gradient(ellipse at 50% 0%, rgba(203, 213, 225, 0.38), transparent 44%), radial-gradient(ellipse at 90% 70%, rgba(186, 230, 253, 0.2), transparent 36%), #eff4f8; }
        .rain { background: radial-gradient(ellipse at 8% 0%, rgba(96, 165, 250, 0.22), transparent 42%), radial-gradient(ellipse at 88% 72%, rgba(165, 180, 252, 0.2), transparent 38%), #edf3fa; }
        .snow { background: radial-gradient(ellipse at 82% 0%, rgba(196, 181, 253, 0.22), transparent 42%), radial-gradient(ellipse at 12% 75%, rgba(186, 230, 253, 0.23), transparent 38%), #f1f4fb; }

        .snow-flake { position: absolute; width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%; top: -10px; animation: snowFall linear infinite; opacity: 0.18; }
        .rain-drop { position: absolute; width: 2px; height: 15px; background: rgba(100,116,139,0.16); top: -20px; animation: rainFall linear infinite; }
        @keyframes snowFall { to { transform: translateY(110vh) translateX(20px); opacity: 0; } }
        @keyframes rainFall { to { transform: translateY(110vh) rotate(15deg); opacity: 0; } }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.84), rgba(248,251,255,0.66)) !important;
          backdrop-filter: blur(22px) saturate(155%);
          -webkit-backdrop-filter: blur(22px) saturate(155%);
          border: 1px solid rgba(255,255,255,0.88) !important;
          box-shadow: 0 16px 38px rgba(31, 48, 76, 0.085), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35) !important;
          border-radius: 20px !important;
        }

        .top-nav { background: rgba(246,250,255,0.68) !important; backdrop-filter: blur(26px) saturate(165%) !important; -webkit-backdrop-filter: blur(26px) saturate(165%) !important; border-bottom: 1px solid rgba(255,255,255,0.82) !important; box-shadow: 0 8px 24px rgba(31,48,76,0.055), inset 0 1px 0 rgba(255,255,255,0.9); padding: 12px 24px !important; }
        .top-nav-inner { max-width: 1320px !important; }
        .search-wrapper > div:first-child { background: rgba(255,255,255,0.62) !important; backdrop-filter: blur(18px) saturate(150%); -webkit-backdrop-filter: blur(18px) saturate(150%); border: 1px solid rgba(255,255,255,0.92) !important; border-radius: 15px !important; box-shadow: 0 6px 20px rgba(31,48,76,0.06), inset 0 1px 0 rgba(255,255,255,0.95) !important; padding: 7px 12px !important; }
        .search-wrapper > div:first-child:focus-within { border-color: rgba(23,107,99,0.35) !important; box-shadow: 0 0 0 3px rgba(23,107,99,0.1), 0 8px 22px rgba(31,48,76,0.08) !important; }
        .top-nav > div > button { background: rgba(255,255,255,0.54) !important; color: #334155 !important; backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.88) !important; border-radius: 13px !important; box-shadow: 0 5px 16px rgba(31,48,76,0.05), inset 0 1px 0 rgba(255,255,255,0.9) !important; padding: 9px 14px !important; }
        .main-container { max-width: 1320px !important; gap: 24px !important; padding: 28px 24px !important; }
        .main-container > div { gap: 20px !important; }
        .weather-main-card { border-radius: 22px !important; box-shadow: 0 20px 46px rgba(31,48,76,0.1), inset 0 1px 0 rgba(255,255,255,0.95) !important; }
        .weather-main-card > div:first-child { background: linear-gradient(145deg, rgba(255,255,255,0.55), rgba(236,246,255,0.48)) !important; }
        .weather-main-right { background: linear-gradient(145deg, rgba(244,249,255,0.6), rgba(235,246,245,0.48)) !important; border-color: rgba(255,255,255,0.78) !important; backdrop-filter: blur(18px); }
        .app-footer { background: rgba(248,251,255,0.72) !important; backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.85) !important; border-radius: 0 !important; }
        .main-container .glass-card { transition: box-shadow 180ms ease; }
        .main-container .glass-card:hover { box-shadow: 0 14px 34px rgba(15,23,42,0.075) !important; }
        .main-container button:not(:disabled) { transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease; }
        .main-container button:not(:disabled):hover { filter: brightness(0.985); }
        .main-container button:active { transform: translateY(1px); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes skeleton-loading { 0% { background-color: rgba(255,255,255,0.5); } 50% { background-color: rgba(255,255,255,0.2); } 100% { background-color: rgba(255,255,255,0.5); } }
        .skeleton { animation: skeleton-loading 1.5s infinite ease-in-out; }

        .mobile-mtn-pills { display: none; }
        .desktop-mtn-list { display: block; }

        /* 💡 레이아웃 전체 간격(gap) 축소 및 모바일 최적화 */
        @media (max-width: 900px) {
          .main-container { grid-template-columns: minmax(0, 1fr) !important; display: grid !important; padding: 18px 16px !important; gap: 14px !important; }
          .main-primary-column, .main-side-column { display: contents !important; }
          .main-container .detail-info-card { order: 1; }
          .main-container .hourly-forecast-card { order: 2; }
          .main-container .main-weekly-card { order: 3; }
          .main-container .main-outlook-card { order: 4; }
          .main-container .main-login-card { order: 5; }
          .main-container.is-mountain-mode .hourly-forecast-card { order: 1; }
          .main-container.is-mountain-mode .detail-info-card { order: 2; }
          .top-nav { padding: 10px 16px !important; }
          .top-nav-inner { flex-direction: column !important; gap: 8px !important; }
          .search-wrapper { width: 100% !important; max-width: 100% !important; }
          .weather-main-card { flex-direction: column !important; }
          .weather-main-right { border-left: none !important; border-top: 1px solid #e8edf3 !important; padding: 14px 16px !important; }
          .app-footer { flex-direction: column !important; gap: 8px !important; padding: 12px !important; text-align: center !important; }
          .mobile-mtn-pills { display: flex !important; }
          .desktop-mtn-list { display: none !important; }
        }
        @media (max-width: 640px) {
          .main-container { padding: 12px 10px !important; gap: 12px !important; }
          .main-container > div { gap: 12px !important; }
          .top-nav { padding: 10px 12px !important; }
          .main-container button, .main-container input, .main-container select { min-height: 40px; }
          .main-container input[type="checkbox"] { min-height: 18px; min-width: 18px; }
          .hourly-chart-wrapper { min-width: 0; }
          .app-footer { font-size: 11px !important; }
        }
      `}</style>

      <WeatherBackground theme={bgTheme} />

      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, backgroundColor: '#166534', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', transform: toast.visible ? 'translateY(0)' : 'translateY(100px)', opacity: toast.visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
        <FiCheckCircle size={18} /> {toast.message}
      </div>

      <nav className="top-nav" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', padding: '12px 40px', display: 'flex', justifyContent: 'center' }}>
        <div className="top-nav-inner" style={{ display: 'flex', width: '100%', maxWidth: '1320px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div className="search-wrapper" style={{ position: 'relative', display: 'flex', width: '44%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: '30px', padding: '6px 20px', alignItems: 'center', zIndex: 10, border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
              <input 
                type="text" 
                placeholder={isMountainMode ? "20대 명산 검색 (예: 북한산...)" : "검색할 지역을 입력하세요"} 
                value={searchInput} 
                onChange={handleInputChange} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                onFocus={() => setIsSearchFocused(true)} 
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)} 
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, padding: '6px', fontSize: '14px', backgroundColor: 'transparent', color: '#1e293b', fontWeight: '500' }} 
              />
              <button type="button" onClick={handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#334155' }}>
                <FiSearch size={18} />
              </button>
            </div>

            {isSearchFocused && (
              <div className="no-scrollbar glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, borderRadius: '15px', marginTop: '10px', zIndex: 50, padding: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                {searchInput.trim() === '' && !isMountainMode ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><FiClock /> 최근 검색어</h4>
                      {recentSearches.length > 0 && (
                        <button onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.setItem('recentSearches', '[]'); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>전체 삭제</button>
                      )}
                    </div>
                    {recentSearches.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {recentSearches.map((term, idx) => (
                          <li key={idx} onMouseDown={(e) => { e.preventDefault(); executeSearch(term); }} style={{ padding: '8px 4px', cursor: 'pointer', color: '#333', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== recentSearches.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                            <span>{term}</span><FiSearch color="#94a3b8" size={12} />
                          </li>
                        ))}
                      </ul>
                    ) : <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px 0' }}>최근 검색어가 없습니다.</p>}
                  </>
                ) : searchInput.trim() === '' && isMountainMode ? (
                  <>
                    <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>⛰️ 20대 명산 목록</h4>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {MOUNTAINS_LIST.map((m, idx) => (
                        <li key={idx} onMouseDown={(e) => { e.preventDefault(); loadMountainWeather(m.name); setIsSearchFocused(false); }} style={{ padding: '8px 4px', cursor: 'pointer', color: '#333', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <span><strong>{m.name}</strong> <span style={{ fontSize: '11px', color: '#64748b' }}>({m.peak})</span></span>
                          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold' }}>해발 {m.elevation}m</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: '0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><FiSearch size={12}/> 일치하는 {isMountainMode ? '산 이름' : '지역명'}</h4>
                    </div>
                    {autoCompleteList.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {autoCompleteList.map((region, idx) => (
                          <li key={idx} onMouseDown={(e) => { e.preventDefault(); executeSearch(region); }} style={{ padding: '8px 4px', cursor: 'pointer', color: '#333', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <span>
                              {region.split(new RegExp(`(${searchInput})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchInput.toLowerCase() ? <span key={i} style={{ color: '#3182ce', fontWeight: 'bold' }}>{part}</span> : part
                              )}
                            </span>
                            <FiSearch color="#94a3b8" size={12} />
                          </li>
                        ))}
                      </ul>
                    ) : <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px 0' }}>결과가 없습니다.</p>}
                  </>
                )}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" className="header-hiking-button" onClick={() => { setIsFishingPage(false); if (!isMountainMode) { setIsMountainMode(true); loadMountainWeather('북한산'); } setTimeout(() => document.getElementById('hiking-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}>내 산행</button>
          <button type="button" onClick={() => setIsFishingPage(value => !value)} style={{ backgroundColor: isFishingPage ? 'rgba(20,184,166,0.88)' : 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '7px 14px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {isFishingPage ? '☀️ 날씨 홈' : '🎣 바다 낚시'}
          </button>
          <button type="button" onClick={() => setIsNoticeOpen(true)} style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
            <FiBell size={14} /> 공지사항
          </button>
          </div>
        </div>
      </nav>

      {!isFishingPage && <div className="weather-status-shell"><WeatherConnectionStatus state={connectionState} hasData={weatherData.hasData} fetchedAt={weatherFetchedAt} onRetry={retryForecast} /></div>}
      {isFishingPage ? <FishingPage /> : <main className={`main-container ${isMountainMode ? 'is-mountain-mode' : ''}`} style={{ flexGrow: 1, maxWidth: '1320px', margin: '0 auto', width: '100%', zIndex: 1, padding: '28px 24px' }}>
        <div className="main-primary-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          
          <WeatherMain 
            weatherData={activeWeather} 
            hourlyData={hourlyData}
            weeklyData={weeklyData}
            selectedDateIdx={selectedDateIdx}
            onSelectDate={(idx) => { setSelectedDateIdx(idx); setRestoredDepartureAt(null); setPlanReferenceAt(Date.now()); }}
            isAiLoading={isAiLoading && !weatherData.hasData}
            aiMessage={aiMessage} 
            favorites={favorites} 
            onAddClick={handleOpenAddRegion} 
            onFavoriteClick={(fav) => { if (isMountainMode) setIsMountainMode(false); loadWeather(fav.lat, fav.lon, fav.name); }} 
            onRemoveFavorite={handleRemoveFavorite} 
            isLoggedIn={!!loggedInUser}
            onCurrentLocationClick={handleCurrentLocation}
            isMountainMode={isMountainMode}
            onToggleMountainMode={handleToggleMountainMode}
            mountainInfo={mountainInfo}
            mountainsList={MOUNTAINS_LIST}
            onSelectMountain={(mName) => loadMountainWeather(mName)}
          />
          
          <HourlyForecast 
            hourlyData={hourlyData} 
            isLoading={isAiLoading && !weatherData.hasData}
            error={forecastError} 
            onRetry={() => {
              const request = lastWeatherRequestRef.current;
              if (request.kind === 'mountain') loadMountainWeather(request.mountainName);
              else loadWeather(request.lat, request.lon, request.regionName);
            }}
            isMountainMode={isMountainMode}
            mountainInfo={mountainInfo}
            weatherData={activeWeather}
            onShowToast={showToast}
            selectedCourseIdx={selectedCourseIdx}
            onSelectCourseIdx={setSelectedCourseIdx}
            paceType={paceType}
            onSelectPaceType={setPaceType}
            departureOffsetHours={departureOffsetHours}
            onSelectDepartureOffset={hours => { setDepartureOffsetHours(hours); setRestoredDepartureAt(null); setPlanReferenceAt(Date.now()); }}
            departureAt={hikingPlanSummary?.departureAt}
            restoredDepartureAt={restoredDepartureAt}
            onRestoreDeparture={value => { setSelectedDateIdx(0); setRestoredDepartureAt(value); setDepartureOffsetHours(0); }}
            isStale={connectionState.phase !== 'success'}
            onGearListChange={setCustomGearList}
            loggedInUser={loggedInUser}
            selectedDateIdx={selectedDateIdx}
            hikingPlanSummary={hikingPlanSummary}
            onApplyHikingPlan={handleApplyHikingPlan}
            onRequireLogin={() => { setLoginPrompt(value => value + 1); document.getElementById('member-login')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); showToast('로그인하면 작성 중인 산행 계획을 이어서 저장할 수 있어요.'); }}
          />
          
          <div className="main-outlook-card" style={{ display: 'flex', flexDirection: 'column' }}>
            {activeWeather.hasData ? <WeatherOutlook
              weeklyData={weeklyData} 
              aiBriefing={aiBriefing} 
              isMountainMode={isMountainMode} 
              mountainInfo={mountainInfo} 
              weatherData={activeWeather}
              hikingPlanSummary={hikingPlanSummary}
            /> : <div className="glass-card weather-empty"><strong>날씨 전망</strong><p>예보 자료가 확인되면 전망과 활동 안내를 제공합니다.</p></div>}
          </div>
        </div>
        
        <div className="main-side-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          <div id="member-login" className="glass-card main-login-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
             <LoginCard
              loginPrompt={loginPrompt}
              onSignUpClick={() => setIsSignUpOpen(true)} 
              onFindPasswordClick={() => setIsFindPasswordOpen(true)} 
              loggedInUser={loggedInUser} 
              onLogin={handleLogin} 
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
          
          <WeatherDetails 
            current={{ 
              hasData: activeWeather.hasData,
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
              isFuture: activeWeather.isFuture,
              weatherSources: activeWeather.weatherSources,
              dataNote: activeWeather.dataNote,
              nextHoursRainPop: Math.round(Math.max(0, ...hourlyData.slice(0, 6).map(item => Number(item?.pop || 0))) * 100)
            }} 
            airQuality={{ 
              level: activeWeather.dust === '확인 불가' ? '확인 불가' : (activeWeather.dust && activeWeather.dust.split(' ')[0]) || '확인 불가',
              pm25: (activeWeather.dust && activeWeather.dust.match(/\d+/)) ? parseInt(activeWeather.dust.match(/\d+/)[0], 10) : null
            }}
            isMountainMode={isMountainMode}
            mountainInfo={mountainInfo}
            weatherFetchedAt={weatherFetchedAt}
          />
          
          <div className="main-weekly-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <WeeklyForecast weeklyData={weeklyData} isLoading={isAiLoading} />
          </div>
        </div>
      </main>}

      <footer className="app-footer glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', color: '#1e293b', fontSize: '12px', borderRadius: '0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.4)' }}>
        <div>
          <span style={{ fontWeight: '500' }}>© 2026 Weather Web Project.</span><span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
          <span style={{ cursor: 'pointer' }} onClick={() => showToast('이용약관 페이지는 준비 중입니다.')}>이용약관</span><span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
          <span style={{ cursor: 'pointer' }} onClick={() => showToast('개인정보처리방침 페이지는 준비 중입니다.')}>개인정보처리방침</span>
        </div>
        <button onClick={openAdmin} style={{ background: 'none', border: 'none', color: '#1e293b', cursor: 'pointer', opacity: 0.3 }} title="Admin"><FiSettings size={16} /></button>
      </footer>

      {isAdminAuthOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', width: '320px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>🔒 관리자 인증</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666' }}>관리자 권한 확인을 위해 비밀번호를 입력해 주세요.</p>
            <input type="password" placeholder="비밀번호 입력" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()} style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsAdminAuthOpen(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
              <button onClick={handleAdminAuth} style={{ flex: 1, padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>확인</button>
            </div>
          </div>
        </div>
      )}
      {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
      {isSignUpOpen && <SignUpModal onClose={() => setIsSignUpOpen(false)} onLogin={handleLogin} />}
      {isFindPasswordOpen && <FindPasswordModal onClose={() => setIsFindPasswordOpen(false)} />}
      {isAddRegionOpen && <AddRegionModal onClose={() => setIsAddRegionOpen(false)} onAddRegion={handleAddFavorite} isAiLoading={isAiLoading} isLoggedIn={!!loggedInUser} />}
      {isAdminPageOpen && (
        <AdminPage adminPassword={adminPw} adminToken={adminPw ? '' : loggedInUser?.accessToken} adminRole={adminRole} onClose={() => { setIsAdminPageOpen(false); setAdminPw(''); setAdminRole(''); }} />
      )}
    </div>
  );
}

export default App;
