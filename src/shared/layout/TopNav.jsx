// Shared header: visual state only; search and navigation keep their existing handlers.
import { useRef, useState } from 'react';
import { FiSearch, FiBell, FiClock, FiMap, FiAnchor, FiSun, FiX } from 'react-icons/fi';

export default function TopNav({ search, isMountainMode, isFishingPage, isNoticeOpen, mountainsList, loadMountainWeather, onToggleMountainMode, onGoHome, onToggleFishing, onOpenNotices }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const isRecent = !search.searchInput.trim() && !isMountainMode;
  const isMountainList = !search.searchInput.trim() && isMountainMode;
  const closeSearch = () => { setMobileSearchOpen(false); search.setIsSearchFocused(false); };
  const choose = name => {
    if (isMountainList) loadMountainWeather(name);
    else search.executeSearch(name);
    closeSearch();
  };
  const openSearch = () => {
    setMobileSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const submit = event => { event.preventDefault(); search.handleSearch(); };
  const results = isMountainList ? mountainsList.map(mountain => ({ name: mountain.name, meta: [mountain.peak, mountain.region, `해발 ${mountain.elevation}m`].filter(Boolean).join(' · ') }))
    : (isRecent ? search.recentSearches : search.autoCompleteList).map(name => ({ name }));

  return <header className={`top-nav ${isMountainMode && !isFishingPage ? 'is-mountain-mode' : ''}`}>
    <div className="top-nav-inner">
      <button type="button" className="header-brand" onClick={() => { closeSearch(); onGoHome(); }} aria-label="Weather+ 일반 날씨 홈"><FiSun aria-hidden="true" size={24} /><span>Weather<span className="header-brand-plus">+</span></span></button>
      <div className={`header-search ${mobileSearchOpen ? 'is-expanded' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) search.setIsSearchFocused(false); }}>
        {!isFishingPage && <>
          <button ref={toggleRef} className="header-search-toggle" type="button" aria-label={mobileSearchOpen ? '검색창 닫기' : isMountainMode ? '산 검색창 열기' : '지역 검색창 열기'} aria-expanded={mobileSearchOpen} aria-controls="header-search-panel" onClick={() => mobileSearchOpen ? closeSearch() : openSearch()}>
            {mobileSearchOpen ? <FiX aria-hidden="true" size={20} /> : <FiSearch aria-hidden="true" size={20} />}
          </button>
          <div id="header-search-panel" className="header-search-panel" onKeyDown={event => { if (event.key === 'Escape') { closeSearch(); toggleRef.current?.focus(); } }}>
            <form className="header-search-form" role="search" onSubmit={submit}>
              <input ref={inputRef} aria-label={isMountainMode ? '산 이름 검색' : '지역 검색'} placeholder={isMountainMode ? '산 이름 검색 (예: 북한산...)' : '검색할 지역을 입력하세요'} value={search.searchInput}
                onChange={event => search.setSearchInput(event.target.value)} onFocus={() => search.setIsSearchFocused(true)} />
              <button type="submit" aria-label="검색 실행"><FiSearch aria-hidden="true" size={20} /></button>
            </form>
            {search.isSearchFocused && <div className="header-search-results" aria-label="검색 추천">
              <div className="header-results-heading"><h4>{isRecent ? <><FiClock aria-hidden="true" /> 최근 검색어</> : isMountainList ? '산 목록' : `일치하는 ${isMountainMode ? '산 이름' : '지역명'}`}</h4>
                {isRecent && search.recentSearches.length > 0 && <button type="button" onMouseDown={event => event.preventDefault()} onClick={search.clearRecentSearches}>전체 삭제</button>}
              </div>
              {results.length ? <ul>{results.map(item => <li key={item.name}><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(item.name)}>
                <span>{item.name}{item.meta && <span className="header-result-meta"> · {item.meta}</span>}</span><FiSearch aria-hidden="true" />
              </button></li>)}</ul> : <p>{isRecent ? '최근 검색어가 없습니다.' : '결과가 없습니다.'}</p>}
            </div>}
          </div>
        </>}
      </div>
      <nav className="header-navigation" aria-label="주요 서비스">
        <button type="button" className="header-nav-item" onClick={() => { closeSearch(); onToggleMountainMode(); }}>{isMountainMode ? <FiSun aria-hidden="true" size={16} /> : <FiMap aria-hidden="true" size={16} />}{isMountainMode ? '일반 날씨' : '산행 날씨'}</button>
        <button type="button" className="header-nav-item" aria-pressed={isFishingPage && !isNoticeOpen} onClick={() => { closeSearch(); onToggleFishing(); }}>{isFishingPage ? <FiSun aria-hidden="true" size={16} /> : <FiAnchor aria-hidden="true" size={16} />}{isFishingPage ? '날씨 홈' : '바다 낚시'}</button>
        <button type="button" className="header-nav-item" aria-pressed={!!isNoticeOpen} onClick={() => { closeSearch(); onOpenNotices(); }}><FiBell aria-hidden="true" size={16} />공지사항</button>
      </nav>
    </div>
  </header>;
}
