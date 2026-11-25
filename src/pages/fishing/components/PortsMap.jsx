// 낚시 페이지: 선택한 포인트와 근처 낚싯배 출항지를 함께 보여주는 작은 지도 (Leaflet, OpenStreetMap 바탕)
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const label = (text) => { const span = document.createElement('span'); span.textContent = text; return span; };

export default function PortsMap({ point, ports, activeId, onSelect, numbered = true }) {
  const container = useRef(null);
  const [map, setMap] = useState(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; });

  useEffect(() => {
    const instance = L.map(container.current, { center: [35.9, 127.6], zoom: 9, minZoom: 5, maxZoom: 15, scrollWheelZoom: false, zoomSnap: 0.5 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    setMap(instance);
    return () => { observer.disconnect(); instance.remove(); };
  }, []);

  useEffect(() => {
    if (!map) return undefined;
    const layer = L.layerGroup().addTo(map);
    ports.forEach((port, index) => {
      const active = port.id === activeId;
      const marker = L.circleMarker([port.lat, port.lon], { radius: active ? 10 : 8, weight: active ? 3 : 2, color: '#ffffff', fillColor: active ? '#0b5f66' : '#0f7f86', fillOpacity: 1 })
        .bindTooltip(label(`${numbered ? `${index + 1}. ` : ''}${port.name} · 낚싯배 ${port.ships}척`), { direction: 'top', permanent: active })
        .addTo(layer);
      marker.on('click', () => onSelectRef.current?.(port.id));
    });
    // 포인트는 출항지와 겹쳐도 보이도록 마지막에(맨 위에) 그립니다.
    L.circleMarker([point.lat, point.lon], { radius: 7, weight: 3, color: '#ffffff', fillColor: '#e0662b', fillOpacity: 1 })
      .bindTooltip(label(`낚시 포인트 · ${point.name}`), { direction: 'bottom' }).addTo(layer);
    return () => layer.remove();
  }, [map, point, ports, activeId, numbered]);

  useEffect(() => {
    if (!map) return;
    const bounds = L.latLngBounds([[point.lat, point.lon], ...ports.map((port) => [port.lat, port.lon])]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [map, point, ports]);

  return <div className="fish-ports-map-wrap">
    <div className="fish-ports-map" ref={container} role="img" aria-label={`${point.name}와 근처 출항지 ${ports.map((port) => port.name).join(', ')} 위치 지도`} />
    <p className="fish-ports-legend" aria-hidden="true"><span className="point" /> 낚시 포인트 <span className="port" /> 낚싯배 출항지 (점을 누르면 고르기)</p>
  </div>;
}
