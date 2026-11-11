// 앱 뼈대: 공통 상태를 만들고, 상단 메뉴·푸터·팝업과 페이지별 주소(Route)를 연결합니다.
//
//   /                   날씨 페이지   pages/weather
//   /mountain/:산이름   산악 페이지   pages/mountain
//   /fishing            낚시 페이지   pages/fishing
//   /admin              관리자 페이지 pages/admin
//
// 페이지 안의 기능은 각 pages/ 폴더에서 작업하고, 여러 페이지가 같이 쓰는 기능은 shared/에 있습니다.
// 새 페이지를 만들면 아래 <Routes>에 <Route> 한 줄을 추가하세요.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import './App.css';
import { AppContext } from './shared/AppContext';
import { API } from './shared/lib/config';
import AppShellStyles from './shared/layout/AppShellStyles';
import WeatherBackground from './shared/layout/WeatherBackground';
import Toast from './shared/layout/Toast';
import { useToast } from './shared/layout/useToast';
import TopNav from './shared/layout/TopNav';
import NoticeModal from './shared/layout/NoticeModal';
import { useSearch } from './shared/layout/useSearch';
import { useAuth } from './shared/auth/useAuth';
import { useFavorites } from './shared/auth/useFavorites';
import SignUpModal from './shared/auth/SignUpModal';
import FindPasswordModal from './shared/auth/FindPasswordModal';
import { useForecast } from './shared/forecast/useForecast';
import { buildActiveWeather } from './shared/forecast/activeWeather';
import WeatherConnectionStatus from './shared/forecast/WeatherConnectionStatus';
import WeatherPage from './pages/weather/WeatherPage';
import AddRegionModal from './pages/weather/AddRegionModal';
import MountainPage from './pages/mountain/MountainPage';
import { useMountainCatalog } from './pages/mountain/useMountainCatalog';
import { useHikingPlan, useManualCourse } from './pages/mountain/useHikingPlan';
import { buildHikingPlanSummary } from './pages/mountain/hikingPlanSummary';
import { parseManualCourse } from './pages/mountain/lib/manualCourse.js';
import FishingPage from './pages/fishing/FishingPage';
import AdminRoute from './pages/admin/AdminRoute';

const DEFAULT_LOCATION = { name: '부천시', lat: 37.5034, lon: 126.7660 };
const DEFAULT_MOUNTAIN = '북한산';
const mountainPath = (name) => (name ? `/mountain/${encodeURIComponent(name)}` : '/mountain');

// 현재 주소가 어느 화면 모드인지: 날씨(false), 산악(true), 그 외 낚시·관리자(null)
const routeModeOf = (pathname) => (pathname === '/' ? false : pathname === '/mountain' || pathname.startsWith('/mountain/') ? true : null);
const safeDecode = (value) => { try { return decodeURIComponent(value); } catch { return value; } };
// 주소의 산 이름은 %EB%B6%81... 처럼 인코딩되어 있으므로 원래 이름으로 되돌립니다.
const routeMountainOf = (pathname) => {
  const name = matchPath('/mountain/:name', pathname)?.params.name;
  return name ? safeDecode(name) : null;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeMode = routeModeOf(location.pathname);
  const routeMountainName = routeMountainOf(location.pathname);
  const isFishingPage = location.pathname === '/fishing';

  // 낚시·관리자 페이지에 있는 동안에도 마지막으로 보던 날씨/산악 모드를 기억합니다.
  const [mainMode, setMainMode] = useState(routeMode ?? false);
  const isMountainMode = routeMode ?? mainMode;
  const skipModeLoadRef = useRef(false);
  const lastMainPathRef = useRef('/');

  const { mountainsList, mountainCatalogState, retryMountainCatalog } = useMountainCatalog();
  const plan = useHikingPlan();
  const { toast, showToast } = useToast();
  const forecast = useForecast({ mountainsList, onNewForecast: plan.resetPlan });
  const { mountainInfo, setIsAiLoading, loadForecast } = forecast;

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);

  // 첫 화면이 산악 페이지 주소면 그 산을 먼저 불러옵니다. (사용자가 다른 곳을 고르면 비워집니다)
  const initialMountainRef = useRef(routeMode === true ? (routeMountainName || DEFAULT_MOUNTAIN) : null);

  const loadWeather = (lat, lon, regionName) => { initialMountainRef.current = null; return loadForecast({ kind: 'weather', lat, lon, regionName }); };
  const loadMountainWeather = (mountainName, { initial = false } = {}) => {
    if (!initial) initialMountainRef.current = null;
    // 산악 페이지에 있으면 주소도 /mountain/산이름 으로 맞춰 둡니다. (공유·새로고침용)
    const { pathname, search } = window.location;
    if (routeModeOf(pathname) === true && routeMountainOf(pathname) !== mountainName) {
      navigate(mountainPath(mountainName) + search, { replace: true });
    }
    return loadForecast({ kind: 'mountain', mountainName });
  };

  const search = useSearch({ isMountainMode, mountainsList, loadWeather, loadMountainWeather, setIsAiLoading, showToast });
  const auth = useAuth(showToast);
  const { loggedInUser, setLoggedInUser } = auth;
  const { manualCourse, effectiveMountainInfo, saveManualCourse } = useManualCourse({ loggedInUser, mountainInfo });
  const { favorites, saveFavorites } = useFavorites({
    loggedInUser, setLoggedInUser, showToast,
    onLocationReady: (initialLocation) => {
      if (initialMountainRef.current) loadMountainWeather(initialMountainRef.current, { initial: true });
      else if (!isMountainMode) loadWeather(initialLocation.lat, initialLocation.lon, initialLocation.name);
    },
  });

  // 버튼으로 날씨 ↔ 산악 화면을 바꿀 때 사용합니다. 버튼 쪽에서 직접 예보를 불러오므로 아래 기본 불러오기는 건너뜁니다.
  const goToMode = (mountain, path) => {
    if (mountain !== isMountainMode) skipModeLoadRef.current = true;
    navigate(path);
  };

  // 뒤로가기·주소 입력처럼 버튼 없이 날씨/산악 화면이 바뀐 경우 그 화면의 기본 예보를 불러옵니다.
  useEffect(() => {
    if (routeMode === null || routeMode === mainMode) return;
    setMainMode(routeMode);
    if (skipModeLoadRef.current) { skipModeLoadRef.current = false; return; }
    if (routeMode) loadMountainWeather(routeMountainName || mountainInfo?.name || DEFAULT_MOUNTAIN);
    else {
      const targetFav = favorites[0] || DEFAULT_LOCATION;
      loadWeather(targetFav.lat, targetFav.lon, targetFav.name);
    }
  }, [routeMode]);

  useEffect(() => {
    if (location.pathname !== '/admin') lastMainPathRef.current = location.pathname + location.search;
  }, [location.pathname, location.search]);

  const handleApplyHikingPlan = async (savedPlan) => {
    if (!isMountainMode) goToMode(true, mountainPath(savedPlan.mountain_name) + window.location.search);
    const restoredCourse = parseManualCourse(savedPlan.course_name);
    if (restoredCourse && savedPlan.mountain_name) saveManualCourse(savedPlan.mountain_name, restoredCourse);
    if (savedPlan.mountain_name && savedPlan.mountain_name !== mountainInfo?.name) {
      const loaded = await loadMountainWeather(savedPlan.mountain_name);
      if (!loaded) throw new Error('산악 예보를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.');
    }
    const parsedDeparture = Date.parse(savedPlan.departure_at);
    const isUpcoming = Number.isFinite(parsedDeparture) && parsedDeparture >= Date.now();
    const validDeparture = isUpcoming;
    plan.setSelectedDateIdx(0);
    const mountain = mountainsList.find(item => item.name === savedPlan.mountain_name);
    const namedCourseIndex = mountain?.courses?.findIndex(course => course.name === savedPlan.course_name) ?? -1;
    plan.setSelectedCourseIdx(namedCourseIndex >= 0 ? namedCourseIndex : Number(savedPlan.course_index) || 0);
    plan.setPaceType(savedPlan.pace || 'normal');
    plan.setDepartureOffsetHours(0);
    plan.setRestoredDepartureAt(validDeparture ? new Date(parsedDeparture).toISOString() : null);
    plan.setPlanReferenceAt(Date.now());
    showToast(validDeparture ? '저장한 날짜·출발 시각과 준비물을 불러왔어요. 예보 제공 범위를 확인해 주세요.' : '지난 출발 일정입니다. 코스와 준비물을 불러왔으니 새 출발 시각을 선택해 주세요.');
  };

  const handleToggleMountainMode = () => {
    const nextMode = !isMountainMode;
    search.resetSearch();
    if (nextMode) {
      const target = mountainInfo?.name || DEFAULT_MOUNTAIN;
      goToMode(true, mountainPath(target));
      loadMountainWeather(target);
      showToast('⛰️ 산악 기상 모드로 전환되었습니다.');
    } else {
      const targetFav = favorites[0] || DEFAULT_LOCATION;
      goToMode(false, '/');
      loadWeather(targetFav.lat, targetFav.lon, targetFav.name);
      showToast('🏕️ 일반 도시 날씨 모드로 전환되었습니다.');
    }
  };

  const handleFavoriteClick = (fav) => {
    if (isMountainMode) goToMode(false, '/');
    loadWeather(fav.lat, fav.lon, fav.name);
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
      if (isMountainMode) goToMode(false, '/');
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch { showToast('지역 추가 중 오류가 발생했습니다.'); setIsAiLoading(false); }
  };

  const handleRemoveFavorite = async (nameToRemove) => {
    const newFavs = favorites.filter(fav => fav.name !== nameToRemove);
    const synced = await saveFavorites(newFavs);
    showToast(loggedInUser && !synced ? '이 브라우저에서는 삭제했지만 계정 동기화에 실패했어요.' : '관심 지역에서 삭제했어요.');
  };

  const handleCurrentLocation = () => {
    if (isMountainMode) { showToast('산악 모드에서는 산 목록을 선택해 주세요.'); return; }
    if (!navigator.geolocation) { showToast('브라우저에서 위치 서비스를 지원하지 않습니다.'); return; }
    setIsAiLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loaded = await loadWeather(latitude, longitude, null);
        if (loaded) showToast('현재 위치의 날씨를 성공적으로 불러왔습니다.');
      },
      () => { setIsAiLoading(false); showToast('위치 접근 권한을 허용해 주세요.'); }
    );
  };

  const handleOpenHikingPlanner = () => {
    if (isMountainMode) {
      if (routeMode !== true) navigate(mountainPath(mountainInfo?.name));
    } else {
      goToMode(true, mountainPath(DEFAULT_MOUNTAIN));
      loadMountainWeather(DEFAULT_MOUNTAIN);
    }
    setTimeout(() => { window.dispatchEvent(new Event('weather:open-hiking-planner')); document.getElementById('hiking-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  // 낚시 페이지에서 '날씨 홈'을 누르면 마지막으로 보던 날씨/산악 화면으로 돌아갑니다.
  const mainPath = isMountainMode ? mountainPath(mountainInfo?.name) : '/';
  const handleToggleFishing = () => navigate(isFishingPage ? mainPath : '/fishing');
  const exitAdmin = () => navigate(lastMainPathRef.current || '/');

  const activeWeather = useMemo(
    () => buildActiveWeather({ weatherData: forecast.weatherData, weeklyData: forecast.weeklyData, selectedDateIdx: plan.selectedDateIdx, isMountainMode }),
    [forecast.weatherData, forecast.weeklyData, plan.selectedDateIdx, isMountainMode],
  );

  const hikingPlanSummary = useMemo(() => buildHikingPlanSummary({
    isMountainMode, activeWeather, mountainInfo, effectiveMountainInfo, hourlyData: forecast.hourlyData,
    selectedCourseIdx: plan.selectedCourseIdx, paceType: plan.paceType, departureOffsetHours: plan.departureOffsetHours,
    planReferenceAt: plan.planReferenceAt, restoredDepartureAt: plan.restoredDepartureAt, customGearList: plan.customGearList,
  }), [isMountainMode, mountainInfo, manualCourse?.name, plan.selectedCourseIdx, plan.paceType, plan.departureOffsetHours, activeWeather, forecast.hourlyData, plan.customGearList, plan.planReferenceAt, plan.restoredDepartureAt]);

  // 페이지에서 useApp()으로 꺼내 쓰는 값들
  const app = {
    ...forecast, ...plan, ...auth,
    isMountainMode, activeWeather, hikingPlanSummary, showToast,
    mountainsList, mountainCatalogState, retryMountainCatalog,
    manualCourse, effectiveMountainInfo, saveManualCourse,
    favorites, loadWeather, loadMountainWeather,
    handleApplyHikingPlan, handleToggleMountainMode, handleFavoriteClick, handleRemoveFavorite, handleCurrentLocation,
    handleOpenAddRegion: () => setIsAddRegionOpen(true),
    setIsSignUpOpen, setIsFindPasswordOpen,
  };

  return (
    <AppContext.Provider value={app}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AppShellStyles />
        <WeatherBackground theme={forecast.bgTheme} />
        <Toast toast={toast} />

        <TopNav
          search={search} isMountainMode={isMountainMode} isFishingPage={isFishingPage}
          mountainsList={mountainsList} loadMountainWeather={loadMountainWeather}
          onOpenHikingPlanner={handleOpenHikingPlanner} onToggleFishing={handleToggleFishing} onOpenNotices={() => setIsNoticeOpen(true)}
        />

        {routeMode !== null && <div className="weather-status-shell"><WeatherConnectionStatus state={forecast.connectionState} hasData={forecast.weatherData.hasData} fetchedAt={forecast.weatherFetchedAt} onRetry={forecast.retryForecast} /></div>}

        <Routes>
          <Route path="/" element={<WeatherPage />} />
          <Route path="/mountain" element={<MountainPage />} />
          <Route path="/mountain/:name" element={<MountainPage />} />
          <Route path="/fishing" element={<FishingPage />} />
          <Route path="/admin" element={<AdminRoute loggedInUser={loggedInUser} onExit={exitAdmin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <footer className="app-footer glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', color: '#1e293b', fontSize: '12px', borderRadius: '0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.4)' }}>
          <div>
            <span style={{ fontWeight: '500' }}>© 2026 Weather Web Project.</span><span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('이용약관 페이지는 준비 중입니다.')}>이용약관</span><span style={{ margin: '0 12px', color: '#94a3b8' }}>|</span>
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('개인정보처리방침 페이지는 준비 중입니다.')}>개인정보처리방침</span>
          </div>
          <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#1e293b', cursor: 'pointer', opacity: 0.3 }} title="Admin"><FiSettings size={16} /></button>
        </footer>

        {isNoticeOpen && <NoticeModal onClose={() => setIsNoticeOpen(false)} />}
        {isSignUpOpen && <SignUpModal onClose={() => setIsSignUpOpen(false)} onLogin={auth.handleLogin} />}
        {isFindPasswordOpen && <FindPasswordModal onClose={() => setIsFindPasswordOpen(false)} />}
        {isAddRegionOpen && <AddRegionModal onClose={() => setIsAddRegionOpen(false)} onAddRegion={handleAddFavorite} isAiLoading={forecast.isAiLoading} isLoggedIn={!!loggedInUser} />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
