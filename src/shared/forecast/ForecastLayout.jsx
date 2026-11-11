// 공통: 날씨 페이지와 산악 페이지가 함께 쓰는 2단 화면 구성
//   왼쪽: 현재 날씨, (페이지별 추가 영역), 시간별 예보, 날씨 전망
//   오른쪽: 로그인, 상세 날씨, 주간 예보
// extras: 페이지마다 현재 날씨 카드 아래에 추가로 보여줄 내용 (예: 산악 페이지의 직접 입력 코스)
import { useApp } from '../AppContext';
import LoginCard from '../auth/LoginCard';
import WeatherMain from './WeatherMain';
import HourlyForecast from './HourlyForecast';
import WeatherOutlook from './WeatherOutlook';
import WeatherDetails from './WeatherDetails';
import WeeklyForecast from './WeeklyForecast';

export default function ForecastLayout({ extras = null }) {
  const {
    activeWeather, aiBriefing, aiMessage, connectionState, departureOffsetHours, effectiveMountainInfo,
    forecastError, handleApplyHikingPlan, handleCurrentLocation, handleDeleteAccount, handleFavoriteClick, handleLogin,
    handleLogout, handleOpenAddRegion, handleRemoveFavorite, handleToggleMountainMode, handleUpdateUser, hikingPlanSummary,
    hourlyData, isAiLoading, isMountainMode, lastWeatherRequestRef, loadMountainWeather, loadWeather,
    loggedInUser, loginPrompt, mountainInfo, mountainsList, paceType, promptLogin,
    restoredDepartureAt, selectedCourseIdx, selectedDateIdx, setCustomGearList, setDepartureOffsetHours, setIsFindPasswordOpen,
    setIsSignUpOpen, setPaceType, setPlanReferenceAt, setRestoredDepartureAt, setSelectedCourseIdx, setSelectedDateIdx,
    showToast, weatherData, weatherFetchedAt, weeklyData, favorites,
  } = useApp();

  return (
    <main className={`main-container ${isMountainMode ? 'is-mountain-mode' : ''}`} style={{ flexGrow: 1, maxWidth: '1320px', margin: '0 auto', width: '100%', zIndex: 1, padding: '28px 24px' }}>
      <div className="main-primary-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

        <WeatherMain
          weatherData={activeWeather}
          hourlyData={hourlyData}
          weeklyData={weeklyData}
          selectedDateIdx={selectedDateIdx}
          onSelectDate={(idx) => { setSelectedDateIdx(idx); setRestoredDepartureAt(null); setDepartureOffsetHours(0); setPlanReferenceAt(Date.now()); }}
          isAiLoading={isAiLoading && !weatherData.hasData}
          aiMessage={aiMessage}
          favorites={favorites}
          onAddClick={handleOpenAddRegion}
          onFavoriteClick={handleFavoriteClick}
          onRemoveFavorite={handleRemoveFavorite}
          isLoggedIn={!!loggedInUser}
          onCurrentLocationClick={handleCurrentLocation}
          isMountainMode={isMountainMode}
          onToggleMountainMode={handleToggleMountainMode}
          mountainInfo={mountainInfo}
          mountainsList={mountainsList}
          onSelectMountain={(mName) => loadMountainWeather(mName)}
        />

        {extras}
        <HourlyForecast
          hourlyData={hourlyData}
          isLoading={isAiLoading && !weatherData.hasData}
          error={forecastError}
          onRetry={() => {
            const request = lastWeatherRequestRef.current;
            if (request.kind === 'mountain') loadMountainWeather(request.mountainName);
            else loadWeather(request.lat, request.lon, request.regionName);
          }}
          isMountainMode={isMountainMode && effectiveMountainInfo?.course_available !== false}
          mountainInfo={effectiveMountainInfo}
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
          onRequireLogin={() => { promptLogin(); document.getElementById('member-login')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); showToast('로그인하면 작성 중인 산행 계획을 이어서 저장할 수 있어요.'); }}
        />


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
    </main>
  );
}
