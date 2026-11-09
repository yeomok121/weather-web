import React, { useState } from 'react';

function WeatherOutlook({
  weeklyData = [],
  aiBriefing = '',
  isMountainMode = false,
  mountainInfo = null,
  weatherData = {},
  hikingPlanSummary = null
}) {
  const [activeTab, setActiveTab] = useState('weekly');

  if (!weeklyData || weeklyData.length === 0) {
    return null; 
  }

  const startDate = weeklyData[0].date.replace('/', '.');
  const endDate = weeklyData[weeklyData.length - 1].date.replace('/', '.');
  
  const allMaxTemps = weeklyData.map(d => d.temp_max);
  const allMinTemps = weeklyData.map(d => d.temp_min);
  const minTemp = Math.min(...allMinTemps);
  const maxTemp = Math.max(...allMaxTemps);
  const possibleRainDays = weeklyData.filter(d => Number(d.pop) > 0);
  const highRainDays = possibleRainDays.filter(d => Number(d.pop) >= 60);
  const hasRainProbabilityData = weeklyData.some(d => d.pop !== null && d.pop !== undefined && Number.isFinite(Number(d.pop)));
  const rainDayLabels = (days) => days.map(d => `${d.date || '날짜 미상'}${d.day ? `(${d.day})` : ''} ${Math.round(Number(d.pop))}%`).join(', ');
  
  const temperatureSummary = `표시 기간 ${startDate}~${endDate} 기온 범위는 ${minTemp}~${maxTemp}°C입니다.`;
  const rainSummary = highRainDays.length > 0
    ? `강수확률 60% 이상 날짜: ${rainDayLabels(highRainDays)}. 해당 날짜에는 시간별 예보를 확인하고 우산을 고려하세요.`
    : possibleRainDays.length > 0
      ? `강수확률이 표시된 날짜: ${rainDayLabels(possibleRainDays)}. 외출 전 해당 날짜의 시간별 예보를 확인하세요.`
      : hasRainProbabilityData
        ? '표시된 기간의 강수확률은 모두 0%입니다. 예보는 갱신될 수 있으니 외출 전 다시 확인하세요.'
        : '표시된 기간에 강수확률 자료가 없습니다. 예보 제공 범위를 확인하세요.';
  const briefingText = `${temperatureSummary} ${isMountainMode ? '산악 기온은 평지 예보를 고도 보정한 참고 추정값입니다. ' : ''}${rainSummary}`;

  return (
    <div className="glass-card" style={{ borderRadius: '16px', padding: '24px', color: '#1e293b', width: '100%', boxSizing: 'border-box', height: 'fit-content', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '800', color: isMountainMode ? '#166534' : '#1e293b' }}>
        {isMountainMode ? '⛰️ 산악 기상 전망 & AI 의사결정 가이드' : '날씨 전망'}
      </h3>
      
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: 'rgba(255,255,255,0.4)' }}>
        <button onClick={() => setActiveTab('weekly')} style={{ flex: 1, padding: '10px 0', background: activeTab === 'weekly' ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none', borderRight: '1px solid rgba(0,0,0,0.08)', fontWeight: activeTab === 'weekly' ? 'bold' : '600', cursor: 'pointer', color: activeTab === 'weekly' ? (isMountainMode ? '#15803d' : '#0f172a') : '#64748b', transition: 'all 0.2s ease' }}>
          {isMountainMode ? '산간 종합 전망' : '주간 종합 전망'}
        </button>
        <button onClick={() => setActiveTab('ai')} style={{ flex: 1, padding: '10px 0', background: activeTab === 'ai' ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none', fontWeight: activeTab === 'ai' ? 'bold' : '600', cursor: 'pointer', color: activeTab === 'ai' ? (isMountainMode ? '#15803d' : '#0f172a') : '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>
          {isMountainMode ? '🧗 AI 산행 의사결정 리포트' : '🤖 AI 브리핑'}
        </button>
      </div>

      <div style={{ flexGrow: 1 }}>
        {activeTab === 'weekly' ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span style={{ border: isMountainMode ? '1px solid rgba(22,163,74,0.4)' : '1px solid rgba(37,99,235,0.4)', color: isMountainMode ? '#16a34a' : '#2563eb', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', backgroundColor: isMountainMode ? 'rgba(240,253,244,0.6)' : 'rgba(239,246,255,0.6)' }}>이번 주</span>
            </div>
            <div style={{ borderLeft: isMountainMode ? '3px solid #bbf7d0' : '3px solid #cbd5e1', paddingLeft: '14px', marginBottom: '14px', fontSize: '13.5px', lineHeight: '1.6', color: '#1e293b', fontWeight: '500' }}>
              <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', width: '64px', fontWeight: '600' }}>기간</span> <span>{startDate}. ~ {endDate}.</span></div>
              <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ color: '#64748b', width: '64px', fontWeight: '600' }}>{isMountainMode ? '정상기온' : '예상기온'}</span> <span>최저 {minTemp}℃ / 최고 {maxTemp}℃</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '64px', fontWeight: '600' }}>강수 안내</span> <span>{highRainDays.length > 0 ? `${highRainDays.length}일 강수확률 60% 이상` : possibleRainDays.length > 0 ? `${possibleRainDays.length}일 강수확률 표시` : hasRainProbabilityData ? '예보상 강수확률 0%' : '강수확률 자료 없음'}</span></div>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.55', color: '#334155', wordBreak: 'keep-all', fontWeight: '500' }}>
              {briefingText}
            </p>
            <div style={{ marginTop: '10px', fontSize: '10.5px', color: '#64748b' }}>
              {isMountainMode ? '주간 예보 기반 고도 보정 참고치' : '주간 예보: OpenWeather 5일 예보를 날짜별 요약'} · 강수확률은 강수 발생 가능성이며 확정 예보가 아닙니다.
            </div>
          </>
        ) : isMountainMode && hikingPlanSummary ? (
          /* 💡 [원칙 4] 실제 날씨·코스·시간·준비물 데이터에 근거한 AI 산행 의사결정 종합 리포트 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ border: '1px solid rgba(5,150,105,0.4)', color: '#059669', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(209,250,229,0.6)' }}>
                ✨ {weatherData?.region} ({mountainInfo?.peak}) 맞춤 의사결정 리포트
              </span>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>
                {weatherData?.date} 기준
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px', backgroundColor: 'rgba(255,255,255,0.65)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>기상 적합도 (날씨)</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: hikingPlanSummary.weatherScore >= 85 ? '#166534' : hikingPlanSummary.weatherScore >= 70 ? '#d97706' : '#dc2626', marginTop: '2px' }}>
                  {hikingPlanSummary.weatherScore === null ? '점수 계산 보류' : `${hikingPlanSummary.weatherScore}점`} · {hikingPlanSummary.weatherAssessmentStatus || '기상 조건 참고 판단'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>시간 안전 판정</div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: hikingPlanSummary.timeSafetyColor, marginTop: '2px', wordBreak: 'keep-all' }}>
                  {hikingPlanSummary.timeSafetyStatus}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>선택 코스 ({hikingPlanSummary.paceObj.label})</div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {hikingPlanSummary.course.name.split(' ')[0]} ({Math.floor(hikingPlanSummary.totalMins / 60)}시간 {hikingPlanSummary.totalMins % 60}분)
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>출발 → 정상 → 하산</div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>
                  {hikingPlanSummary.departureTimeStr} → {hikingPlanSummary.summitArrivalTimeStr} → {hikingPlanSummary.descentFinishTimeStr}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.55)', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', lineHeight: '1.5' }}>
              <div><strong>⛰️ 정상 도착 시점({hikingPlanSummary.summitArrivalTimeStr}) 예보:</strong>{' '}
                {hikingPlanSummary.summitForecast?.available
                  ? `${hikingPlanSummary.summitForecast.targetHourLabel} 기준 기온 ${hikingPlanSummary.summitForecast.temp}°C (체감 ${hikingPlanSummary.summitForecast.feelsLike}°C), ${hikingPlanSummary.summitForecast.description}, 강수확률 ${hikingPlanSummary.summitForecast.pop}%`
                  : hikingPlanSummary.summitForecast?.reason}
              </div>
              <div style={{ marginTop: '4px' }}>
                <strong>🚨 권장 하산 시작:</strong> {weatherData?.isFuture
                  ? '선택한 날짜의 일몰 정보가 없어 날짜별 일몰 시각과 탐방로 운영시간을 확인해야 합니다.'
                  : <>정상에서 {hikingPlanSummary.safeDescentStartTime} 이전 하산을 시작하도록 늦어도 <strong>{hikingPlanSummary.recommendedDepDeadlineStr}</strong> 출발 권장. 예상 하산 완료는 {hikingPlanSummary.descentFinishTimeStr}입니다.</>}
              </div>
              <div style={{ marginTop: '4px', color: hikingPlanSummary.timeSafetyColor }}>
                <strong>⏱️ 일정 판단:</strong> {hikingPlanSummary.timeSafetyStatus} (정상 도착 예상 {hikingPlanSummary.descentStartTimeStr})
              </div>
              {hikingPlanSummary.weatherAssessmentReasons?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <strong>🌦️ 기상 판단 근거:</strong> {hikingPlanSummary.weatherAssessmentReasons.join(' · ')}
                </div>
              )}
              {hikingPlanSummary.gearList?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <strong>🎒 핵심 준비물:</strong> {hikingPlanSummary.gearList.slice(0, 5).join(', ')}
                </div>
              )}
            </div>

            <div style={{ borderLeft: '3px solid #059669', paddingLeft: '12px', color: '#334155', lineHeight: '1.6', wordBreak: 'keep-all', fontWeight: '500' }}>
              {weatherData?.isFuture || hikingPlanSummary?.isNextDayPlan
                ? '선택한 날짜의 주간 예보 또는 다음 날 출발 일정입니다. 현재 날씨에 대한 AI 분석은 해당 일정의 산행 브리핑으로 표시하지 않습니다.'
                : <><div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', marginBottom: '3px' }}>현재 산악 기상 AI 브리핑 · 코스 일정 계산과 별도</div>{aiBriefing}</>}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: '1.45' }}>※ 기상 점수와 일정 계산은 제공된 예보 및 입력된 코스 소요시간을 바탕으로 한 참고 정보입니다. 정상 도착 시각은 코스 시간 비율로 추정하며, 실제 탐방로 통제·현장 노면·체력 상태는 별도로 확인하세요.</div>
          </div>
        ) : (
          <div style={{ padding: '2px 0', color: '#334155', fontSize: '13.5px', lineHeight: '1.65', wordBreak: 'keep-all', fontWeight: '500' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span style={{ border: isMountainMode ? '1px solid rgba(5,150,105,0.4)' : '1px solid rgba(139,92,246,0.4)', color: isMountainMode ? '#059669' : '#7c3aed', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: isMountainMode ? 'rgba(209,250,229,0.6)' : 'rgba(237,233,254,0.6)' }}>
                ✨ Gemini AI {isMountainMode ? '산악 분석' : ''}
              </span>
            </div>
            <p style={{ margin: 0 }}>
              {aiBriefing}
            </p>
            <div style={{ marginTop: '10px', fontSize: '10.5px', color: '#64748b', lineHeight: 1.45 }}>
              AI가 예보 자료를 요약한 참고 안내입니다. 수치 예보와 공식 특보·통제 정보를 우선 확인하세요.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherOutlook;
