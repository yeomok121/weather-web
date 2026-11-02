import React, { useState, useEffect } from 'react';

function WeatherDetails({ airQuality = {}, current = {}, isMountainMode = false, mountainInfo = null }) {
  const sunrise = current.sunrise || '06:00';
  const sunset = current.sunset || '18:00';
  const safeDescentTime = current.safeDescentTime || '15:30';
  const [celestial, setCelestial] = useState({ position: 50, icon: '☀️', isNight: false });

  const temp = current.temp !== undefined ? Number(current.temp) : 20;
  const baseTemp = current.baseTemp !== undefined ? Number(current.baseTemp) : temp + 5;
  const humidity = current.humidity !== undefined ? Number(current.humidity) : 50;
  const pm25 = airQuality.pm25 !== undefined ? Number(airQuality.pm25) : 15;
  const wind = current.wind_speed !== undefined ? Number(current.wind_speed) : 2;
  const desc = current.description || '맑음';
  const terrain = mountainInfo?.terrain || '';

  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박');
  const isSnow = desc.includes('눈');

  // 💡 산악 전용 인터랙티브 상태 (코스 선택, 타임라인 계산, 체크리스트)
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [checklist, setChecklist] = useState({});

  const courses = mountainInfo?.courses || [{ name: '기본 탐방로', distance: '5km', time: 180, diff: '중' }];
  const selectedCourse = courses[selectedCourseIdx] || courses[0];

  useEffect(() => {
    // 산이 바뀔 때마다 체크리스트 초기화
    setChecklist({});
    setSelectedCourseIdx(0);
  }, [mountainInfo?.name]);

  const toggleCheck = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  // 💡 산행 종합 점수 (0~100) 계산 로직
  const getMountainScore = () => {
    let score = 100;
    if (isRainOrSnow) score -= 40;
    if (wind >= 10) score -= 30;
    else if (wind >= 6) score -= 15;
    if (temp <= -10 || temp >= 33) score -= 20;
    else if (temp <= -3 || temp >= 28) score -= 10;
    if (pm25 >= 75) score -= 15;
    else if (pm25 >= 36) score -= 5;
    return Math.max(0, score);
  };
  const score = getMountainScore();

  // 💡 하산 타임라인 계산기 (현재 시각 vs 일몰 시각 기준)
  const getTimelineStatus = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const parseTime = (str) => {
      if (!str || !str.includes(':')) return 1080;
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    };
    
    const sunsetMins = parseTime(sunset);
    const safeDescentMins = parseTime(safeDescentTime); // 일몰 2시간 전
    const requiredMins = selectedCourse.time;
    
    // 이 코스를 완주하려면 늦어도 언제 출발해야 하는지 (입산 마지노선)
    const deadlineMins = safeDescentMins - requiredMins; 
    
    if (currentMins > safeDescentMins) return { status: 'danger', msg: '⚠️ 현재 하산 마감 시간이 지났습니다. 야간 산행(랜턴) 모드입니다.' };
    if (currentMins > deadlineMins) return { status: 'warning', msg: `⚠️ 지금 출발하면 일몰(${sunset}) 후 하산합니다. 랜턴 필수!` };
    return { status: 'safe', msg: `✅ 지금 출발하면 ${safeDescentTime} 전 안전하게 하산 가능합니다.` };
  };
  const timeline = getTimelineStatus();

  // 💡 배낭 체크리스트 아이템 자동 생성
  const getChecklistItems = () => {
    const items = ['등산화 (접지력 확인)', '충분한 식수', '초코바 등 행동식'];
    if (temp <= 2 || isSnow) items.push('아이젠 및 스패츠', '보온병(따뜻한 물)', '방한모 및 넥워머');
    if (temp <= 15 || wind >= 5) items.push('방풍 재킷(바람막이)');
    if (isRainOrSnow) items.push('판초우의 또는 배낭 커버');
    if (terrain.includes('암릉') || terrain.includes('바위')) items.push('반장갑 (바위 짚기 용도)', '릿지화(바위용 등산화)');
    items.push('등산 스틱', '비상용 헤드랜턴');
    return items;
  };
  const gearList = getChecklistItems();

  // 일반 옷차림 로직
  const getClothingRecommendation = () => {
    let base = '';
    if (temp >= 28) base = '👕 민소매, 린넨, 반바지';
    else if (temp >= 23) base = '👕 반팔, 얇은 셔츠, 면바지';
    else if (temp >= 20) base = '👔 얇은 가디건, 긴팔, 청바지';
    else if (temp >= 17) base = '🧥 얇은 니트, 맨투맨, 가디건';
    else if (temp >= 12) base = '🧥 자켓, 기모 맨투맨, 야상';
    else if (temp >= 9) base = '🧥 트렌치코트, 니트, 청바지';
    else if (temp >= 5) base = '🧣 코트, 가죽자켓, 히트텍';
    else base = '🧣 패딩, 두꺼운 코트, 목도리';
    if (isRainOrSnow) return `${base} (☔ 우산·방수 신발)`;
    if (wind >= 7 && temp < 20) return `${base} (💨 바람막이 권장)`;
    return `${base} 추천`;
  };

  const getLifeIndices = () => {
    const badges = [];
    if (isRainOrSnow) badges.push({ text: isSnow ? '🧘 눈길 조심·실내 운동' : '🧘 실내 스트레칭 추천', color: '#6366f1' });
    else if (pm25 >= 50) badges.push({ text: '😷 야외 러닝 자제 (먼지)', color: '#ef4444' });
    else if (wind >= 8) badges.push({ text: '💨 강풍 주의·실내 운동', color: '#f97316' });
    else if (temp >= 31) badges.push({ text: '🥵 무더위 야외 운동 자제', color: '#ef4444' });
    else if (temp <= -3) badges.push({ text: '🥶 한파 주의·실내 운동', color: '#3b82f6' });
    else if (temp >= 27 || temp <= 6) badges.push({ text: '👟 가벼운 산책·조깅 적합', color: '#eab308' });
    else badges.push({ text: '🏃 달리기 완벽한 날씨', color: '#22c55e' });

    if (isRainOrSnow) badges.push({ text: '🚫 세차 비추천 (비/눈)', color: '#ef4444' });
    else if (pm25 >= 36) badges.push({ text: '🌫️ 세차 비추천 (먼지)', color: '#f97316' });
    else badges.push({ text: '✨ 세차하기 좋은 날', color: '#3b82f6' });

    return badges;
  };
  const lifeBadges = getLifeIndices();

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const parseTime = (str, fallbackH) => {
        if (!str || !str.includes(':')) return fallbackH * 60;
        const [h, m] = str.split(':').map(Number);
        return (Number.isFinite(h) ? h : fallbackH) * 60 + (Number.isFinite(m) ? m : 0);
      };
      const riseMin = parseTime(sunrise, 6);
      const setMin = parseTime(sunset, 18);

      if (currentMinutes >= riseMin && currentMinutes <= setMin) {
        const totalDaylight = Math.max(1, setMin - riseMin);
        const passedDaylight = currentMinutes - riseMin;
        return { position: Math.min(95, Math.max(5, (passedDaylight / totalDaylight) * 100)), icon: '☀️', isNight: false };
      } else {
        const totalNight = Math.max(1, (24 * 60 - setMin) + riseMin);
        const passedNight = currentMinutes > setMin ? currentMinutes - setMin : (24 * 60 - setMin) + currentMinutes;
        return { position: Math.min(95, Math.max(5, (passedNight / totalNight) * 100)), icon: '🌙', isNight: true };
      }
    };
    setCelestial(calculatePosition());
    const interval = setInterval(() => setCelestial(calculatePosition()), 60000);
    return () => clearInterval(interval);
  }, [sunrise, sunset]);

  return (
    <div
      className="detail-info-card"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: 'fit-content',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: isMountainMode ? '#166534' : '#1e293b' }}>
        {isMountainMode ? '⛰️ 산악 기상 & 등산 환경 대시보드' : '상세 날씨 정보'}
      </h3>

      {/* 공통: 미세먼지 바 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
          <span style={{ color: '#64748b' }}>미세먼지 (PM2.5)</span>
          <span style={{ fontWeight: 'bold', color: '#334155' }}>
            {airQuality.level || '보통'} ({pm25})
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(to right, #38bdf8, #22c55e, #eab308, #ef4444)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-3px', left: `${Math.min(100, Math.max(0, (pm25 / 100) * 100))}%`, width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', border: '2px solid #0f172a' }} />
        </div>
      </div>

      {/* 공통: 일출/일몰 궤적 */}
      <div style={{ marginTop: '20px', marginBottom: isMountainMode ? '16px' : '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
          {celestial.isNight ? (
            <><span>🌇 일몰 {sunset}</span><span>🌅 내일 일출 {sunrise}</span></>
          ) : (
            <><span>🌅 일출 {sunrise}</span><span>🌇 일몰 {sunset}</span></>
          )}
        </div>
        <div style={{ position: 'relative', height: '45px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
          <svg width="100%" height="45" viewBox="0 0 180 45" preserveAspectRatio="none">
            <path d="M 10 5 Q 90 65 170 5" fill="none" stroke={celestial.isNight ? "#94a3b8" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <span style={{ position: 'absolute', bottom: '6px', left: `calc(${celestial.position}% - 12px)`, fontSize: '16px', background: celestial.isNight ? '#1e293b' : '#ffffff', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', lineHeight: 1, transition: 'left 0.8s ease-in-out' }}>
            {celestial.icon}
          </span>
        </div>
      </div>

      {/* 💡 일반 도시 모드 렌더링 */}
      {!isMountainMode && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <span>습도: <strong>{humidity}%</strong></span>
            <span>풍속: <strong>{wind} m/s</strong></span>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>생활 지수 추천</h4>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: '1.4' }}>
              <span style={{ fontWeight: 'bold' }}>{getClothingRecommendation()}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {lifeBadges.map((badge, idx) => (
                <div key={idx} style={{ background: `${badge.color}12`, border: `1px solid ${badge.color}30`, color: badge.color, padding: '9px 6px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', wordBreak: 'keep-all' }}>
                  {badge.text}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 💡 산악 전용 모드 렌더링 (대시보드 UI) */}
      {isMountainMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '2px dashed #e2e8f0', paddingTop: '16px' }}>
          
          {/* 1. 오늘의 산행 종합 점수 & 3단 고도별 기온 맵 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            {/* 좌측: 종합 점수 */}
            <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', marginBottom: '4px' }}>오늘의 산행 지수</span>
              <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#dcfce7" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 70 ? "#16a34a" : score >= 40 ? "#eab308" : "#dc2626"} strokeWidth="4" strokeDasharray={`${score}, 100`} />
                </svg>
                <span style={{ position: 'absolute', fontSize: '16px', fontWeight: 'bold', color: '#064e3b' }}>{score}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                {score >= 80 ? '아주 쾌적함' : score >= 60 ? '산행 무난함' : score >= 40 ? '주의 필요' : '입산 자제 권장'}
              </span>
            </div>

            {/* 우측: 3단 고도 기온 맵 */}
            <div style={{ flex: 1.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 'bold', color: '#334155' }}>⛰️ 정상 ({mountainInfo?.elevation}m)</span>
                <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{temp}°C (풍속 {wind}m/s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#64748b' }}>🌲 중턱 ({Math.round(mountainInfo?.elevation / 2)}m)</span>
                <span style={{ color: '#475569' }}>{Math.round((temp + baseTemp) / 2)}°C</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ color: '#64748b' }}>👟 들머리 (입구)</span>
                <span style={{ color: '#475569' }}>{baseTemp}°C</span>
              </div>
            </div>
          </div>

          {/* 2. 코스별 타임라인 계산기 */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⏱️ 하산 타임라인 시뮬레이터</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>일몰 {sunset} 기준</span>
            </h4>
            
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }} className="no-scrollbar">
              {courses.map((c, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedCourseIdx(idx)}
                  style={{
                    flexShrink: 0, padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                    border: selectedCourseIdx === idx ? '1px solid #3182ce' : '1px solid #cbd5e1',
                    background: selectedCourseIdx === idx ? '#ebf8ff' : '#f8fafc',
                    color: selectedCourseIdx === idx ? '#2b6cb0' : '#64748b'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#334155', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
              <span>거리: <strong>{selectedCourse.distance}</strong></span>
              <span>예상 소요: <strong>{Math.floor(selectedCourse.time / 60)}시간 {selectedCourse.time % 60}분</strong></span>
              <span>난이도: <strong style={{ color: selectedCourse.diff.includes('상') ? '#dc2626' : '#16a34a' }}>{selectedCourse.diff}</strong></span>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '8px', borderRadius: '6px', 
              backgroundColor: timeline.status === 'safe' ? '#f0fdf4' : timeline.status === 'warning' ? '#fffbeb' : '#fef2f2',
              color: timeline.status === 'safe' ? '#166534' : timeline.status === 'warning' ? '#b45309' : '#991b1b',
              border: `1px solid ${timeline.status === 'safe' ? '#bbf7d0' : timeline.status === 'warning' ? '#fde68a' : '#fecaca'}`
            }}>
              {timeline.msg}
            </div>
          </div>

          {/* 3. 스마트 배낭 체크리스트 */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e293b' }}>🎒 오늘 날씨 맞춤 배낭 체크리스트</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {gearList.map((item, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: checklist[item] ? '#94a3b8' : '#334155', cursor: 'pointer', textDecoration: checklist[item] ? 'line-through' : 'none' }}>
                  <input type="checkbox" checked={!!checklist[item]} onChange={() => toggleCheck(item)} style={{ cursor: 'pointer', accentColor: '#16a34a' }} />
                  {item}
                </label>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default WeatherDetails;