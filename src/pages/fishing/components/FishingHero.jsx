// 낚시 페이지: 상단 소개 영역 (포인트 선택·즐겨찾기, 새로고침)
// 포인트 목록을 못 받으면 예전처럼 해역 3곳 선택 상자를 보여줍니다.
import { FiAnchor, FiMapPin, FiRefreshCw, FiStar } from 'react-icons/fi';

export default function FishingHero({ areas, area, onAreaChange, loading, onReload, pointMode, onOpenPicker, isFavorite, onToggleFavorite, favoritePoints = [], onSelectPoint }) {
  return <section className="fish-hero glass-card">
    <div className="fish-hero-copy">
      <span className="fish-eyebrow"><FiAnchor /> WEATHER+ · 바다</span>
      <h1>오늘, 바다에 나가도 될까?</h1>
      <p>예보·실황·조위를 살펴 출조 계획을 세워보세요.</p>
      {pointMode ? <div className="fish-point-current">
        <button type="button" className="fish-area-picker" onClick={onOpenPicker} aria-label="낚시 포인트 바꾸기"><FiMapPin /><span>낚시 포인트</span><b>{area.place}</b><em>바꾸기</em></button>
        <button type="button" className={`fish-star big ${isFavorite ? 'on' : ''}`} onClick={onToggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}><FiStar /></button>
      </div> : <label className="fish-area-picker"><FiMapPin /><span>확인할 해역</span>
        <select value={area.id} onChange={(event) => onAreaChange(event.target.value)} aria-label="확인할 해역 선택">
          {areas.map((item) => <option key={item.id} value={item.id}>{item.place}</option>)}
        </select>
      </label>}
      {pointMode && favoritePoints.length > 0 && <div className="fish-hero-favorites">{favoritePoints.map((name) => <button type="button" key={name} className={name === area.pointId ? 'active' : ''} onClick={() => onSelectPoint(name)}><FiStar /> {name}</button>)}</div>}
      <div className="fish-place"><span>예보 기준: {area.region_name || '확인 중'}</span><span>· 실황은 가장 가까운 부이, 조위는 인근 예측 관측소 기준</span></div>
      <button className="fish-refresh" onClick={onReload} disabled={loading}><FiRefreshCw className={loading ? 'fish-spin' : ''} /> {loading ? '해양 자료 확인 중' : '최신 자료 불러오기'}</button>
    </div>
    <div className="fish-hero-art"><div className="fish-orb"><FiAnchor /></div><span>CHECK THE SEA</span></div>
  </section>;
}
