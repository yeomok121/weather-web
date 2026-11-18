import { FiTrash2 } from "react-icons/fi";

export default function WeatherFavorites({ favorites, isLoggedIn, weatherData, onCurrentLocationClick, onAddClick, onFavoriteClick, onRemoveFavorite }) {
  return (
    <section className="glass-card weather-favorites-card" aria-label="관심 지역">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '12px', color: '#334155', margin: 0, fontWeight: 'bold' }}>관심 지역</h4>
                <span style={{ display: 'block', marginTop: '2px', fontSize: '11px', color: '#64748b' }}>{isLoggedIn ? '내 계정에 동기화' : '이 브라우저에 저장'}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>{favorites.length}/5</span>
            </div>
            <button type="button" onClick={onCurrentLocationClick} style={{ cursor: 'pointer', color: '#1d4ed8', fontWeight: '700', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(255,255,255,0.55)', fontSize: '11.5px' }}>📍 현재 위치 날씨 보기</button>
            {favorites.length < 5 && <button type="button" onClick={onAddClick} style={{ cursor: 'pointer', color: '#166534', fontWeight: '700', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: '1px dashed rgba(22,101,52,0.35)', background: 'rgba(240,253,244,0.45)', fontSize: '11.5px' }}>＋ 지역 추가 · 최대 5곳 비교</button>}
            {favorites.length === 0 && <p style={{ margin: 0, color: '#526176', fontSize: '12px', lineHeight: 1.5 }}>자주 보는 지역을 추가하면 이 브라우저에서 다음 방문에도 빠르게 확인할 수 있어요.</p>}
            <ul style={{ listStyle: 'none', padding: '0', margin: '0', fontSize: '12px', lineHeight: '1.5' }}>
              {favorites.map((fav, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: index === 0 ? '8px' : '0', padding: '4px 6px', borderRadius: '6px', backgroundColor: weatherData.region === fav.name ? 'rgba(255,255,255,0.5)' : 'transparent' }}>
                  <button type="button" onClick={() => onFavoriteClick(fav)} style={{ cursor: 'pointer', flex: 1, border: 0, background: 'transparent', textAlign: 'left', color: weatherData.region === fav.name ? '#0f172a' : '#475569', fontWeight: weatherData.region === fav.name ? 'bold' : '500' }}>
                    {index + 1}. {fav.name} {isLoggedIn && index === 0 ? '(기본)' : ''}
                  </button>
                  {(
                    <button type="button" aria-label={fav.name + " 삭제"} onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.name); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><FiTrash2 size={13} /></button>
                  )}
                </li>
              ))}
            </ul>
          </div>
    </section>
  );
}
