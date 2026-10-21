import React, { useState, useEffect } from 'react';

function WeatherDetails({ airQuality = {}, current = {} }) {
  const sunrise = current.sunrise || '06:00';
  const sunset = current.sunset || '18:00';
  const [celestial, setCelestial] = useState({ position: 50, icon: '☀️', isNight: false });

  const temp = current.temp !== undefined ? Number(current.temp) : 20;
  const humidity = current.humidity !== undefined ? Number(current.humidity) : 50;
  const pm25 = airQuality.pm25 !== undefined ? Number(airQuality.pm25) : 15;
  const wind = current.wind_speed !== undefined ? Number(current.wind_speed) : 2;
  const desc = current.description || '맑음';

  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || desc.includes('천둥');
  const isSnow = desc.includes('눈');

  // 💡 1. 옷차림 추천 로직 (비/강풍 상황까지 반영)
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

  // 💡 2. 상황별 다채로운 생활 지수 4종 생성 (비 올 때 달리기 추천 모순 완벽 해결!)
  const getLifeIndices = () => {
    const badges = [];

    // [지수 1] 운동 / 야외활동 지수
    if (isRainOrSnow) {
      badges.push({
        text: isSnow ? '🧘 눈길 조심·실내 운동' : '🧘 실내 스트레칭 추천',
        color: '#6366f1',
      });
    } else if (pm25 >= 50) {
      badges.push({ text: '😷 야외 러닝 자제 (먼지)', color: '#ef4444' });
    } else if (wind >= 8) {
      badges.push({ text: '💨 강풍 주의·실내 운동', color: '#f97316' });
    } else if (temp >= 31) {
      badges.push({ text: '🥵 무더위 야외 운동 자제', color: '#ef4444' });
    } else if (temp <= -3) {
      badges.push({ text: '🥶 한파 주의·실내 운동', color: '#3b82f6' });
    } else if (temp >= 27 || temp <= 6) {
      badges.push({ text: '👟 가벼운 산책·조깅 적합', color: '#eab308' });
    } else {
      badges.push({ text: '🏃 달리기 완벽한 날씨', color: '#22c55e' });
    }

    // [지수 2] 세차 지수
    if (isRainOrSnow) {
      badges.push({ text: '🚫 세차 비추천 (비/눈)', color: '#ef4444' });
    } else if (pm25 >= 36) {
      badges.push({ text: '🌫️ 세차 비추천 (미세먼지)', color: '#f97316' });
    } else if (temp <= -2) {
      badges.push({ text: '🧊 세차 주의 (결빙 우려)', color: '#eab308' });
    } else {
      badges.push({ text: '✨ 세차하기 좋은 날', color: '#3b82f6' });
    }

    // [지수 3] 빨래 / 건조 지수
    if (isRainOrSnow || humidity >= 80) {
      badges.push({ text: '👕 실내 건조·제습기 권장', color: '#64748b' });
    } else if (humidity <= 55 && desc.includes('맑음') && pm25 < 36) {
      badges.push({ text: '☀️ 빨래 바짝 마르는 날', color: '#0ea5e9' });
    } else {
      badges.push({ text: '🧺 빨래 건조 무난함', color: '#10b981' });
    }

    // [지수 4] 우산 / 환기 / 자외선 맞춤 지수
    if (isRainOrSnow) {
      badges.push({ text: '☔ 외출 시 우산 필수!', color: '#2563eb' });
    } else if (pm25 >= 36) {
      badges.push({ text: '🪟 환기 자제·마스크 착용', color: '#ef4444' });
    } else if (!celestial.isNight && desc.includes('맑음') && temp >= 23) {
      badges.push({ text: '🕶️ 자외선 차단제 권장', color: '#f59e0b' });
    } else if (humidity <= 35) {
      badges.push({ text: '💧 건조 주의·수분 섭취', color: '#0284c7' });
    } else {
      badges.push({ text: '🍃 창문 열고 환기하기 좋음', color: '#14b8a6' });
    }

    return badges;
  };

  const clothing = getClothingRecommendation();
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

      // 낮 시간대: 일출 ~ 일몰 (해가 왼쪽에서 오른쪽으로 이동)
      if (currentMinutes >= riseMin && currentMinutes <= setMin) {
        const totalDaylight = Math.max(1, setMin - riseMin);
        const passedDaylight = currentMinutes - riseMin;
        const pos = Math.min(95, Math.max(5, (passedDaylight / totalDaylight) * 100));
        return { position: pos, icon: '☀️', isNight: false };
      } else {
        // 밤 시간대: 일몰 ~ 다음날 일출 (달이 왼쪽 일몰에서 오른쪽 일출로 이동)
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
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
        상세 날씨 정보
      </h3>

      {/* 미세먼지 바 */}
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

      {/* 💡 낮/밤에 맞춰 라벨 순서가 자연스럽게 전환되는 일출/일몰 궤적 */}
      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
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
      </div>

      {/* 습도 및 풍속 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <span>습도: <strong>{humidity}%</strong></span>
        <span>풍속: <strong>{wind} m/s</strong></span>
      </div>

      {/* 💡 상황별 맞춤형 생활 지수 추천 (옷차림 + 2x2 배지 그리드) */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>생활 지수 추천</h4>
        
        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{clothing}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {lifeBadges.map((badge, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: `${badge.color}12`, 
                border: `1px solid ${badge.color}30`, 
                color: badge.color, 
                padding: '9px 6px', 
                borderRadius: '8px', 
                fontSize: '12px', 
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