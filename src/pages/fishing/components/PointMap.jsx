// 낚시 페이지: 낚시 포인트 지도 (Leaflet, 날씨 지도와 같은 OpenStreetMap 바탕). 점을 누르면 그 포인트를 고릅니다.
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const style = (selected, favorite) => ({
  radius: selected ? 9 : 6, weight: selected ? 3 : 2, color: '#ffffff',
  fillColor: selected ? '#e0662b' : favorite ? '#f0b429' : '#0f7f86', fillOpacity: 1,
});

export default function PointMap({ points, selectedId, favorites = [], onSelect }) {
  const container = useRef(null);
  const [map, setMap] = useState(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; });

  useEffect(() => {
    const instance = L.map(container.current, { center: [35.9, 127.6], zoom: 6, minZoom: 5, maxZoom: 13, scrollWheelZoom: false, zoomSnap: 0.5 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    setMap(instance);
    return () => { observer.disconnect(); instance.remove(); };
  }, []);

  useEffect(() => {
    if (!map || !points.length) return undefined;
    const layer = L.layerGroup().addTo(map);
    for (const point of points) {
      const marker = L.circleMarker([point.lat, point.lon], style(point.id === selectedId, favorites.includes(point.id))).addTo(layer);
      marker.bindTooltip(() => {
        const text = document.createElement('span');
        text.textContent = point.today_grade ? `${point.name} · 오늘 ${point.today_grade}` : point.name;
        return text;
      });
      marker.on('click', () => onSelectRef.current?.(point.id));
      if (point.id === selectedId) marker.bringToFront();
    }
    return () => layer.remove();
  }, [map, points, selectedId, favorites]);

  useEffect(() => {
    if (!map || !points.length) return;
    map.fitBounds(L.latLngBounds(points.map((point) => [point.lat, point.lon])), { padding: [18, 18] });
  }, [map, points]);

  return <div className="fish-point-map" ref={container} role="application" aria-label="낚시 포인트 지도 (점을 눌러 포인트 선택)" />;
}
