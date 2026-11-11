// 공통: 앱 전체 배경·카드·반응형 레이아웃 스타일 (기존 App.jsx의 <style> 블록을 그대로 옮김)
const APP_SHELL_CSS = `
        .weather-bg { background-size: auto; animation: none; }
        .clear-day { background: radial-gradient(ellipse at 12% 0%, rgba(125, 211, 252, 0.28), transparent 42%), radial-gradient(ellipse at 88% 70%, rgba(167, 243, 208, 0.2), transparent 35%), #eef4fa; }
        .clear-night { background: radial-gradient(ellipse at 88% 0%, rgba(165, 180, 252, 0.25), transparent 40%), radial-gradient(ellipse at 12% 72%, rgba(125, 211, 252, 0.16), transparent 35%), #eef3fa; }
        .cloudy-day, .cloudy-night { background: radial-gradient(ellipse at 50% 0%, rgba(203, 213, 225, 0.38), transparent 44%), radial-gradient(ellipse at 90% 70%, rgba(186, 230, 253, 0.2), transparent 36%), #eff4f8; }
        .rain { background: radial-gradient(ellipse at 8% 0%, rgba(96, 165, 250, 0.22), transparent 42%), radial-gradient(ellipse at 88% 72%, rgba(165, 180, 252, 0.2), transparent 38%), #edf3fa; }
        .snow { background: radial-gradient(ellipse at 82% 0%, rgba(196, 181, 253, 0.22), transparent 42%), radial-gradient(ellipse at 12% 75%, rgba(186, 230, 253, 0.23), transparent 38%), #f1f4fb; }

        .snow-flake { position: absolute; width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%; top: -10px; animation: snowFall linear infinite; opacity: 0.18; }
        .rain-drop { position: absolute; width: 2px; height: 15px; background: rgba(100,116,139,0.16); top: -20px; animation: rainFall linear infinite; }
        @keyframes snowFall { to { transform: translateY(110vh) translateX(20px); opacity: 0; } }
        @keyframes rainFall { to { transform: translateY(110vh) rotate(15deg); opacity: 0; } }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.84), rgba(248,251,255,0.66)) !important;
          backdrop-filter: blur(22px) saturate(155%);
          -webkit-backdrop-filter: blur(22px) saturate(155%);
          border: 1px solid rgba(255,255,255,0.88) !important;
          box-shadow: 0 16px 38px rgba(31, 48, 76, 0.085), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35) !important;
          border-radius: 20px !important;
        }

        .top-nav { background: rgba(246,250,255,0.68) !important; backdrop-filter: blur(26px) saturate(165%) !important; -webkit-backdrop-filter: blur(26px) saturate(165%) !important; border-bottom: 1px solid rgba(255,255,255,0.82) !important; box-shadow: 0 8px 24px rgba(31,48,76,0.055), inset 0 1px 0 rgba(255,255,255,0.9); padding: 12px 24px !important; }
        .top-nav-inner { max-width: 1320px !important; }
        .search-wrapper > div:first-child { background: rgba(255,255,255,0.62) !important; backdrop-filter: blur(18px) saturate(150%); -webkit-backdrop-filter: blur(18px) saturate(150%); border: 1px solid rgba(255,255,255,0.92) !important; border-radius: 15px !important; box-shadow: 0 6px 20px rgba(31,48,76,0.06), inset 0 1px 0 rgba(255,255,255,0.95) !important; padding: 7px 12px !important; }
        .search-wrapper > div:first-child:focus-within { border-color: rgba(23,107,99,0.35) !important; box-shadow: 0 0 0 3px rgba(23,107,99,0.1), 0 8px 22px rgba(31,48,76,0.08) !important; }
        .top-nav > div > button { background: rgba(255,255,255,0.54) !important; color: #334155 !important; backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.88) !important; border-radius: 13px !important; box-shadow: 0 5px 16px rgba(31,48,76,0.05), inset 0 1px 0 rgba(255,255,255,0.9) !important; padding: 9px 14px !important; }
        .main-container { max-width: 1320px !important; gap: 24px !important; padding: 28px 24px !important; }
        .main-container > div { gap: 20px !important; }
        .weather-main-card { border-radius: 22px !important; box-shadow: 0 20px 46px rgba(31,48,76,0.1), inset 0 1px 0 rgba(255,255,255,0.95) !important; }
        .weather-main-card > div:first-child { background: linear-gradient(145deg, rgba(255,255,255,0.55), rgba(236,246,255,0.48)) !important; }
        .weather-main-right { background: linear-gradient(145deg, rgba(244,249,255,0.6), rgba(235,246,245,0.48)) !important; border-color: rgba(255,255,255,0.78) !important; backdrop-filter: blur(18px); }
        .app-footer { background: rgba(248,251,255,0.72) !important; backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.85) !important; border-radius: 0 !important; }
        .main-container .glass-card { transition: box-shadow 180ms ease; }
        .main-container .glass-card:hover { box-shadow: 0 14px 34px rgba(15,23,42,0.075) !important; }
        .main-container button:not(:disabled) { transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease; }
        .main-container button:not(:disabled):hover { filter: brightness(0.985); }
        .main-container button:active { transform: translateY(1px); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes skeleton-loading { 0% { background-color: rgba(255,255,255,0.5); } 50% { background-color: rgba(255,255,255,0.2); } 100% { background-color: rgba(255,255,255,0.5); } }
        .skeleton { animation: skeleton-loading 1.5s infinite ease-in-out; }

        .mobile-mtn-pills { display: none; }
        .desktop-mtn-list { display: block; }

        /* Wide mountain workspace: itinerary left, forecast context right. */
        .main-container.is-mountain-mode { max-width: 1680px !important; box-sizing: border-box; grid-template-columns: minmax(0, 1fr) minmax(340px, 400px); padding: 24px clamp(20px, 2.5vw, 48px) !important; }
        .top-nav.is-mountain-mode .top-nav-inner { max-width: 1584px !important; }
        .weather-status-shell.is-mountain-mode { max-width: 1680px; box-sizing: border-box; padding-inline: clamp(20px, 2.5vw, 48px); }
        .is-mountain-mode .main-side-column .main-outlook-card h3 { line-height: 1.5; }
        .is-mountain-mode .main-outlook-card button { padding: 10px 8px !important; line-height: 1.5; }
        .is-mountain-mode .main-outlook-card p { line-height: 1.7; overflow-wrap: anywhere; }
        @media (min-width: 1200px) {
          .is-mountain-mode .mountain-journey { padding: 24px !important; }
          .is-mountain-mode .mountain-plan-controls label, .is-mountain-mode .mountain-plan-controls legend { font-size: 14px; }
          .is-mountain-mode .mountain-plan-controls select, .is-mountain-mode .mountain-plan-controls input { font-size: 14px; }
          .is-mountain-mode .mountain-score-basis { font-size: 12px !important; }
          .is-mountain-mode .mountain-route-result { font-size: 14px; }
        }

        .member-intro { padding: 20px; }
        .member-intro h3 { margin: 0 0 8px; font-size: 16px; color: #1e293b; }
        .member-intro p { margin: 0 0 14px; font-size: 13px; line-height: 1.65; color: #526176; }
        .member-intro-actions { display: flex; gap: 8px; }
        .member-intro-actions button { flex: 1; min-height: 40px; border: 1px solid #bed8d0; border-radius: 8px; color: #176b63; background: #fff; font-weight: 700; cursor: pointer; }
        .member-intro-actions button:first-child { background: #176b63; color: #fff; }
        .summit-key-metrics { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; margin: 8px 0; padding: 10px 4px; border-block: 1px solid #deebe7; }
        .summit-key-metrics dt { font-size: 12px; color: #526176; }
        .summit-key-metrics dd { margin: 4px 0 0; font-size: 15px; font-weight: 750; color: #243e38; }
        .is-mountain-mode .weather-summary { justify-content: flex-start !important; padding: 16px !important; }
        .is-mountain-mode .desktop-mtn-list { max-height: 110px !important; }
        .is-mountain-mode .mountain-safety { flex-wrap: wrap; border-left-width: 4px !important; padding: 14px 16px !important; }
        .is-mountain-mode .mountain-safety strong { font-size: 15px !important; }
        .is-mountain-mode .mountain-safety span { font-size: 14px !important; }
        .is-mountain-mode .mountain-results { align-items: flex-start !important; }
        .is-mountain-mode .mtn-score-altitude-box { flex: 0.9 1 260px !important; }
        .is-mountain-mode .mountain-route-result { flex: 1.2 1 320px !important; }
        @media (max-width: 640px) {
          .summit-key-metrics { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .is-mountain-mode .mtn-score-altitude-box, .is-mountain-mode .mountain-route-result { flex: 1 1 100% !important; }
        }

        /* 💡 레이아웃 전체 간격(gap) 축소 및 모바일 최적화 */
        @media (max-width: 900px) {
          .main-container.is-mountain-mode { padding: 18px 16px !important; }
          .weather-status-shell.is-mountain-mode { padding-inline: 16px; }
          .main-container { grid-template-columns: minmax(0, 1fr) !important; display: grid !important; padding: 18px 16px !important; gap: 14px !important; }
          .main-primary-column, .main-side-column { display: contents !important; }
          .main-container .detail-info-card { order: 1; }
          .main-container .hourly-forecast-card { order: 2; }
          .main-container .main-weekly-card { order: 3; }
          .main-container .main-outlook-card { order: 4; }
          .main-container .main-login-card { order: 5; }
          .main-container.is-mountain-mode .hourly-forecast-card { order: 1; }
          .main-container.is-mountain-mode .detail-info-card { order: 2; }
          .top-nav { padding: 10px 16px !important; }
          .top-nav-inner { flex-direction: column !important; gap: 8px !important; }
          .search-wrapper { width: 100% !important; max-width: 100% !important; }
          .weather-main-card { flex-direction: column !important; }
          .weather-main-right { border-left: none !important; border-top: 1px solid #e8edf3 !important; padding: 14px 16px !important; }
          .app-footer { flex-direction: column !important; gap: 8px !important; padding: 12px !important; text-align: center !important; }
          .mobile-mtn-pills { display: flex !important; }
          .desktop-mtn-list { display: none !important; }
        }
        @media (max-width: 640px) {
          .main-container.is-mountain-mode { padding: 12px 10px !important; }
          .weather-status-shell.is-mountain-mode { padding-inline: 10px; }
          .main-container { padding: 12px 10px !important; gap: 12px !important; }
          .main-container > div { gap: 12px !important; }
          .top-nav { padding: 10px 12px !important; }
          .main-container button, .main-container input, .main-container select { min-height: 40px; }
          .main-container input[type="checkbox"] { min-height: 18px; min-width: 18px; }
          .hourly-chart-wrapper { min-width: 0; }
          .app-footer { font-size: 11px !important; }
        }
`;

export default function AppShellStyles() {
  return <style>{APP_SHELL_CSS}</style>;
}
