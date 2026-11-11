import React, { useState, useEffect } from 'react';
import { isWeatherNumber } from '../lib/forecastCache';

function WeatherDetails({ airQuality = {}, current = {}, isMountainMode = false, mountainInfo = null, weatherFetchedAt = null }) {
  const sunrise = current.sunrise || '06:00';
  const sunset = current.sunset || '18:00';
  const [clockAt, setClockAt] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setClockAt(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hasData = current.hasData === true && isWeatherNumber(current.temp);
  const temp = isWeatherNumber(current.temp) ? Number(current.temp) : null;
  const feelsLike = isWeatherNumber(current.feelsLike) ? Number(current.feelsLike) : temp;
  const humidity = isWeatherNumber(current.humidity) ? Number(current.humidity) : null;
  const pm25 = airQuality.pm25 !== null && airQuality.pm25 !== undefined && Number.isFinite(Number(airQuality.pm25)) ? Number(airQuality.pm25) : null;
  const wind = isWeatherNumber(current.wind_speed) ? Number(current.wind_speed) : null;
  const desc = current.description || '맑음';
  const terrain = mountainInfo?.terrain || '';

  const rainProbability = Math.max(Number(current.targetPop || 0), Number(current.nextHoursRainPop || 0));
  const isRainOrSnow = desc.includes('비') || desc.includes('소나기') || desc.includes('눈') || desc.includes('우박') || rainProbability >= 60;
  const isSnow = desc.includes('눈');

  const getClothingRecommendation = () => {
    let base = '';
    if (feelsLike >= 28) base = '👕 민소매, 반바지';
    else if (feelsLike >= 23) base = '👕 반팔, 얇은 셔츠';
    else if (feelsLike >= 20) base = '👔 긴팔, 청바지';
    else if (feelsLike >= 17) base = '🧥 얇은 가디건';
    else if (feelsLike >= 12) base = '🧥 자켓, 야상';
    else if (feelsLike >= 9) base = '🧥 트렌치코트, 니트';
    else if (feelsLike >= 5) base = '🧣 코트, 히트텍';
    else base = '🧣 패딩, 두꺼운 코트';

    if (isRainOrSnow) return `${base} (☔ 우산)`;
    if (wind >= 7 && feelsLike < 20) return `${base} (💨 바람막이)`;
    return `${base} 준비`;
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
    else if (pm25 !== null && pm25 >= 50) badges.push({ text: '야외 운동 자제 (먼지)', color: '#ef4444' });
    else if (wind >= 8) badges.push({ text: '강풍 실내 운동', color: '#c2410c' });
    else if (temp >= 31) badges.push({ text: '더운 시간 운동 줄이기', color: '#ef4444' });
    else if (temp <= -3) badges.push({ text: '추위 대비 실내 운동 고려', color: '#3b82f6' });
    else if (pm25 === null) badges.push({ text: '외출 전 대기질 확인', color: '#64748b' });
    else if (temp >= 27 || temp <= 6) badges.push({ text: '짧은 야외 활동 고려', color: '#b45309' });
    else badges.push({ text: '날씨 기준 야외 활동 무난', color: '#22c55e' });

    if (isRainOrSnow) badges.push({ text: '세차 비추천', color: '#ef4444' });
    else if (pm25 !== null && pm25 >= 36) badges.push({ text: '세차 보류 (먼지)', color: '#c2410c' });
    else if (temp <= -2) badges.push({ text: '세차 주의 (결빙)', color: '#b45309' }); 
    else if (pm25 === null) badges.push({ text: '세차 전 대기질 확인', color: '#64748b' });
    else badges.push({ text: '강수·먼지 조건 무난', color: '#3b82f6' });

    if (isRainOrSnow || humidity >= 80) badges.push({ text: '실내 제습 권장', color: '#64748b' });
    else if (humidity <= 55 && desc.includes('맑음')) badges.push({ text: '건조에 유리한 습도·하늘', color: '#0ea5e9' });
    else badges.push({ text: '빨래 건조 무난', color: '#10b981' });

    return badges;
  };

  const getMountainIndices = () => {
    const badges = [];
    if (isRainOrSnow) badges.push({ text: '🌫️ 곰탕 시야 불량', color: '#64748b' });
    else if (temp <= -2 && humidity >= 75) badges.push({ text: '❄️ 상고대 형성 조건 참고', color: '#0ea5e9' });
    else if (humidity >= 80 && wind <= 3.5) badges.push({ text: '🌊 운해 형성 조건 일부 해당', color: '#8b5cf6' });
    else if (humidity >= 85) badges.push({ text: '🌫️ 산안개 시야 주의', color: '#c2410c' });
    else if (pm25 !== null && pm25 <= 25 && desc.includes('맑음')) badges.push({ text: '🔭 조망 환경 참고 추정', color: '#0ea5e9' });
    else badges.push({ text: '🏞️ 조망 환경 참고 판단', color: '#10b981' });

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
  const activeBadges = humidity === null || wind === null
    ? [{ text: '일부 기상 자료 없음 · 활동 조건 확인 필요', color: '#64748b' }]
    : isMountainMode ? getMountainIndices() : getLifeIndices();
  const fetchedAtLabel = weatherFetchedAt instanceof Date && !Number.isNaN(weatherFetchedAt.getTime())
    ? weatherFetchedAt.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '확인 불가';
  const citySources = current.isFuture
    ? ['기온·강수·바람·습도: OpenWeather 주간 예보', '체감온도: 예보 최고기온·풍속을 이용한 앱 계산 참고치']
    : ['기온·습도·바람·시간별 강수: 기상청 동네예보', '체감온도·일출/일몰·대기질: OpenWeather'];
  const mountainSources = current.weatherSources
    ? Object.entries(current.weatherSources).map(([key, value]) => `${key === 'temperature' ? '기온' : key === 'wind' ? '바람' : key === 'humidity' ? '습도' : key}: ${value}`)
    : ['기온·바람·습도: 평지 예보 기반 산악 추정값'];
  if (isMountainMode) mountainSources.push('현재 대기질: OpenWeather');

  const celestial = (() => {
      const now = new Date(clockAt);
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
  })();

  if (!hasData) return <section className="glass-card detail-info-card weather-empty"><h3>상세 날씨 정보</h3><p>기상 자료를 받지 못했습니다.</p><dl className="empty-weather-values"><div><dt>습도</dt><dd>자료 없음</dd></div><div><dt>풍속</dt><dd>자료 없음</dd></div><div><dt>대기질</dt><dd>자료 없음</dd></div></dl><p>자료가 확인되면 옷차림과 활동 안내를 제공합니다.</p></section>;
  return (
    <div className="glass-card detail-info-card" style={{ borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content', boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: isMountainMode ? '#166534' : '#1e293b' }}>
        {isMountainMode ? '⛰️ 4대 산행 환경 지수' : '상세 날씨 정보'}
      </h3>

      <details style={{ margin: '0 0 12px', padding: '9px 10px', background: 'rgba(255,255,255,0.45)', borderRadius: '8px', color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155', minHeight: '24px' }}>ⓘ 자료 출처·산출 기준</summary>
        <div style={{ marginTop: '8px' }}>
          <div>이 화면에서 자료를 받은 시각: {fetchedAtLabel}</div>
          {(isMountainMode || current.weatherSources ? mountainSources : citySources).map((source, index) => <div key={index}>· {source}</div>)}
          {isMountainMode && <div style={{ marginTop: '4px' }}>{current.dataNote || '일부 정상 기상값은 고도 보정 추정값일 수 있습니다.'}</div>}
          {!isMountainMode && <div style={{ marginTop: '4px' }}>조회 시각은 공급 기관의 관측·예보 발표 시각과 다릅니다. {current.isFuture ? '대기질과 일출·일몰은 현재 기준 정보입니다.' : '현재 기상은 기상청 예보 기반이며 관측 실황과 다를 수 있습니다.'}</div>}
        </div>
      </details>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#475569', fontWeight: '600' }}>현재 미세먼지 (PM2.5)</span>
          <span style={{ fontWeight: '800', color: '#1e293b' }}>{pm25 === null ? '자료 없음' : `${airQuality.level || '확인 필요'} · ${pm25} µg/m³`}</span>
        </div>
        {pm25 === null
          ? <div style={{ fontSize: '12px', color: '#475569' }}>대기질 자료를 받지 못해 농도와 등급을 표시하지 않습니다.</div>
          : <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(to right, #38bdf8, #22c55e, #eab308, #ef4444)', position: 'relative' }}><div style={{ position: 'absolute', top: '-3px', left: `${Math.min(100, Math.max(0, (pm25 / 100) * 100))}%`, width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', border: '2px solid #0f172a' }} /></div>}
      </div>

      {current.sunrise && current.sunset ? <div style={{ marginTop: '16px', marginBottom: isMountainMode ? '12px' : '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
          {celestial.isNight ? (
            <>
              <span>🌇 오늘 일몰 {sunset}</span>
              <span>🌅 내일 일출 {sunrise}</span>
            </>
          ) : (
            <>
              <span>🌅 오늘 일출 {sunrise}</span>
              <span>🌇 오늘 일몰 {sunset}</span>
            </>
          )}
        </div>
        <div style={{ position: 'relative', height: '40px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
          <svg width="100%" height="40" viewBox="0 0 180 40" preserveAspectRatio="none">
            <path d="M 10 5 Q 90 60 170 5" fill="none" stroke={celestial.isNight ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.2)"} strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <span style={{ position: 'absolute', bottom: '6px', left: `calc(${celestial.position}% - 10px)`, fontSize: '20px', lineHeight: 1, transition: 'left 0.8s ease-in-out' }}>
            {celestial.icon}
          </span>
        </div>

        {isMountainMode && (
          <div style={{ marginTop: '4px', backgroundColor: 'rgba(255,247,237,0.7)', border: '1px solid rgba(254,215,170,0.5)', color: '#c2410c', borderRadius: '8px', padding: '4px 8px', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center' }}>
            🚨 권장 하산 시작: {current.safeDescentTime || '일몰 자료 확인 필요'}
          </div>
        )}
      </div>

      : <p className="muted">일출·일몰 자료 없음 · 날짜별 공식 정보를 확인하세요.</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1e293b', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <span style={{ fontWeight: '600' }}>{isMountainMode ? '정상 습도:' : '습도:'} <strong>{humidity === null ? '자료 없음' : `${humidity}%`}</strong></span>
        <span style={{ fontWeight: '600' }}>{isMountainMode ? '능선 풍속:' : '풍속:'} <strong>{wind === null ? '자료 없음' : `${wind} m/s`}</strong></span>
      </div>

      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: isMountainMode ? '#166534' : '#475569', fontWeight: 'bold' }}>
          {isMountainMode ? '🎒 기온 기반 레이어링' : '생활 지수 추천'}
        </h4>
        
        <div style={{ background: isMountainMode ? 'rgba(240,253,244,0.7)' : 'rgba(255,255,255,0.5)', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: '1.4', wordBreak: 'keep-all' }}>
          <span style={{ fontWeight: 'bold' }}>{mainRecommendation}</span>
        </div>
        {!isMountainMode && <details style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
          <summary style={{ cursor: 'pointer', minHeight: '24px' }}>추천 판단 기준</summary>
          <div style={{ marginTop: '4px' }}>
            체감 {feelsLike}°C · 향후 6시간 최대 강수확률 {current.nextHoursRainPop ?? '—'}% · 풍속 {wind}m/s
            {pm25 === null ? ' · 대기질 자료 확인 필요' : ` · PM2.5 ${pm25}`}
          </div>
        </details>}
        
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
