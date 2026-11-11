import React, { useState } from 'react';

const KEY = 'weather:mountain-guide:v1';

export default function MountainQuickGuide() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(KEY) !== 'seen'; } catch { return true; }
  });
  const close = () => {
    setOpen(false);
    try { localStorage.setItem(KEY, 'seen'); } catch { /* Guide remains usable without storage. */ }
  };
  return <div className="mountain-quick-guide">
    <button type="button" className="mountain-guide-toggle" aria-expanded={open} aria-controls="mountain-guide-content" onClick={() => setOpen(!open)}>ⓘ 처음 이용하시나요? <span>{open ? '안내 접기' : '이용 순서 보기'}</span></button>
    {open && <div id="mountain-guide-content">
      <p><strong>코스와 출발 시간을 고르면 준비가 시작돼요.</strong> 조건 확인과 준비물 작성은 로그인 없이 이용할 수 있어요.</p>
      <ol><li><b>일정 선택</b><span>코스·속도·출발 시간 설정</span></li><li><b>조건 확인</b><span>예보 점수와 주의사항 확인</span></li><li><b>준비·저장</b><span>물품 체크 후 로그인해 저장·초대</span></li></ol>
      <button type="button" onClick={close}>알겠어요</button>
    </div>}
  </div>;
}
