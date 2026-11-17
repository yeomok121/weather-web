// 낚시 페이지: 선택한 해역의 기상특보 (기상청 특보현황, 경보 → 주의보 → 예비특보 순)
import { FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const levelTone = (level) => ({ 경보: 'severe', 주의: 'warning', 예비: 'watch' })[level] || 'watch';

export default function WarningBanner({ warnings, error }) {
  if (!warnings && !error) return null; // 예전 서버처럼 특보 자료를 주지 않으면 표시하지 않습니다.
  const items = warnings?.items;
  const regions = (warnings?.regions || []).join(', ');

  if (!Array.isArray(items)) {
    return <section className="fish-warning unknown" role="status"><FiInfo /><div><b>기상특보를 확인하지 못했습니다</b><span>{error || '잠시 뒤 새로고침하거나 기상청 특보를 직접 확인해 주세요.'}</span></div></section>;
  }
  if (!items.length) {
    return <section className="fish-warning clear" role="status"><FiCheckCircle /><div><b>발효·예고 중인 기상특보가 없습니다</b>{regions && <span>확인한 특보구역: {regions}</span>}</div></section>;
  }
  const top = items[0];
  return <section className={`fish-warning ${levelTone(top.level)}`} role="alert">
    <FiAlertTriangle />
    <div>
      <b>{top.level === '예비' ? '기상특보 예고' : '기상특보 발효'} · {top.title}</b>
      <ul>{items.map((item) => <li key={`${item.region}-${item.kind}-${item.level}`}>
        <em className={`fish-warning-tag ${levelTone(item.level)}`}>{item.title}</em>
        <span>{item.region}</span>
        <small>{item.level === '예비' ? `발효 예정 ${item.effective}` : `발효 ${item.effective}`}{item.release_hint ? ` · 해제 예고 ${item.release_hint}` : ''}</small>
      </li>)}</ul>
      <small className="fish-warning-note">기상청 특보현황 기준입니다. 풍랑·강풍 특보 중에는 출조를 미루고 최신 특보를 다시 확인하세요.</small>
    </div>
  </section>;
}
