// 낚시 페이지: 낚시 포인트 고르기 (즐겨찾기 · 검색 · 바다별 목록 · 지도)
import { useMemo, useState } from 'react';
import { FiSearch, FiStar, FiX } from 'react-icons/fi';
import PointMap from './PointMap';
import { gradeTone, sessionLabel } from '../fishingFormat';

const SEAS = ['전체', '서해', '남해', '제주', '동해'];

export default function PointPicker({ points, selectedId, favorites, onSelect, onToggleFavorite, onClose, isLoggedIn }) {
  const [query, setQuery] = useState('');
  const [sea, setSea] = useState('전체');
  const filtered = useMemo(() => points.filter((point) => (sea === '전체' || point.sea === sea)
    && (!query.trim() || `${point.name} ${point.zone}`.includes(query.trim()))), [points, sea, query]);
  const favoritePoints = favorites.map((name) => points.find((point) => point.id === name)).filter(Boolean);

  return <section className="fish-panel fish-point-picker" aria-label="낚시 포인트 고르기">
    <div className="fish-point-picker-head">
      <h2>낚시 포인트 고르기 <small>{points.length}곳 · 오늘 바다낚시지수(갯바위)를 함께 표시합니다</small></h2>
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
      <ul className="fish-point-list">
        {filtered.map((point) => <li key={point.id} className={point.id === selectedId ? 'active' : ''}>
          <button type="button" className="fish-point-name" onClick={() => onSelect(point.id)}>
            <b>{point.name}</b><small>{[point.sea, point.zone || '구역 미설정'].filter(Boolean).join(' · ')}</small>
          </button>
          {point.today_grade && <em className={`fish-grade fish-point-grade ${gradeTone(point.today_grade)}`} title={`오늘 ${sessionLabel(point.today_session)} 바다낚시지수`}>오늘 {point.today_grade}</em>}
          <button type="button" className={`fish-star ${favorites.includes(point.id) ? 'on' : ''}`} onClick={() => onToggleFavorite(point.id)} aria-label={`${point.name} 즐겨찾기 ${favorites.includes(point.id) ? '해제' : '추가'}`} aria-pressed={favorites.includes(point.id)}><FiStar /></button>
        </li>)}
        {!filtered.length && <li className="fish-point-empty">검색 결과가 없습니다.</li>}
      </ul>
    </div>
  </section>;
}
