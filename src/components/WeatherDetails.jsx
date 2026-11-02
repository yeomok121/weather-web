import React, { useState, useEffect } from 'react';

function WeatherDetails({ airQuality = {}, current = {}, isMountainMode = false, mountainInfo = null }) {
  const sunrise = current.sunrise || '06:00';
  const sunset = current.sunset || '18:00';
  const safeDescentTime = current.safeDescentTime || mountainInfo?.safe_descent_time || '15:30';
  const [celestial, setCelestial] = useState({ position: 50, icon: '☀️', isNight: false });

  const temp = current.temp !== undefined ? Number(current.temp) : 20;
  const humidity = current.humidity !== undefined ? Number(current.humidity) : 50;
  const pm25 = airQuality.pm25 !== undefined ? Number(airQuality.pm25) : 15;
  const wind = current.wind_speed !== undefined ? Number(current.wind_speed) : 2;
  const desc = current.description || '맑음';
  const terrain = mountainInfo?.terrain || '';
  const isFuture = current.isFuture || false;

  // 💡 강수 판단 (미래 날짜일 경우 targetPop 확률이 60% 이상이면 비/눈으로 간주)
  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || (current.targetPop >= 60);
  const isSnow = desc.includes('눈');

  // 일반 도시 옷차림 추천
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

  // 산악 전용 등산 레이어링 추천
  const getHikingGearRecommendation = () => {
    let layering = '';
    if (temp >= 22) layering = '👕 흡습속건 기능성 반팔 + 얇은 방풍 재킷';
    else if (temp >= 14) layering = '🧥 기능성 긴팔 베이스 + 바람막이(방풍) 재킷';
    else if (temp >= 6) layering = '🧥 기능성 내의 + 플리스(미드레이어) + 방풍 재킷';
    else if (temp >= 0) layering = '🧣 동계 베이스 + 경량패딩 + 고어텍스 방풍 재킷';
    else layering = '🧣 헤비 다운패딩 + 방풍 자켓 + 넥워머·방한모·장갑';

    const gears = ['🦯 등산 스틱'];
    if (temp <= 2 || isSnow) gears.push('⛓️ 아이젠 필수');
    else if (isRainOrSnow) gears.push('☔ 판초우의·스패츠');
    else if (terrain.includes('암릉') || terrain.includes('바위')) gears.push('🧤 반장갑·릿지화');
    else gears.push('🔦 헤드랜턴');

    return `${layering} (${gears.join(' · ')})`;
  };

  // 일반 도시 생활 지수
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
    else if (pm25 >= 36) badges.push({ text: '🌫️ 세차 비추천 (미세먼지)', color: '#f97316' });
    else if (temp <= -2) badges.push({ text: '🧊 세차 주의 (결빙 우려)', color: '#eab308' });
    else badges.push({ text: '✨ 세차하기 좋은 날', color: '#3b82f6' });

    if (isRainOrSnow || humidity >= 80) badges.push({ text: '👕 실내 건조·제습기 권장', color: '#64748b' });
    else if (humidity <= 55 && desc.includes('맑음') && pm25 < 36) badges.push({ text: '☀️ 빨래 바짝 마르는 날', color: '#0ea5e9' });
    else badges.push({ text: '🧺 빨래 건조 무난함', color: '#10b981' });

    if (isRainOrSnow) badges.push({ text: '☔ 외출 시 우산 필수!', color: '#2563eb' });
    else if (pm25 >= 36) badges.push({ text: '🪟 환기 자제·마스크 착용', color: '#ef4444' });
    else if (!celestial.isNight && desc.includes('맑음') && temp >= 23) badges.push({ text: '🕶️ 자외선 차단제 권장', color: '#f59e0b' });
    else if (humidity <= 35) badges.push({ text: '💧 건조 주의·수분 섭취', color: '#0284c7' });
    else badges.push({ text: '🍃 창문 열고 환기하기 좋음', color: '#14b8a6' });

    return badges;
  };

  // 산악 전용 4대 등산 지수
  const getMountainIndices = () => {
    const badges = [];

    if (isRainOrSnow) badges.push({ text: '🌫️ 시야 불량 (곰탕 주의)', color: '#64748b' });
    else if (temp <= -2 && humidity >= 75) badges.push({ text: '❄️ 눈꽃·상고대 절경 기대', color: '#0ea5e9' });
    else if (humidity >= 80 && wind <= 3.5) badges.push({ text: '🌊 운해(구름바다) 확률 높음', color: '#8b5cf6' });
    else if (humidity >= 85) badges.push({ text: '🌫️ 산안개(곰탕) 시야 주의', color: '#f97316' });
    else if (pm25 <= 25 && desc.includes('맑음')) badges.push({ text: '🔭 쾌청! 탁 트인 정상 뻥뷰', color: '#0ea5e9' });
    else badges.push({ text: '🏞️ 조망 양호·산행 무난', color: '#10b981' });

    if (temp <= 2 && (isRainOrSnow || humidity >= 70)) badges.push({ text: '🧊 결빙·블랙아이스 주의', color: '#dc2626' });
    else if (isRainOrSnow) badges.push({ text: '⚠️ 젖은 바위·진흙 미끄럼', color: '#ea580c' });
    else if (temp <= 0) badges.push({ text: '❄️ 그늘 구간 서리·결빙', color: '#2563eb' });
    else if (terrain.includes('암릉') || terrain.includes('바위')) badges.push({ text: '🪨 암릉 구간 접지력 주의', color: '#d97706' });
    else badges.push({ text: '🥾 노면 건조·보행 쾌적', color: '#16a34a' });

    if (wind >= 10) badges.push({ text: '🌪️ 강풍 특보 (체류 자제)', color: '#dc2626' });
    else if (wind >= 6) badges.push({ text: '💨 능선 칼바람 (방풍 필수)', color: '#ea580c' });
    else if (temp <= 3) badges.push({ text: '🥶 정상 한기 (보온병 지참)', color: '#0284c7' });
    else badges.push({ text: '🍃 능선 바람 잔잔·쾌적', color: '#0d9488' });

    if (isRainOrSnow || wind >= 10) badges.push({ text: '🚫 악천후 입산 자제 권장', color: '#dc2626' });
    else if (celestial.isNight && !isFuture) badges.push({ text: '🔦 야간 산행 주의 (랜턴)', color: '#475569' });
    else if (temp <= -5 || wind >= 7 || pm25 >= 55) badges.push({ text: '⚠️ 초보자 주의·방한 철저', color: '#d97706' });
    else badges.push({ text: '🧗 등산 가기 완벽한 날씨!', color: '#15803d' });

    return badges;
  };

  const mainRecommendation = isMountainMode ? getHikingGearRecommendation() : getClothingRecommendation();
  const activeBadges = isMountainMode ? getMountainIndices() : getLifeIndices();

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
        const pos = Math.min(95, Math.max(5, (passedDaylight / totalDaylight) * 100));
        return { position: pos, icon: '☀️', isNight: false };
      } else {
        const totalNight = Math.max(1, (24 * 60 - setMin) + riseMin);
        const passedNight = currentMinutes > setMin
          ? currentMinutes - setMin
          : (24 * 60 - setMin) + currentMinutes;
        const pos = Math.min(95, Math.max(5, (passedNight / totalNight) * 100));
        return { position: pos, icon: '🌙', isNight: true };
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
        {isMountainMode ? '⛰️ 4대 산행 환경 지수' : '상세 날씨 정보'}
      </h3>

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

      <div style={{ marginTop: '20px', marginBottom: isMountainMode ? '16px' : '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
          {celestial.isNight ? (
            <>
              <span>🌇 일몰 {sunset}</span>
              <span>🌅 내일 일출 {sunrise}</span>
            </>
          ) : (
            <>
              <span>🌅 일출 {sunrise}</span>
              <span>🌇 일몰 {sunset}</span>
            </>
          )}
        </div>
        <div style={{ position: 'relative', height: '45px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
          <svg width="100%" height="45" viewBox="0 0 180 45" preserveAspectRatio="none">
            <path d="M 10 5 Q 90 65 170 5" fill="none" stroke={celestial.isNight ? "#94a3b8" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <span style={{ 
            position: 'absolute', 
            bottom: '6px', 
            left: `calc(${celestial.position}% - 12px)`, 
            fontSize: '16px', 
            background: celestial.isNight ? '#1e293b' : '#ffffff', 
            borderRadius: '50%', 
            padding: '4px', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)', 
            lineHeight: 1, 
            transition: 'left 0.8s ease-in-out' 
          }}>
            {celestial.icon}
          </span>
        </div>

        {isMountainMode && (
          <div style={{ marginTop: '6px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
            🚨 안전 하산 마감 권장: {safeDescentTime} 이전
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
        <span>{isMountainMode ? '예상 정상 습도:' : '습도:'} <strong>{humidity}%</strong></span>
        <span>{isMountainMode ? '예상 능선 풍속:' : '풍속:'} <strong>{wind} m/s</strong></span>
      </div>

      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: isMountainMode ? '#166534' : '#64748b' }}>
          {isMountainMode ? '🎒 예상 기온 기반 레이어링' : '생활 지수 추천'}
        </h4>
        
        <div style={{ background: isMountainMode ? '#f0fdf4' : '#f8fafc', border: isMountainMode ? '1px solid #bbf7d0' : 'none', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: '1.45', wordBreak: 'keep-all' }}>
          <span style={{ fontWeight: 'bold' }}>{mainRecommendation}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {activeBadges.map((badge, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: `${badge.color}12`, 
                border: `1px solid ${badge.color}30`, 
                color: badge.color, 
                padding: '9px 6px', 
                borderRadius: '8px', 
                fontSize: '11.5px', 
                fontWeight: 'bold', 
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                wordBreak: 'keep-all'
              }}
            >
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeatherDetails;