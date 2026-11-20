// 낚시 페이지 ( /fishing )
//   fishingApi.js      서버 요청          useFishingData.js  해역 목록·바다 정보 상태
//   fishingFormat.js   화면용 값 변환      components/        화면 영역별 컴포넌트
//   FishingPage.css    낚시 페이지 전용 스타일
//   useFavoritePoints.js  즐겨찾는 포인트 (브라우저 / 로그인 시 계정)
// 물때 계산은 lib/tideCalendar.js 에 있습니다.
// 포인트를 고르면 주소가 /fishing?point=추자도 처럼 바뀌어 새로고침·공유해도 같은 포인트가 열립니다.
// 아래 내용은 탭(components/FishingTabs.jsx, lib/tabs.js)으로 나눠 하나씩 보여줍니다. ?tab=forecast 처럼 주소에 남습니다.
// 새 영역은 components/에 만들고 알맞은 <TabPanel> 안에 넣으면 됩니다.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiInfo, FiRefreshCw } from 'react-icons/fi';
import './FishingPage.css';
import { recordSearch } from '../../shared/lib/searchEvents';
import { useApp } from '../../shared/AppContext';
import { readStoredJson, writeStoredJson } from '../../shared/lib/browserStorage';
import { useFishingAreas, useFishingPoints, useFishingSummary } from './useFishingData';
import { useFavoritePoints } from './useFavoritePoints';
import { useMyLocation } from './useMyLocation';
import { nearestPoint } from './lib/nearest';
import FishingHero from './components/FishingHero';
import PointPicker from './components/PointPicker';
import FishingIndexModal from './components/FishingIndexModal';
import FishingIndexPanel from './components/FishingIndexPanel';
import WarningBanner from './components/WarningBanner';
import ForecastOutlook from './components/ForecastOutlook';
import BuoyPanel from './components/BuoyPanel';
import TidePanel from './components/TidePanel';
import MarineForecastPanel from './components/MarineForecastPanel';
import SunPanel from './components/SunPanel';
import GearChecklist from './components/GearChecklist';
import FishingLoginCard from './components/FishingLoginCard';
import FishingTabs, { TabPanel } from './components/FishingTabs';
import { DEFAULT_TAB, tabFromQuery } from './lib/tabs';

const DEFAULT_POINT = '추자도';
const LAST_POINT_KEY = 'fishing:last-point';

export default function FishingPage() {
  const { loggedInUser, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const areas = useFishingAreas();
  const { points, status } = useFishingPoints();
  const { favorites, toggle, isFavorite } = useFavoritePoints({ loggedInUser, showToast });
  const [areaId, setAreaId] = useState(areas[0].id);
  // 기본 포인트: 주소(?point=) → 마지막으로 고른 포인트 → 내 위치에서 가장 가까운 포인트 → 추자도
  const [chosenPoint, setChosenPoint] = useState(() => searchParams.get('point') || readStoredJson(LAST_POINT_KEY, null) || null);
  const myLocation = useMyLocation(!chosenPoint);
  // 포인트 고르기 창은 처음 들어오면 항상 열어 둡니다. 포인트를 고르면 닫히고, '포인트 바꾸기'로 다시 엽니다.
  const [pickerOpen, setPickerOpen] = useState(true);
  const [indexModal, setIndexModal] = useState(null); // { pointId, pointName, index?, guide? }

  // 포인트 목록을 못 받으면(예전 서버·키 없음) 예전처럼 해역 3곳으로 동작합니다.
  const pointMode = status !== 'failed';
  const nearby = !chosenPoint && myLocation.phase === 'found' && status === 'ready' ? nearestPoint(points, myLocation.coords) : null;
  // 위치를 확인하는 동안(또는 위치는 찾았는데 포인트 목록이 아직이면) 바다 정보를 부르지 않고 기다립니다.
  const waitingForNearby = !chosenPoint && pointMode && (myLocation.phase === 'locating' || (myLocation.phase === 'found' && status !== 'ready'));
  const wanted = chosenPoint || nearby?.point.id || DEFAULT_POINT;
  const pointId = status === 'ready' && !points.some((point) => point.id === wanted)
    ? (points.find((point) => point.id === DEFAULT_POINT) || points[0]).id : wanted;
  const listed = points.find((point) => point.id === pointId);
  const fallbackArea = areas.find((item) => item.id === areaId) || areas[0];
  const { data, error, loading, reload, cachedAt } = useFishingSummary(pointMode ? { id: `point:${pointId}`, pointId } : fallbackArea, { enabled: !waitingForNearby });
  const area = pointMode ? {
    id: `point:${pointId}`, pointId, place: waitingForNearby ? '가까운 포인트 찾는 중…' : listed?.name || pointId,
    lat: listed?.lat ?? data?.coordinates?.lat, lon: listed?.lon ?? data?.coordinates?.lon,
    tide_system: listed?.tide_system ?? data?.tide_system ?? 8,
    region_name: listed?.region_name || data?.region_name || '',
  } : fallbackArea;

  const tab = tabFromQuery(searchParams.get('tab'));
  const selectTab = (id) => setSearchParams((previous) => {
    const next = new URLSearchParams(previous);
    if (id === DEFAULT_TAB) next.delete('tab'); else next.set('tab', id);
    return next;
  }, { replace: true });

  const selectPoint = (id) => {
    setChosenPoint(id);
    setPickerOpen(false);
    writeStoredJson(LAST_POINT_KEY, id);
    setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('point', id); return next; }, { replace: true });
  };

  const sources = data?.sources || {};
  const errors = data?.errors || {};
  const forecastRows = sources.forecast?.records || [];

  return <main className="fishing-page">
    {/* 위쪽: 왼쪽은 오늘 요약·특보, 오른쪽은 로그인 (좁은 화면에서는 로그인이 맨 아래로) */}
    <div className="fish-top-row">
      <div className="fish-top-main">
        <FishingHero areas={areas} area={area} onAreaChange={setAreaId} loading={loading} onReload={reload}
          pointMode={pointMode} pickerOpen={pickerOpen} onOpenPicker={() => setPickerOpen((open) => !open)} isFavorite={isFavorite(pointId)} onToggleFavorite={() => toggle(pointId)}
          favoritePoints={favorites} onSelectPoint={selectPoint} data={data}
          nearbyKm={nearby && nearby.point.id === pointId ? nearby.distanceKm : null} />
        {cachedAt != null && <StaleNotice cachedAt={cachedAt} loading={loading} error={error} onRetry={reload} />}
        {error && cachedAt == null && <div className="fish-error" role="alert"><FiInfo /> {error}<button onClick={reload}>다시 시도</button></div>}
        {loading && !data && <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>해양 기관 자료를 불러오고 있어요</b><span>첫 요청은 서버 준비로 다소 오래 걸릴 수 있습니다.</span></div></div>}
        {data && <WarningBanner warnings={sources.warnings} error={errors.warnings} />}
      </div>
      <FishingLoginCard />
    </div>

    {pointMode && pickerOpen && (status === 'ready'
      ? <PointPicker points={points} selectedId={pointId} favorites={favorites} onSelect={id => {
          const point = points.find(item => item.id === id);
          if (point) recordSearch('fishing', point.name, 'found');
          selectPoint(id);
        }} onToggleFavorite={toggle} onClose={() => setPickerOpen(false)} isLoggedIn={Boolean(loggedInUser)}
          onShowIndex={(point) => setIndexModal({ pointId: point.id, pointName: point.name })} />
      : <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>낚시 포인트 목록을 불러오고 있어요</b></div></div>)}

    <FishingTabs active={tab} onChange={selectTab} />

    {/* 탭을 바꿔도 내용은 숨기기만 해서(hidden) 보던 날짜·편집 중인 내용이 그대로 남습니다. */}
    <TabPanel id="index" active={tab}>
      <FishingIndexPanel key={area.id} index={sources.fishing_index} error={errors.fishing_index} warnings={sources.warnings?.items || []}
        onShowGuide={() => setIndexModal({ pointId: area.pointId, pointName: area.place, guide: true, index: sources.fishing_index?.days?.length ? sources.fishing_index : undefined })} />
    </TabPanel>

    <TabPanel id="forecast" active={tab}>
      <ForecastOutlook forecastRows={forecastRows} />
      <MarineForecastPanel regionName={data?.region_name || area.region_name} forecastRows={forecastRows} error={errors.forecast} />
    </TabPanel>

    <TabPanel id="sea" active={tab}>
      <section className="fish-metrics">
        <BuoyPanel area={area} buoyRows={sources.buoy?.records || []} error={errors.buoy} />
        <TidePanel area={area} tideSource={sources.tide} error={errors.tide} />
      </section>
      <SunPanel area={area} />
    </TabPanel>

    <TabPanel id="gear" active={tab}>
      <GearChecklist area={area} indexDays={sources.fishing_index?.days || []} forecastRows={forecastRows} warnings={sources.warnings?.items || []} />
    </TabPanel>

    <details className="fish-source-details"><summary><FiInfo /> 자료 범위와 기준</summary><p>해상예보는 선택 해역 단위이며 개별 포인트의 예보가 아닙니다. 부이는 위치와 거리를 함께 표시한 참고 관측이고, TideBED 조위는 응답에 포함된 인근 기준 관측소의 예측입니다. 각 기관 자료의 발표·관측 시각을 확인해 최신성도 살펴보세요.</p></details>
    {indexModal && <FishingIndexModal key={indexModal.pointId || 'guide'} pointId={indexModal.pointId} pointName={indexModal.pointName} initialIndex={indexModal.index} openGuide={Boolean(indexModal.guide)} onClose={() => setIndexModal(null)} />}
    <p className="fish-disclaimer"><FiInfo /> {data?.notice || '기관 예보와 관측을 참고용으로 제공합니다. 출조 전 기상특보와 현장 상황을 별도로 확인하세요.'}</p>
  </main>;
}

// 서버가 느리거나 막혔을 때: 이 브라우저에 저장해 둔 마지막 자료를 보여주고 있다는 안내
function StaleNotice({ cachedAt, loading, error, onRetry }) {
  const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(cachedAt);
  return <div className={`fish-stale ${error ? 'failed' : ''}`} role="status">
    {loading ? <FiRefreshCw className="fish-spin" /> : <FiInfo />}
    <span>{loading ? <>지난번에 받은 <b>{time}</b> 자료를 먼저 보여주고 있어요. 최신 자료를 불러오는 중…</>
      : <>서버가 응답하지 않아 <b>{time}</b>에 받은 자료를 보여주고 있어요. 지금 바다와 다를 수 있어요.</>}</span>
    {!loading && <button type="button" onClick={onRetry}>다시 시도</button>}
  </div>;
}
