// 낚시 페이지 ( /fishing )
//   fishingApi.js      서버 요청          useFishingData.js  해역 목록·바다 정보 상태
//   fishingFormat.js   화면용 값 변환      components/        화면 영역별 컴포넌트
//   FishingPage.css    낚시 페이지 전용 스타일
//   useFavoritePoints.js  즐겨찾는 포인트 (브라우저 / 로그인 시 계정)
// 물때 계산은 lib/tideCalendar.js 에 있습니다.
// 포인트를 고르면 주소가 /fishing?point=추자도 처럼 바뀌어 새로고침·공유해도 같은 포인트가 열립니다.
// 새 영역은 components/에 만들고 아래 순서에 끼워 넣으면 됩니다.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiInfo, FiRefreshCw } from 'react-icons/fi';
import './FishingPage.css';
import { useApp } from '../../shared/AppContext';
import { readStoredJson, writeStoredJson } from '../../shared/lib/browserStorage';
import { useFishingAreas, useFishingPoints, useFishingSummary } from './useFishingData';
import { useFavoritePoints } from './useFavoritePoints';
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

const DEFAULT_POINT = '추자도';
const LAST_POINT_KEY = 'fishing:last-point';

export default function FishingPage() {
  const { loggedInUser, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const areas = useFishingAreas();
  const { points, status } = useFishingPoints();
  const { favorites, toggle, isFavorite } = useFavoritePoints({ loggedInUser, showToast });
  const [areaId, setAreaId] = useState(areas[0].id);
  const [chosenPoint, setChosenPoint] = useState(() => searchParams.get('point') || readStoredJson(LAST_POINT_KEY, null) || DEFAULT_POINT);
  // 포인트 고르기 화면은 처음부터 열어 둡니다. (✕로 접고 '바꾸기'로 다시 열기)
  const [pickerOpen, setPickerOpen] = useState(true);
  const [indexModal, setIndexModal] = useState(null); // { pointId, pointName, index?, guide? }

  // 포인트 목록을 못 받으면(예전 서버·키 없음) 예전처럼 해역 3곳으로 동작합니다.
  const pointMode = status !== 'failed';
  const pointId = status === 'ready' && !points.some((point) => point.id === chosenPoint)
    ? (points.find((point) => point.id === DEFAULT_POINT) || points[0]).id : chosenPoint;
  const listed = points.find((point) => point.id === pointId);
  const fallbackArea = areas.find((item) => item.id === areaId) || areas[0];
  const { data, error, loading, reload } = useFishingSummary(pointMode ? { id: `point:${pointId}`, pointId } : fallbackArea);
  const area = pointMode ? {
    id: `point:${pointId}`, pointId, place: listed?.name || pointId,
    lat: listed?.lat ?? data?.coordinates?.lat, lon: listed?.lon ?? data?.coordinates?.lon,
    tide_system: listed?.tide_system ?? data?.tide_system ?? 8,
    region_name: listed?.region_name || data?.region_name || '',
  } : fallbackArea;

  const selectPoint = (id) => {
    setChosenPoint(id);
    writeStoredJson(LAST_POINT_KEY, id);
    setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('point', id); return next; }, { replace: true });
  };

  const sources = data?.sources || {};
  const errors = data?.errors || {};
  const forecastRows = sources.forecast?.records || [];

  return <main className="fishing-page">
    <FishingHero areas={areas} area={area} onAreaChange={setAreaId} loading={loading} onReload={reload}
      pointMode={pointMode} onOpenPicker={() => setPickerOpen((open) => !open)} isFavorite={isFavorite(pointId)} onToggleFavorite={() => toggle(pointId)}
      favoritePoints={favorites} onSelectPoint={selectPoint} data={data} />
    {pointMode && pickerOpen && (status === 'ready'
      ? <PointPicker points={points} selectedId={pointId} favorites={favorites} onSelect={selectPoint} onToggleFavorite={toggle} onClose={() => setPickerOpen(false)} isLoggedIn={Boolean(loggedInUser)}
          onShowIndex={(point) => setIndexModal({ pointId: point.id, pointName: point.name })} />
      : <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>낚시 포인트 목록을 불러오고 있어요</b></div></div>)}

    {error && <div className="fish-error" role="alert"><FiInfo /> {error}<button onClick={reload}>다시 시도</button></div>}
    {loading && !data && <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>해양 기관 자료를 불러오고 있어요</b><span>첫 요청은 서버 준비로 다소 오래 걸릴 수 있습니다.</span></div></div>}

    {data && <WarningBanner warnings={sources.warnings} error={errors.warnings} />}

    <FishingIndexPanel key={area.id} index={sources.fishing_index} error={errors.fishing_index} warnings={sources.warnings?.items || []}
      onShowGuide={() => setIndexModal({ pointId: area.pointId, pointName: area.place, guide: true, index: sources.fishing_index?.days?.length ? sources.fishing_index : undefined })} />

    <ForecastOutlook forecastRows={forecastRows} />

    <section className="fish-metrics">
      <BuoyPanel area={area} buoyRows={sources.buoy?.records || []} error={errors.buoy} />
      <TidePanel area={area} tideSource={sources.tide} error={errors.tide} />
    </section>

    <section className="fish-metrics">
      <SunPanel area={area} />
      <GearChecklist area={area} indexDays={sources.fishing_index?.days || []} forecastRows={forecastRows} warnings={sources.warnings?.items || []} />
    </section>

    <MarineForecastPanel regionName={data?.region_name || area.region_name} forecastRows={forecastRows} error={errors.forecast} />
    <details className="fish-source-details"><summary><FiInfo /> 자료 범위와 기준</summary><p>해상예보는 선택 해역 단위이며 개별 포인트의 예보가 아닙니다. 부이는 위치와 거리를 함께 표시한 참고 관측이고, TideBED 조위는 응답에 포함된 인근 기준 관측소의 예측입니다. 각 기관 자료의 발표·관측 시각을 확인해 최신성도 살펴보세요.</p></details>
    {indexModal && <FishingIndexModal key={indexModal.pointId || 'guide'} pointId={indexModal.pointId} pointName={indexModal.pointName} initialIndex={indexModal.index} openGuide={Boolean(indexModal.guide)} onClose={() => setIndexModal(null)} />}
    <p className="fish-disclaimer"><FiInfo /> {data?.notice || '기관 예보와 관측을 참고용으로 제공합니다. 출조 전 기상특보와 현장 상황을 별도로 확인하세요.'}</p>
  </main>;
}
