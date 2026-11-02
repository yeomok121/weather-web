import React, { useState } from 'react';

function WeatherOutlook({ weeklyData = [], aiBriefing = '', isMountainMode = false, mountainInfo = null }) {
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
  const rainyDays = weeklyData.filter(d => d.pop > 30).length;
  
  // 💡 산악 모드와 일반 모드에 따라 브리핑 멘트를 완벽하게 분리
  let briefingText = '';
  if (isMountainMode) {
    const mName = mountainInfo?.name || '산 정상';
    briefingText = `이번 주 ${mName} 능선 및 정상 부근은 고도의 영향으로 평지보다 쌀쌀한 기온(최저 ${minTemp}℃ ~ 최고 ${maxTemp}℃) 분포를 보이겠습니다. `;
    if (rainyDays > 2) {
      briefingText += `강수 예보가 잦아 바위나 등산로가 매우 미끄러울 수 있으니 우천 산행 장비(아이젠, 등산화)를 철저히 준비하시고, 기상 악화 시 무리한 산행을 자제하세요.`;
    } else if (rainyDays > 0) {
      briefingText += `대체로 기상은 양호하나 일시적으로 비나 눈이 내릴 수 있으니, 배낭에 방수 재킷과 배낭 커버를 필히 챙기시기 바랍니다.`;
    } else {
      briefingText += `비 소식 없이 맑은 날이 이어져 산행하기 좋은 주간입니다. 다만 능선부의 강풍과 큰 일교차에 대비해 방풍·보온 의류를 꼭 지참하세요.`;
    }
  } else {
    briefingText = `이번 주는 평년과 비슷하거나 조금 높은 기온(최저 ${minTemp}℃ ~ 최고 ${maxTemp}℃) 분포를 보이겠습니다. `;
    if (rainyDays > 2) {
      briefingText += `저기압의 영향을 자주 받아 흐리거나 비(☔)가 오는 날이 많겠습니다. 우산을 꼭 챙기시길 바랍니다.`;
    } else if (rainyDays > 0) {
      briefingText += `이동성 고기압의 영향을 주로 받겠으나, 일시적인 기압골의 영향으로 비가 오는 날이 있겠습니다.`;
    } else {
      briefingText += `고기압의 영향으로 대체로 맑고(☀️) 건조한 날이 지속되겠습니다. 야외 활동하기 좋은 한 주가 될 것으로 예상됩니다.`;
    }
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#333', width: '100%', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: isMountainMode ? '#166534' : '#1e293b' }}>
        {isMountainMode ? '⛰️ 산악 기상 주간 전망' : '날씨 전망'}
      </h3>
      
      <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <button onClick={() => setActiveTab('weekly')} style={{ flex: 1, padding: '8px 0', background: activeTab === 'weekly' ? '#ffffff' : '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', fontWeight: activeTab === 'weekly' ? 'bold' : 'normal', cursor: 'pointer', color: activeTab === 'weekly' ? (isMountainMode ? '#15803d' : '#0f172a') : '#64748b' }}>
          {isMountainMode ? '산간 종합 전망' : '주간 종합 전망'}
        </button>
        <button onClick={() => setActiveTab('ai')} style={{ flex: 1, padding: '8px 0', background: activeTab === 'ai' ? '#ffffff' : '#f8fafc', border: 'none', fontWeight: activeTab === 'ai' ? 'bold' : 'normal', cursor: 'pointer', color: activeTab === 'ai' ? (isMountainMode ? '#15803d' : '#0f172a') : '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
          {isMountainMode ? '🧗 AI 산악 가이드' : '🤖 AI 브리핑'}
        </button>
      </div>

      <div style={{ flexGrow: 1 }}>
        {activeTab === 'weekly' ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <span style={{ border: isMountainMode ? '1px solid #16a34a' : '1px solid #3182ce', color: isMountainMode ? '#16a34a' : '#3182ce', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>이번 주</span>
            </div>
            <div style={{ borderLeft: isMountainMode ? '3px solid #bbf7d0' : '3px solid #cbd5e1', paddingLeft: '12px', marginBottom: '12px', fontSize: '13.5px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '60px' }}>기간</span> <span>{startDate}. ~ {endDate}.</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '60px' }}>{isMountainMode ? '정상기온' : '예상기온'}</span> <span>최저 {minTemp}℃ / 최고 {maxTemp}℃</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '60px' }}>강수경향</span> <span>{rainyDays > 0 ? '비/눈 오는 날 있음' : '대체로 맑음'}</span></div>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.5', color: '#334155', wordBreak: 'keep-all' }}>
              {briefingText}
            </p>
          </>
        ) : (
          <div style={{ padding: '2px 0', color: '#334155', fontSize: '13.5px', lineHeight: '1.65', wordBreak: 'keep-all' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <span style={{ border: isMountainMode ? '1px solid #059669' : '1px solid #8b5cf6', color: isMountainMode ? '#059669' : '#8b5cf6', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✨ Gemini AI {isMountainMode ? '산악 분석' : ''}
              </span>
            </div>
            <p style={{ margin: 0 }}>
              {aiBriefing}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherOutlook;