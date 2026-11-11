// 낚시 페이지 ( /fishing )
//   fishingApi.js      서버 요청          useFishingData.js  해역 목록·바다 정보 상태
//   fishingFormat.js   화면용 값 변환      components/        화면 영역별 컴포넌트
//   FishingPage.css    낚시 페이지 전용 스타일
// 물때 계산은 lib/tideCalendar.js 에 있습니다.
// 새 영역(예: 기상특보, 바다낚시지수)은 components/에 만들고 아래 순서에 끼워 넣으면 됩니다.
import { useState } from 'react';
import { FiClock, FiInfo, FiRefreshCw } from 'react-icons/fi';
import './FishingPage.css';
import { useFishingAreas, useFishingSummary } from './useFishingData';
import FishingHero from './components/FishingHero';
import ForecastOutlook from './components/ForecastOutlook';
import BuoyPanel from './components/BuoyPanel';
import TidePanel from './components/TidePanel';
import MarineForecastPanel from './components/MarineForecastPanel';

export default function FishingPage() {
  const areas = useFishingAreas();
  const [areaId, setAreaId] = useState(areas[0].id);
  const area = areas.find((item) => item.id === areaId) || areas[0];
  const { data, error, loading, reload } = useFishingSummary(area);

  const sources = data?.sources || {};
  const errors = data?.errors || {};
  const forecastRows = sources.forecast?.records || [];

  return <main className="fishing-page">
    <FishingHero areas={areas} area={area} onAreaChange={setAreaId} loading={loading} onReload={reload} />

    {error && <div className="fish-error" role="alert"><FiInfo /> {error}<button onClick={reload}>다시 시도</button></div>}
    {loading && !data && <div className="fish-loading" role="status"><FiRefreshCw className="fish-spin" /><div><b>해양 기관 자료를 불러오고 있어요</b><span>첫 요청은 서버 준비로 다소 오래 걸릴 수 있습니다.</span></div></div>}
    <div className="fish-data-meta"><FiClock /> 자료 조회 시각 {data?.updated_at || '확인 전'} <span>· 예보 발표·관측 시각은 각 항목에 표시</span></div>

    <ForecastOutlook forecastRows={forecastRows} />

    <section className="fish-metrics">
      <BuoyPanel area={area} buoyRows={sources.buoy?.records || []} error={errors.buoy} />
      <TidePanel area={area} tideSource={sources.tide} error={errors.tide} />
    </section>

    <MarineForecastPanel regionName={data?.region_name || area.region_name} forecastRows={forecastRows} error={errors.forecast} />
    <details className="fish-source-details"><summary><FiInfo /> 자료 범위와 기준</summary><p>해상예보는 선택 해역 단위이며 개별 포인트의 예보가 아닙니다. 부이는 위치와 거리를 함께 표시한 참고 관측이고, TideBED 조위는 응답에 포함된 인근 기준 관측소의 예측입니다. 각 기관 자료의 발표·관측 시각을 확인해 최신성도 살펴보세요.</p></details>
    <p className="fish-disclaimer"><FiInfo /> {data?.notice || '기관 예보와 관측을 참고용으로 제공합니다. 출조 전 기상특보와 현장 상황을 별도로 확인하세요.'}</p>
  </main>;
}
