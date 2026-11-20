// 낚시 페이지 맨 위: 지금 포인트 · 오늘 바다 날씨 · 오늘 출조 판단 (작게 한눈에)
// 포인트 목록을 못 받으면 예전처럼 해역 3곳 선택 상자를 보여줍니다.
import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiChevronRight, FiClock, FiMapPin, FiRefreshCw, FiStar } from 'react-icons/fi';
import { indexDayLabel, sessionLabel } from '../fishingFormat';
import { recommendFishingDay } from '../lib/bestDay';
import { seaWeather, todayVerdict } from '../lib/seaToday';
import { clock, windowReason } from '../lib/fishingTime';

const timeOf = (iso) => (typeof iso === 'string' && iso.length >= 16 ? iso.slice(11, 16) : '');

export default function FishingHero({ areas, area, onAreaChange, loading, onReload, pointMode, pickerOpen, onOpenPicker, isFavorite, onToggleFavorite,
  favoritePoints = [], onSelectPoint, data, nearbyKm = null, timing = null, onShowTiming }) {
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
    : best && !(bestIsToday && (verdict?.tone === 'caution' || verdict?.tone === 'stop')) ? `남은 예보 중 지수가 가장 높은 때 · ${indexDayLabel(best.date, now)} ${sessionLabel(best.session.session)} · ${best.topGrade}` : '';
  const updated = timeOf(data?.updated_at);

  return <section className="fish-hero fish-hero-compact glass-card" aria-label="지금 포인트와 오늘 바다 날씨">
    <div className="fish-hero-top">
      {pointMode ? <>
        <button type="button" className="fish-area-picker" onClick={onOpenPicker} aria-expanded={pickerOpen} aria-label="낚시 포인트 바꾸기"><FiMapPin /><b>{area.place}</b><em>포인트 바꾸기</em></button>
        <button type="button" className={`fish-star ${isFavorite ? 'on' : ''}`} onClick={onToggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}><FiStar /></button>
      </> : <label className="fish-area-picker"><FiMapPin /><span>해역</span>
        <select value={area.id} onChange={(event) => onAreaChange(event.target.value)} aria-label="확인할 해역 선택">
          {areas.map((item) => <option key={item.id} value={item.id}>{item.place}</option>)}
        </select>
      </label>}
      <span className="fish-hero-meta">{nearbyKm != null && <em className="fish-nearby">내 위치에서 가장 가까운 포인트 · 약 {nearbyKm < 10 ? nearbyKm.toFixed(1) : Math.round(nearbyKm)} km</em>}{area.region_name || '예보 구역 확인 중'}{updated ? ` · ${updated} 기준` : ''}</span>
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
    {timing && <TimingLine timing={timing} now={now} onClick={onShowTiming} />}
  </section>;
}

// 다음 추천 출조 시간 + 가장 급한 안전 알림 한 줄 (누르면 바다·물때 탭의 '출조 시간 · 안전'으로)
function TimingLine({ timing, now, onClick }) {
  const next = timing.recommended[0];
  const urgent = timing.notes.find((note) => note.level !== 'info');
  if (!next && !urgent) return null;
  const kstDay = (time) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(time);
  const day = next && kstDay(next.start) !== kstDay(now) ? '내일 ' : '오늘 ';
  return <button type="button" className="fish-timing-line" onClick={onClick}>
    <FiClock aria-hidden="true" />
    <span>{next ? <><b>{next.score === 2 ? '골든타임' : '다음 좋은 때'}</b> {day}{clock(next.start)}–{clock(next.end)} · {windowReason(next)}</> : <><b>출조 시간</b> {timing.blockedBy ? '특보 중이라 추천 없음' : '추천할 때 없음'}</>}
      {urgent && <em className={urgent.level}> · ⚠ {urgent.title}</em>}</span>
    <FiChevronRight aria-hidden="true" />
  </button>;
}
