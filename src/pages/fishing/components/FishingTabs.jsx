// 낚시 페이지: 아래 내용을 탭으로 나눠 한 번에 하나만 보여줍니다. (브라우저 탭처럼 눌러서 옆으로 이동)
// 고른 탭은 주소(?tab=gear 등)에 남아 새로고침·공유해도 같은 탭이 열립니다.
import { useRef } from 'react';
import { FiActivity, FiAnchor, FiBookOpen, FiCheckSquare, FiDroplet } from 'react-icons/fi';
import { FISHING_TABS, tabButtonId, tabPanelId } from '../lib/tabs';

const ICONS = { index: FiAnchor, forecast: FiActivity, sea: FiDroplet, gear: FiCheckSquare, species: FiBookOpen };

export default function FishingTabs({ active, onChange }) {
  const anchor = useRef(null);
  const select = (id, focus = false) => {
    onChange(id);
    if (focus) document.getElementById(tabButtonId(id))?.focus();
    // 아래로 내려 읽다가 탭을 바꾸면 새 탭의 처음부터 보이게 올려 줍니다.
    const top = anchor.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) anchor.current.scrollIntoView({ block: 'start' });
  };
  const onKeyDown = (event) => {
    const index = FISHING_TABS.findIndex((tab) => tab.id === active);
    const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (move) { event.preventDefault(); select(FISHING_TABS[(index + move + FISHING_TABS.length) % FISHING_TABS.length].id, true); }
    if (event.key === 'Home') { event.preventDefault(); select(FISHING_TABS[0].id, true); }
    if (event.key === 'End') { event.preventDefault(); select(FISHING_TABS.at(-1).id, true); }
  };

  return <>
    <div ref={anchor} className="fish-tabs-anchor" aria-hidden="true" />
    <nav className="fish-tabs" aria-label="낚시 정보 보기">
      <div role="tablist" aria-label="낚시 정보" onKeyDown={onKeyDown}>
        {FISHING_TABS.map(({ id, label }) => { const Icon = ICONS[id]; return <button key={id} type="button" role="tab" id={tabButtonId(id)}
          aria-selected={active === id} aria-controls={tabPanelId(id)} tabIndex={active === id ? 0 : -1}
          className={active === id ? 'active' : ''} onClick={() => select(id)}>
          <Icon aria-hidden="true" /> {label}
        </button>; })}
      </div>
    </nav>
  </>;
}

// 탭 내용: 다른 탭일 때는 숨기기만 합니다(보던 날짜·편집 중인 내용 유지).
export function TabPanel({ id, active, children }) {
  return <div role="tabpanel" id={tabPanelId(id)} aria-labelledby={tabButtonId(id)} hidden={active !== id} className="fish-tabpanel">{children}</div>;
}
