// 낚시 페이지 맨 위: 지금 포인트 · 오늘 바다 날씨 · 오늘 출조 판단 (작게 한눈에)
// 포인트 목록을 못 받으면 예전처럼 해역 3곳 선택 상자를 보여줍니다.
import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiMapPin, FiRefreshCw, FiStar } from 'react-icons/fi';
import { indexDayLabel, sessionLabel } from '../fishingFormat';
import { recommendFishingDay } from '../lib/bestDay';
import { seaWeather, todayVerdict } from '../lib/seaToday';

const timeOf = (iso) => (typeof iso === 'string' && iso.length >= 16 ? iso.slice(11, 16) : '');

export default function FishingHero({ areas, area, onAreaChange, loading, onReload, pointMode, onOpenPicker, isFavorite, onToggleFavorite,
  favoritePoints = [], onSelectPoint, data }) {
  const [now] = useState(() => Date.now());
  const sources = data?.sources || {};
  const forecastRows = sources.forecast?.records || [];
  const buoyRows = sources.buoy?.records || [];
  const indexDays = sources.fishing_index?.days || [];
  const warnings = sources.warnings?.items || [];
  const weather = data ? seaWeather({ forecastRows, buoyRows, indexDays, now }) : null;
  const verdict = data ? todayVerdict({ warnings, indexDays, forecastRows, buoyRows, now }) : null;
  const { best, insideWarning } = recommendFishingDay(indexDays, warnings, { now });
  // 오늘이 주의·비추천인데 "추천: 오늘"이라고 하면 모순이므로 그때는 이번 주 추천을 숨깁니다.
  const bestIsToday = best && indexDayLabel(best.date, now) === '오늘';
  const weekLine = insideWarning ? '이번 주는 특보 기간이라 따로 추천할 날이 없어요'
    : best && !(bestIsToday && (verdict?.tone === 'caution' || verdict?.tone === 'stop')) ? `이번 주 추천: ${indexDayLabel(best.date, now)} ${sessionLabel(best.session.session)} · ${best.topGrade}` : '';
  const updated = timeOf(data?.updated_at);

  return <section className="fish-hero fish-hero-compact glass-card" aria-label="지금 포인트와 오늘 바다 날씨">
    <div className="fish-hero-top">
      {pointMode ? <>
        <button type="button" className="fish-area-picker" onClick={onOpenPicker} aria-label="낚시 포인트 바꾸기"><FiMapPin /><b>{area.place}</b><em>포인트 바꾸기</em></button>
        <button type="button" className={`fish-star ${isFavorite ? 'on' : ''}`} onClick={onToggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}><FiStar /></button>
      </> : <label className="fish-area-picker"><FiMapPin /><span>해역</span>
        <select value={area.id} onChange={(event) => onAreaChange(event.target.value)} aria-label="확인할 해역 선택">
          {areas.map((item) => <option key={item.id} value={item.id}>{item.place}</option>)}
        </select>
      </label>}
      <span className="fish-hero-meta">{area.region_name || '예보 구역 확인 중'}{updated ? ` · ${updated} 기준` : ''}</span>
      <button type="button" className="fish-icon-button" onClick={onReload} disabled={loading} aria-label="최신 자료 불러오기" title="최신 자료 불러오기"><FiRefreshCw className={loading ? 'fish-spin' : ''} /></button>
    </div>

    {pointMode && favoritePoints.length > 0 && <div className="fish-hero-favorites">{favoritePoints.map((name) => <button type="button" key={name} className={name === area.pointId ? 'active' : ''} onClick={() => onSelectPoint(name)}><FiStar /> {name}</button>)}</div>}

    {weather ? <div className="fish-weather-strip">
      <div className="fish-weather-sky"><span aria-hidden="true">{weather.icon}</span><b>{weather.sky || '해상 날씨'}</b></div>
      {[['기온', weather.airTemp], ['바람', weather.wind], ['파고', weather.wave], ['수온', weather.waterTemp]].filter(([, value]) => value).map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}
    </div> : <p className="fish-weather-strip loading">{loading ? '바다 날씨를 확인하고 있어요…' : '바다 날씨 자료가 없습니다.'}</p>}
    {weather?.buoy && <p className="fish-hero-source">기온·바람·파고·수온: 가장 가까운 부이 {weather.buoy.name} · 약 {weather.buoy.distance} km{weather.buoy.hour ? ` · ${weather.buoy.hour}시 관측` : ''} / 하늘: 해상예보</p>}

    {verdict && <div className={`fish-verdict ${verdict.tone}`} role="status">
      {verdict.tone === 'go' || verdict.tone === 'okay' ? <FiCheckCircle /> : <FiAlertTriangle />}
      <div>
        <b>{verdict.title}</b>
        <span>{verdict.reasons.join(' · ')}</span>
        {weekLine && <small>{weekLine}</small>}
      </div>
    </div>}
  </section>;
}
