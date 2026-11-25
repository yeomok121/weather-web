// 낚시 페이지 탭 목록. 고른 탭은 주소(?tab=gear 등)에 남습니다. (첫 탭은 주소에 안 붙임)
export const FISHING_TABS = [
  { id: 'index', label: '낚시지수' },
  { id: 'forecast', label: '예보' },
  { id: 'sea', label: '바다·물때' },
  { id: 'ports', label: '낚싯배' },
  { id: 'gear', label: '준비물' },
  { id: 'species', label: '어종' },
];
export const DEFAULT_TAB = FISHING_TABS[0].id;
export const tabFromQuery = (value) => (FISHING_TABS.some((tab) => tab.id === value) ? value : DEFAULT_TAB);
export const tabButtonId = (id) => `fish-tab-${id}`;
export const tabPanelId = (id) => `fish-tabpanel-${id}`;
