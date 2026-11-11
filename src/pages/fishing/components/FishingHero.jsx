// 낚시 페이지: 상단 소개 영역 (해역 선택, 새로고침)
import { FiAnchor, FiMapPin, FiRefreshCw } from 'react-icons/fi';

export default function FishingHero({ areas, area, onAreaChange, loading, onReload }) {
  return <section className="fish-hero glass-card">
    <div className="fish-hero-copy">
      <span className="fish-eyebrow"><FiAnchor /> WEATHER+ · 바다</span>
      <h1>오늘, 바다에 나가도 될까?</h1>
      <p>예보·실황·조위를 살펴 출조 계획을 세워보세요.</p>
      <label className="fish-area-picker"><FiMapPin /><span>확인할 해역</span>
        <select value={area.id} onChange={(event) => onAreaChange(event.target.value)} aria-label="확인할 해역 선택">
          {areas.map((item) => <option key={item.id} value={item.id}>{item.place}</option>)}
        </select>
      </label>
      <div className="fish-place"><span>예보 기준: {area.region_name}</span><span>· 실황은 가장 가까운 부이, 조위는 인근 예측 관측소 기준</span></div>
      <button className="fish-refresh" onClick={onReload} disabled={loading}><FiRefreshCw className={loading ? 'fish-spin' : ''} /> {loading ? '해양 자료 확인 중' : '최신 자료 불러오기'}</button>
    </div>
    <div className="fish-hero-art"><div className="fish-orb"><FiAnchor /></div><span>CHECK THE SEA</span></div>
  </section>;
}
