// 낚시 페이지 '낚싯배' 탭: 선택한 포인트 근처 낚싯배 출항지 3곳(거리·배 수)과 카카오맵·네이버지도 길찾기
// 자료는 해양경찰청 공개자료(서버 app/fishing/ports.py). 배 이름·연락처·요금·예약은 자료에 없습니다.
import { useMemo, useState } from 'react';
import { FiExternalLink, FiInfo, FiNavigation, FiRefreshCw } from 'react-icons/fi';
import { useNearbyPorts } from '../useNearbyPorts';
import { kakaoDirectionsUrl, naverDirectionsUrl } from '../lib/directions';
import PortsMap from './PortsMap';

function DirectionLinks({ port }) {
  return <div className="fish-port-links">
    <a href={kakaoDirectionsUrl(port)} target="_blank" rel="noopener noreferrer" aria-label={`${port.name} 카카오맵 길찾기 (새 창)`}>카카오맵 길찾기 <FiExternalLink aria-hidden="true" /></a>
    <a href={naverDirectionsUrl(port)} target="_blank" rel="noopener noreferrer" aria-label={`${port.name} 네이버지도 길찾기 (새 창)`}>네이버지도 길찾기 <FiExternalLink aria-hidden="true" /></a>
  </div>;
}

export default function PortsPanel({ area, active }) {
  const { data, error, loading, reload } = useNearbyPorts(area.lat, area.lon, active);
  const [picked, setPicked] = useState(null);
  const ports = useMemo(() => data?.ports || [], [data]);
  // 반경 안에 없으면 가장 가까운 한 곳만 보여줍니다. (지도가 다시 그려질 때마다 위치를 다시 맞추지 않도록 묶어 둠)
  const shown = useMemo(() => (ports.length ? ports : data?.nearest ? [data.nearest] : []), [ports, data]);
  const activeId = shown.some((port) => port.id === picked) ? picked : shown[0]?.id;
  const point = useMemo(() => ({ name: area.place, lat: Number(area.lat), lon: Number(area.lon) }), [area.place, area.lat, area.lon]);
  const sourceUrl = /^https:\/\//.test(data?.source_url || '') ? data.source_url : null;

  return <article className="fish-panel fish-ports-panel">
    <div className="fish-panel-title"><FiNavigation /><div><h2>근처 낚싯배 출항지 · 가는 길</h2><p>{area.place} 기준 · 낚시 포인트는 바다 위인 곳이 많아 출항지까지 길을 안내해요</p></div></div>

    {loading && <p className="fish-ports-loading" role="status"><FiRefreshCw className="fish-spin" aria-hidden="true" /> 근처 출항지를 찾고 있어요</p>}
    {error && <div className="fish-error" role="alert"><FiInfo /> {error}<button type="button" onClick={reload}>다시 시도</button></div>}

    {data && !ports.length && <p className="fish-ports-empty">
      <FiInfo aria-hidden="true" /><span>{data.radius_km}km 안에 낚싯배 출항지가 없어요.
      {data.nearest ? <> 가장 가까운 곳은 <b>{data.nearest.name}</b>({data.nearest.distance_km}km)이에요. 섬 포인트는 여객선이나 현지 배편을 함께 확인하세요.</> : null}</span>
    </p>}

    {shown.length > 0 && <div className="fish-ports-body">
      <PortsMap point={point} ports={shown} activeId={activeId} onSelect={setPicked} numbered={ports.length > 0} />
      <ol className="fish-ports-list">
        {shown.map((port, index) => <li key={port.id} className={port.id === activeId ? 'active' : ''}>
          <button type="button" className="fish-port-head" onClick={() => setPicked(port.id)} aria-pressed={port.id === activeId}>
            <span className="fish-port-rank" aria-hidden="true">{ports.length ? index + 1 : '!'}</span>
            <span className="fish-port-name"><b>{port.name}</b><small>{[port.station, port.office].filter(Boolean).join(' · ')}</small></span>
            <span className="fish-port-stats"><b>{port.distance_km}km</b><small>낚싯배 {port.ships}척</small></span>
          </button>
          <DirectionLinks port={port} />
        </li>)}
      </ol>
    </div>}

    {data && <p className="fish-tide-note">
      거리는 포인트에서 출항지까지 직선거리예요. 낚싯배 수는 그 항을 주로 쓰는 배 수이고, 배 이름·연락처·요금·예약은 자료에 없어 현지 선사나 낚시점에 확인해야 해요.
      {' '}자료: {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{data.source}</a> : data.source} ({data.base_date} 기준)
    </p>}
  </article>;
}
