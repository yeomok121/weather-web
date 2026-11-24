// 낚시 페이지: 낚시 포인트 고르기 (즐겨찾기 · 검색 · 바다별 목록 · 지도)
import { useMemo, useState } from 'react';
import { FiSearch, FiStar, FiX } from 'react-icons/fi';
import PointMap from './PointMap';
import { gradeTone, sessionLabel } from '../fishingFormat';
import { distanceKm } from '../lib/nearest';

const SEAS = ['전체', '서해', '남해', '제주', '동해'];

export default function PointPicker({ points, selectedId, favorites, onSelect, onToggleFavorite, onClose, isLoggedIn, onShowIndex, referencePoint, nearMyLocation }) {
  const [query, setQuery] = useState('');
  const [sea, setSea] = useState('전체');
  const [showMore, setShowMore] = useState(false);
  const filtered = useMemo(() => points.filter((point) => (sea === '전체' || point.sea === sea)
    && (!query.trim() || `${point.name} ${point.zone}`.includes(query.trim()))), [points, sea, query]);
  const favoritePoints = favorites.map((name) => points.find((point) => point.id === name)).filter(Boolean);
  const defaultView = !showMore && !query.trim() && sea === '전체';
  const hasReference = Number.isFinite(referencePoint?.lat) && Number.isFinite(referencePoint?.lon);
  const distanceFromReference = point => hasReference && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lon))
    && point.lat != null && point.lon != null
    ? distanceKm(referencePoint, { lat: Number(point.lat), lon: Number(point.lon) }) : null;
  const pointDistances = new Map(points.map(point => [point.id, distanceFromReference(point)]));
  const quick = hasReference ? points.filter(point => pointDistances.get(point.id) !== null)
    .sort((a, b) => pointDistances.get(a.id) - pointDistances.get(b.id)).slice(0, 3) : points.slice(0, 3);
  const quickIds = new Set(quick.map(point => point.id));


  return <section className="fish-panel fish-point-picker" aria-label="낚시 포인트 고르기">
    <div className="fish-point-picker-head">
      <h2>낚시 포인트 고르기 <small>{points.length}곳 · '오늘 ○○'을 누르면 지수와 이유를 볼 수 있어요</small></h2>
      <button type="button" className="fish-icon-button" onClick={onClose} aria-label="닫기"><FiX /></button>
    </div>

    <div className="fish-point-favorites">
      <span><FiStar /> 즐겨찾기</span>
      {favoritePoints.length
        ? favoritePoints.map((point) => <button type="button" key={point.id} className={point.id === selectedId ? 'active' : ''} onClick={() => onSelect(point.id)}>{point.name}</button>)
        : <small>목록의 ☆을 눌러 자주 가는 포인트를 저장하세요. {isLoggedIn ? '계정에 저장됩니다.' : '로그인하면 계정에 저장됩니다.'}</small>}
    </div>

    <div className="fish-point-filters">
      <label className="fish-point-search"><FiSearch /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="포인트·바다 구역 검색 (예: 부산, 제주도)" aria-label="낚시 포인트 검색" /></label>
      <div className="fish-point-seas" role="tablist" aria-label="바다 선택">{SEAS.map((name) => <button type="button" role="tab" key={name} aria-selected={sea === name} className={sea === name ? 'active' : ''} onClick={() => setSea(name)}>{name}</button>)}</div>
    </div>

    <div className="fish-point-body">
      <PointMap points={filtered} selectedId={selectedId} favorites={favorites} onSelect={onSelect} />
      <div className="fish-point-results">
      {defaultView && <p className="fish-point-quick-label desktop-weather-label">{hasReference ? `${nearMyLocation ? '내 위치' : '선택 포인트'} 기준 가까운 곳 3곳` : '포인트 미리보기 3곳'}</p>}
      <ul id="fish-point-results" className="fish-point-list">
        {filtered.map((point, idx) => {
          const km = pointDistances.get(point.id);
          return <li key={point.id}
          className={`${point.id === selectedId ? 'active' : ''} ${defaultView && !quickIds.has(point.id) ? 'fish-point-extra' : ''}`}>
          <button type="button" className="fish-point-name" onClick={() => onSelect(point.id)}>
            <b>{point.name}</b><small>{[point.sea, point.zone || '구역 미설정'].filter(Boolean).join(' · ')}</small>
            {km !== null && <small className="desktop-weather-label">{nearMyLocation ? '내 위치' : '선택 포인트'}에서 약 {km < 10 ? km.toFixed(1) : Math.round(km)} km</small>}
          </button>
          {point.today_grade && <button type="button" className={`fish-grade fish-point-grade ${gradeTone(point.today_grade)} ${filtered[idx - 1]?.today_grade === point.today_grade ? 'fish-grade-repeat' : ''}`} onClick={() => onShowIndex?.(point)} title={`오늘 ${sessionLabel(point.today_session)} 바다낚시지수 · 눌러서 이유 보기`} aria-label={`${point.name} 오늘 바다낚시지수 ${point.today_grade}, 자세히 보기`}>오늘 {point.today_grade}</button>}
          <button type="button" className={`fish-star ${favorites.includes(point.id) ? 'on' : ''}`} onClick={() => onToggleFavorite(point.id)} aria-label={`${point.name} 즐겨찾기 ${favorites.includes(point.id) ? '해제' : '추가'}`} aria-pressed={favorites.includes(point.id)}><FiStar /></button>
        </li>;
        })}
        {!filtered.length && <li className="fish-point-empty">검색 결과가 없습니다.</li>}
      </ul>
      {filtered.length > 3 && !query.trim() && sea === '전체' && <button type="button" className="fish-point-more desktop-weather-label"
        aria-expanded={showMore} aria-controls="fish-point-results" onClick={() => setShowMore(value => !value)}>{showMore ? '목록 접기' : `포인트 더보기 (${filtered.length}곳)`}</button>}
      </div>
    </div>
  </section>;
}
