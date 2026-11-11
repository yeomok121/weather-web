// 공통: 상단 메뉴 (검색창, 내 산행, 바다 낚시, 공지사항)
import { FiSearch, FiBell, FiClock } from 'react-icons/fi';

export default function TopNav({ search, isMountainMode, isFishingPage, mountainsList, loadMountainWeather, onOpenHikingPlanner, onToggleFishing, onOpenNotices }) {
  return (
    <nav className="top-nav" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', padding: '12px 40px', display: 'flex', justifyContent: 'center' }}>
      <div className="top-nav-inner" style={{ display: 'flex', width: '100%', maxWidth: '1320px', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div className="search-wrapper" style={{ position: 'relative', display: 'flex', width: '44%', maxWidth: '520px' }}>
          {/* 낚시 페이지에는 지역·산 검색이 필요 없어 숨깁니다 (자리는 유지해 버튼 위치가 그대로입니다) */}
          {!isFishingPage && <>
          <div style={{ display: 'flex', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: '30px', padding: '6px 20px', alignItems: 'center', zIndex: 10, border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <input 
              type="text" 
              placeholder={isMountainMode ? "산 이름 검색 (예: 북한산...)" : "검색할 지역을 입력하세요"}
              value={search.searchInput} 
              onChange={(e) => search.setSearchInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && search.handleSearch()} 
              onFocus={() => search.setIsSearchFocused(true)} 
              onBlur={() => setTimeout(() => search.setIsSearchFocused(false), 180)} 
              style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, padding: '6px', fontSize: '14px', backgroundColor: 'transparent', color: '#1e293b', fontWeight: '500' }} 
            />
            <button type="button" onClick={search.handleSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#334155' }}>
              <FiSearch size={18} />
            </button>
          </div>

          {search.isSearchFocused && (
            <div className="no-scrollbar glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, borderRadius: '15px', marginTop: '10px', zIndex: 50, padding: '12px', maxHeight: '320px', overflowY: 'auto' }}>
              {search.searchInput.trim() === '' && !isMountainMode ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><FiClock /> 최근 검색어</h4>
                    {search.recentSearches.length > 0 && (
                      <button onMouseDown={(e) => { e.preventDefault(); search.clearRecentSearches(); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>전체 삭제</button>
                    )}
                  </div>
                  {search.recentSearches.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {search.recentSearches.map((term, idx) => (
                        <li key={idx} onMouseDown={(e) => { e.preventDefault(); search.executeSearch(term); }} style={{ padding: '8px 4px', cursor: 'pointer', color: '#333', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== search.recentSearches.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                          <span>{term}</span><FiSearch color="#94a3b8" size={12} />
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px 0' }}>최근 검색어가 없습니다.</p>}
                </>
              ) : search.searchInput.trim() === '' && isMountainMode ? (
                <>
                  <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>⛰️ 산 목록</h4>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {mountainsList.map((m, idx) => (
                      <li key={idx} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadMountainWeather(m.name); search.setIsSearchFocused(false); } }} onMouseDown={(e) => { e.preventDefault(); loadMountainWeather(m.name); search.setIsSearchFocused(false); }} style={{ padding: '8px 4px', cursor: 'pointer', color: '#333', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <span><strong>{m.name}</strong> {m.peak && <span style={{ fontSize: '11px', color: '#64748b' }}>({m.peak})</span>} {m.region && <span style={{ fontSize: '11px', color: '#64748b' }}>{m.region}</span>}</span>
                        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold' }}>해발 {m.elevation}m</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><FiSearch size={12}/> 일치하는 {isMountainMode ? '산 이름' : '지역명'}</h4>
                  </div>
                  {search.autoCompleteList.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {search.autoCompleteList.map((region, idx) => (
                        <li key={idx} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); search.executeSearch(region); } }} onMouseDown={(e) => { e.preventDefault(); search.executeSearch(region); }} style={{ padding: '8px 4px', cursor: 'pointer', color: '#333', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <span>
                            {region}
                          </span>
                          <FiSearch color="#94a3b8" size={12} />
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px 0' }}>결과가 없습니다.</p>}
                </>
              )}
            </div>
          )}
          </>}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button type="button" className="header-hiking-button" onClick={onOpenHikingPlanner}>내 산행</button>
        <button type="button" onClick={onToggleFishing} style={{ backgroundColor: isFishingPage ? 'rgba(20,184,166,0.88)' : 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '7px 14px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          {isFishingPage ? '☀️ 날씨 홈' : '🎣 바다 낚시'}
        </button>
        <button type="button" onClick={onOpenNotices} style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
          <FiBell size={14} /> 공지사항
        </button>
        </div>
      </div>
    </nav>
  );
}
