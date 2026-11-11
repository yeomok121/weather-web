import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// 예전 공유 주소(/?mountain=북한산)를 새 산악 페이지 주소(/mountain/북한산)로 바꿉니다.
const legacyParams = new URLSearchParams(window.location.search);
const legacyMountain = legacyParams.get('mountain');
if (window.location.pathname === '/' && legacyMountain) {
  legacyParams.delete('mountain');
  const rest = legacyParams.toString();
  window.history.replaceState(null, '', `/mountain/${encodeURIComponent(legacyMountain)}${rest ? `?${rest}` : ''}${window.location.hash}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
