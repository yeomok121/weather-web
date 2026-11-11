import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiWifiOff, FiInfo } from 'react-icons/fi';

export default function WeatherConnectionStatus({ state, hasData, fetchedAt, onRetry }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const busy = ['connecting', 'slow', 'retrying'].includes(state.phase);
  const stale = state.phase === 'stale';
  const failed = state.phase === 'error';
  if (online && !busy && !stale && !failed) return null;
  const time = fetchedAt ? new Date(fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
  let title = '최신 날씨를 확인하고 있어요';
  let message = hasData ? '표시된 자료를 유지하면서 새 예보를 확인합니다.' : '기상 자료를 받으면 기온과 산행 안내를 표시합니다.';
  if (busy && hasData) { title = '지난 자료로 먼저 보여드리고 있어요'; message = `${time}에 받은 자료입니다. 최신 날씨를 확인한 뒤 저장·공유할 수 있어요.`; }
  if (!online) { title = '인터넷 연결이 끊겼어요'; message = hasData ? `${time}에 받은 지난 자료입니다. 연결되면 다시 확인합니다.` : '연결되면 자동으로 다시 조회합니다.'; }
  else if (state.phase === 'slow') { title = '서버 연결에 시간이 걸리고 있어요'; message = '절전 상태인 서버를 연결하는 데 50초 이상 걸릴 수 있습니다. 응답이 없으면 한 번 더 자동으로 시도합니다.'; }
  else if (state.phase === 'retrying') { title = '서버에 다시 연결하고 있어요'; message = '첫 요청에 응답이 없어 자동 재시도 중입니다.'; }
  else if (stale) { title = '지난 자료를 표시하고 있어요'; message = `${time}에 받은 자료입니다. 현재 날씨와 다를 수 있어 출발 전에 다시 확인해 주세요.`; }
  else if (failed) { title = '날씨를 불러오지 못했어요'; message = state.message || '기상 자료가 확인될 때까지 수치와 활동 추천을 표시하지 않습니다.'; }
  return <section className={`weather-connection ${stale || failed || !online ? 'weather-connection--warning' : ''}`} role={failed ? 'alert' : 'status'} aria-live="polite">
    {!online ? <FiWifiOff size={19} /> : busy ? <FiRefreshCw className="connection-spinner" size={19} /> : <FiInfo size={19} />}
    <div><strong>{title}</strong><p>{message}</p>{state.requestId && <small>문의 번호: {state.requestId}</small>}</div>
    <button type="button" onClick={onRetry} disabled={busy || !online}>{busy ? '연결 중' : '다시 확인'}</button>
  </section>;
}
