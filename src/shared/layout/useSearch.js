// 공통: 상단 검색창 (날씨 페이지는 지역 검색, 산악 페이지는 산 검색)
import { useMemo, useState } from 'react';
import { API } from '../lib/config';
import { readStoredJson } from '../lib/browserStorage';
import { KOREA_REGIONS } from '../../pages/weather/regions';

export function useSearch({ isMountainMode, mountainsList, loadWeather, loadMountainWeather, setIsAiLoading, showToast }) {
  const [searchInput, setSearchInput] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => readStoredJson('recentSearches', []).filter(value => typeof value === 'string'));
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const autoCompleteList = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return [];
    const candidates = isMountainMode ? mountainsList.map(item => item.name) : KOREA_REGIONS;
    return candidates.filter(name => name.toLowerCase().includes(query));
  }, [searchInput, mountainsList, isMountainMode]);

  const executeSearch = async (query) => {
    if (!query) return;
    setIsSearchFocused(false);
    setSearchInput('');
    try {
      setIsAiLoading(true);
      if (isMountainMode) {
        const exact = mountainsList.find(item => item.name === query);
        if (exact) { await loadMountainWeather(exact.name); return; }
        const matches = mountainsList.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
        if (matches.length > 1) { setSearchInput(query); setIsSearchFocused(true); setIsAiLoading(false); showToast('일치하는 산이 여러 곳입니다. 목록에서 산을 선택해 주세요.'); return; }
        if (matches.length === 1) { await loadMountainWeather(matches[0].name); return; }
        const res = await fetch(`${API}/api/mountain/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) { showToast('지원하지 않는 산 이름입니다.'); setIsAiLoading(false); return; }
        const loc = await res.json();
        await loadMountainWeather(loc.name);
      } else {
        const res = await fetch(`${API}/api/location/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) { showToast('해당 지역을 찾을 수 없습니다.'); setIsAiLoading(false); return; }
        const loc = await res.json();
        const updatedSearches = [loc.name, ...recentSearches.filter(t => t !== loc.name)].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        await loadWeather(loc.lat, loc.lon, loc.name);
      }
    } catch { showToast('검색 중 오류가 발생했습니다.'); setIsAiLoading(false); }
  };

  const clearRecentSearches = () => { setRecentSearches([]); localStorage.setItem('recentSearches', '[]'); };
  const resetSearch = () => setSearchInput('');

  return {
    searchInput, setSearchInput, recentSearches, clearRecentSearches, autoCompleteList,
    isSearchFocused, setIsSearchFocused, executeSearch, resetSearch,
    handleSearch: () => executeSearch(searchInput.trim()),
  };
}
