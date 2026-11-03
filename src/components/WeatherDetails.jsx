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

  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || (current.targetPop >= 60);
  const isSnow = desc.includes('눈');

  const getClothingRecommendation = () => {
    let base = '';
    if (temp >= 28) base = '👕 민소매, 반바지';
    else if (temp >= 23) base = '👕 반팔, 얇은 셔츠';
    else if (temp >= 20) base = '👔 긴팔, 청바지';
    else if (temp >= 17) base = '🧥 얇은 가디건';
    else if (temp >= 12) base = '🧥 자켓, 야상';
    else if (temp >= 9) base = '🧥 트렌치코트, 니트';
    else if (temp >= 5) base = '🧣 코트, 히트텍';
    else base = '🧣 패딩, 두꺼운 코트';

    if (isRainOrSnow) return `${base} (☔ 우산)`;
    if (wind >= 7 && temp < 20) return `${base} (💨 바람막이)`;
    return `${base} 추천`;
  };

  const getHikingGearRecommendation = () => {
    let layering = '';
    if (temp >= 22) layering = '👕 반팔 + 얇은 방풍 재킷';
    else if (temp >= 14) layering = '🧥 긴팔 베이스 + 바람막이';
    else if (temp >= 6) layering = '🧥 내의 + 플리스 + 방풍 재킷';
    else if (temp >= 0) layering = '🧣 경량패딩 + 고어텍스 재킷';
    else layering = '🧣 헤비 다운패딩 + 넥워머·장갑';

    const gears = ['🦯 스틱'];
    if (temp <= 2 || isSnow) gears.push('⛓️ 아이젠');
    else if (isRainOrSnow) gears.push('☔ 판초우의');
    else if (terrain.includes('암릉') || terrain.includes('바위')) gears.push('🧤 릿지화');
    else gears.push('🔦 랜턴');

    return `${layering} (${gears.join('·')})`;
  };

  const getLifeIndices = () => {
    const badges = [];
    if (isRainOrSnow) badges.push({ text: isSnow ? '눈길 실내 운동' : '실내 스트레칭', color: '#6366f1' });
    else if (pm25 >= 50) badges.push({ text: '러닝 자제 (먼지)', color: '#ef4444' });
    else if (wind >= 8) badges.push({ text: '강풍 실내 운동', color: '#c2410c' });
    else if (temp >= 31) badges.push({ text: '무더위 운동 자제', color: '#ef4444' });
    else if (temp <= -3) badges.push({ text: '한파 실내 운동', color: '#3b82f6' });
    else if (temp >= 27 || temp <= 6) badges.push({ text: '가벼운 산책 적합', color: '#b45309' }); 
    else badges.push({ text: '달리기 완벽한 날씨', color: '#22c55e' });

    if (isRainOrSnow) badges.push({ text: '세차 비추천', color: '#ef4444' });
    else if (pm25 >= 36) badges.push({ text: '세차 보류 (먼지)', color: '#c2410c' });
    else if (temp <= -2) badges.push({ text: '세차 주의 (결빙)', color: '#b45309' }); 
    else badges.push({ text: '세차하기 좋은 날', color: '#3b82f6' });

    if (isRainOrSnow || humidity >= 80) badges.push({ text: '실내 제습 권장', color: '#64748b' });
    else if (humidity <= 55 && desc.includes('맑음') && pm25 < 36) badges.push({ text: '빨래 바짝 마름', color: '#0ea5e9' });
    else badges.push({ text: '빨래 건조 무난', color: '#10b981' });

    return badges;
  };

  const getMountainIndices = () => {
    const badges = [];
    if (isRainOrSnow) badges.push({ text: '🌫️ 곰탕 시야 불량', color: '#64748b' });
    else if (temp <= -2 && humidity >= 75) badges.push({ text: '❄️ 눈꽃 절경 기대', color: '#0ea5e9' });
    else if (humidity >= 80 && wind <= 3.5) badges.push({ text: '🌊 운해 확률 높음', color: '#8b5cf6' });
    else if (humidity >= 85) badges.push({ text: '🌫️ 산안개 시야 주의', color: '#c2410c' });
    else if (pm25 <= 25 && desc.includes('맑음')) badges.push({ text: '🔭 탁 트인 뻥뷰', color: '#0ea5e9' });
    else badges.push({ text: '🏞️ 조망 양호', color: '#10b981' });

    if (temp <= 2 && (isRainOrSnow || humidity >= 70)) badges.push({ text: '🧊 블랙아이스 주의', color: '#dc2626' });
    else if (isRainOrSnow) badges.push({ text: '⚠️ 젖은 바위 조심', color: '#ea580c' });
    else if (temp <= 0) badges.push({ text: '❄️ 그늘 서리·결빙', color: '#2563eb' });
    else if (terrain.includes('암릉') || terrain.includes('바위')) badges.push({ text: '🪨 암릉 접지력 주의', color: '#b45309' }); 
    else badges.push({ text: '🥾 노면 건조 쾌적', color: '#16a34a' });

    if (wind >= 10) badges.push({ text: '🌪️ 강풍 체류 자제', color: '#dc2626' });
    else if (wind >= 6) badges.push({ text: '💨 능선 칼바람 주의', color: '#ea580c' });
    else if (temp <= 3) badges.push({ text: '🥶 정상 한기 보온', color: '#0284c7' });
    else badges.push({ text: '🍃 능선 바람 잔잔', color: '#0d9488' });

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
    <div className="glass-card detail-info-card" style={{ borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content', boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: isMountainMode ? '#166534' : '#1e293b' }}>
        {isMountainMode ? '⛰️ 4대 산행 환경 지수' : '상세 날씨 정보'}
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#475569', fontWeight: '600' }}>미세먼지 (PM2.5)</span>
          <span style={{ fontWeight: '800', color: '#1e293b' }}>
            {airQuality.level || '보통'} ({pm25})
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(to right, #38bdf8, #22c55e, #eab308, #ef4444)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-3px', left: `${Math.min(100, Math.max(0, (pm25 / 100) * 100))}%`, width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', border: '2px solid #0f172a' }} />
        </div>
      </div>

      <div style={{ marginTop: '16px', marginBottom: isMountainMode ? '12px' : '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
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
        <div style={{ position: 'relative', height: '40px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
          <svg width="100%" height="40" viewBox="0 0 180 40" preserveAspectRatio="none">
            <path d="M 10 5 Q 90 60 170 5" fill="none" stroke={celestial.isNight ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.2)"} strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <span style={{ position: 'absolute', bottom: '6px', left: `calc(${celestial.position}% - 10px)`, fontSize: '14px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', padding: '3px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', lineHeight: 1, transition: 'left 0.8s ease-in-out' }}>
            {celestial.icon}
          </span>
        </div>

        {isMountainMode && (
          <div style={{ marginTop: '4px', backgroundColor: 'rgba(255,247,237,0.7)', border: '1px solid rgba(254,215,170,0.5)', color: '#c2410c', borderRadius: '8px', padding: '4px 8px', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center' }}>
            🚨 안전 하산 마감: {safeDescentTime} 이전
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1e293b', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <span style={{ fontWeight: '600' }}>{isMountainMode ? '정상 습도:' : '습도:'} <strong>{humidity}%</strong></span>
        <span style={{ fontWeight: '600' }}>{isMountainMode ? '능선 풍속:' : '풍속:'} <strong>{wind} m/s</strong></span>
      </div>

      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: isMountainMode ? '#166534' : '#475569', fontWeight: 'bold' }}>
          {isMountainMode ? '🎒 기온 기반 레이어링' : '생활 지수 추천'}
        </h4>
        
        <div style={{ background: isMountainMode ? 'rgba(240,253,244,0.7)' : 'rgba(255,255,255,0.5)', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: '1.4', wordBreak: 'keep-all' }}>
          <span style={{ fontWeight: 'bold' }}>{mainRecommendation}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {activeBadges.map((badge, idx) => {
             let bgAlpha = badge.color.replace(')', ', 0.15)').replace('rgb', 'rgba');
             if(badge.color.startsWith('#')) bgAlpha = `${badge.color}25`;

             return (
              <div key={idx} style={{ background: bgAlpha, border: `1px solid ${badge.color}40`, color: badge.color, padding: '6px 4px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', wordBreak: 'keep-all' }}>
                {badge.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeatherDetails;