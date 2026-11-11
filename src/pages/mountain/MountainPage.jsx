// 산악 페이지 ( /mountain, /mountain/:산이름 )
// 공통 화면 구성(ForecastLayout)에 산악 전용 영역을 더합니다.
import { useApp } from '../../shared/AppContext';
import ForecastLayout from '../../shared/forecast/ForecastLayout';
import ManualCourseForm from './components/ManualCourseForm';
import MountainWeatherPanel from './components/MountainWeatherPanel';

export default function MountainPage() {
  const {
    isMountainMode, mountainInfo, effectiveMountainInfo, activeWeather, hourlyData, connectionState,
    manualCourse, saveManualCourse, setSelectedCourseIdx, mountainsList, mountainCatalogState, retryMountainCatalog,
  } = useApp();

  const extras = (
    <>
      {isMountainMode && mountainInfo?.course_available === false && activeWeather.hasData && <ManualCourseForm key={`${mountainInfo.name}:${manualCourse?.name || ""}`} mountain={mountainInfo.name} course={manualCourse} onApply={course => { saveManualCourse(mountainInfo.name, course); setSelectedCourseIdx(0); }} />}
      {isMountainMode && effectiveMountainInfo?.course_available === false && activeWeather.hasData && <MountainWeatherPanel key={mountainInfo.name} mountainInfo={mountainInfo} weatherData={activeWeather} hourlyData={hourlyData} isStale={connectionState.phase !== 'success'} />}
      {isMountainMode && mountainCatalogState === 'limited' && <div className="glass-card weather-empty" role="status">현재 {mountainsList.length}개 산을 표시합니다. 공공데이터 연결이 지연되면 약 1분 뒤 다시 불러와 주세요. <button type="button" onClick={retryMountainCatalog}>산 목록 다시 불러오기</button></div>}
    </>
  );

  return <ForecastLayout extras={extras} />;
}
