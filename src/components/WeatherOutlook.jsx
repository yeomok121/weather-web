import React, { useState } from 'react';

function WeatherOutlook({ weeklyData = [], aiBriefing = '' }) {
  const [activeTab, setActiveTab] = useState('weekly');

  if (!weeklyData || weeklyData.length === 0) {
    return null; 
  }

  const startDate = weeklyData[0].date.replace('/', '.');
  const endDate = weeklyData[weeklyData.length - 1].date.replace('/', '.');
  
  const allMaxTemps = weeklyData.map(d => d.temp_max);
  const allMinTemps = weeklyData.map(d => d.temp_min);
  const avgMax = Math.round(allMaxTemps.reduce((a, b) => a + b, 0) / allMaxTemps.length);
  const avgMin = Math.round(allMinTemps.reduce((a, b) => a + b, 0) / allMinTemps.length);
  const rainyDays = weeklyData.filter(d => d.pop > 30).length;
  
  let briefingText = `이번 주는 평년과 비슷하거나 조금 높은 기온(최저 ${Math.min(...allMinTemps)}℃ ~ 최고 ${Math.max(...allMaxTemps)}℃) 분포를 보이겠습니다. `;
  if (rainyDays > 2) {
    briefingText += `저기압의 영향을 자주 받아 흐리거나 비(☔)가 오는 날이 많겠습니다. 우산을 꼭 챙기시길 바랍니다.`;
  } else if (rainyDays > 0) {
    briefingText += `이동성 고기압의 영향을 주로 받겠으나, 일시적인 기압골의 영향으로 비가 오는 날이 있겠습니다.`;
  } else {
    briefingText += `고기압의 영향으로 대체로 맑고(☀️) 건조한 날이 지속되겠습니다. 야외 활동하기 좋은 한 주가 될 것으로 예상됩니다.`;
  }

  return (
    /* 💡 패딩을 24px -> 20px로 줄이고 내부 여백을 콤팩트하게 조정 */
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#333', width: '100%', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>날씨 전망</h3>
      
      <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <button onClick={() => setActiveTab('weekly')} style={{ flex: 1, padding: '8px 0', background: activeTab === 'weekly' ? '#ffffff' : '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', fontWeight: activeTab === 'weekly' ? 'bold' : 'normal', cursor: 'pointer', color: activeTab === 'weekly' ? '#0f172a' : '#64748b' }}>
          주간 종합 전망
        </button>
        <button onClick={() => setActiveTab('ai')} style={{ flex: 1, padding: '8px 0', background: activeTab === 'ai' ? '#ffffff' : '#f8fafc', border: 'none', fontWeight: activeTab === 'ai' ? 'bold' : 'normal', cursor: 'pointer', color: activeTab === 'ai' ? '#0f172a' : '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
          🤖 AI 브리핑
        </button>
      </div>

      <div style={{ flexGrow: 1 }}>
        {activeTab === 'weekly' ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <span style={{ border: '1px solid #3182ce', color: '#3182ce', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>이번 주</span>
            </div>
            <div style={{ borderLeft: '3px solid #cbd5e1', paddingLeft: '12px', marginBottom: '12px', fontSize: '13.5px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '60px' }}>기간</span> <span>{startDate}. ~ {endDate}.</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '60px' }}>예상기온</span> <span>최저 {avgMin}℃ / 최고 {avgMax}℃</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: '#64748b', width: '60px' }}>강수경향</span> <span>{rainyDays > 0 ? '비 오는 날 있음' : '대체로 맑음'}</span></div>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.5', color: '#334155', wordBreak: 'keep-all' }}>
              {briefingText}
            </p>
          </>
        ) : (
          <div style={{ padding: '2px 0', color: '#334155', fontSize: '13.5px', lineHeight: '1.65', wordBreak: 'keep-all' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <span style={{ border: '1px solid #8b5cf6', color: '#8b5cf6', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✨ Gemini AI
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