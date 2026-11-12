import { useEffect, useState } from 'react';
import L from 'leaflet';
import { requestJson } from '../../shared/lib/apiClient';
import { windArrowRotation, windColor, windDirectionLabel, windTravelLabel } from './weatherMap';

const observedLabel = value => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date(value));

export default function WindLayer({ map, latitude, longitude, revision }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    requestJson('/api/weather/wind/stations', { signal: controller.signal, timeoutMs: 60000 })
      .then(data => {
        if (!Array.isArray(data.stations) || !data.stations.length) throw new Error('표시할 바람 관측 자료가 없습니다.');
        setResult(data);
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason.status === 404
          ? '바람 지도 기능이 아직 서버에 반영되지 않았습니다. 잠시 후 다시 확인해 주세요.' : reason.message);
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    if (!map || !result) return;
    const group = L.layerGroup().addTo(map);
    result.stations.forEach(station => {
      const content = document.createElement('div');
      content.className = 'wind-station';
      content.style.color = windColor(station.speed);
      const arrow = document.createElement('span');
      const rotation = windArrowRotation(station.direction);
      arrow.textContent = station.speed === 0 ? '○' : rotation === null ? '—' : '↑';
      arrow.className = 'wind-station__arrow';
      if (rotation !== null) arrow.style.transform = `rotate(${rotation}deg)`;
      const speed = document.createElement('strong');
      speed.textContent = station.speed.toFixed(1);
      const name = document.createElement('small');
      name.textContent = station.name;
      const values = document.createElement('div');
      values.className = 'wind-station__values';
      values.append(arrow, speed);
      content.append(name, values);
      const title = `${station.name} · ${station.speed.toFixed(1)}m/s · ${windTravelLabel(station.direction, station.speed)}`;
      L.marker([station.lat, station.lon], {
        icon: L.divIcon({ html: content, className: 'wind-station-icon', iconSize: [80, 52], iconAnchor: [40, 26] }),
        title, keyboard: true, riseOnHover: true,
      }).addTo(group).bindPopup(() => {
        const popup = document.createElement('div');
        popup.className = 'wind-station-popup';
        popup.textContent = `${station.name}\n${windTravelLabel(station.direction, station.speed)}\n풍속 ${station.speed.toFixed(1)}m/s · ${windDirectionLabel(station.direction)}\n돌풍 ${station.gust === null ? '자료 없음' : `${station.gust.toFixed(1)}m/s`}\n${observedLabel(station.observed_at)} 관측 (한국 시간)`;
        return popup;
      }, { minWidth: 220, maxWidth: 280, className: 'wind-popup' });
    });
    return () => group.remove();
  }, [map, result]);

  const nearby = result && map && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? result.stations.map(station => ({ ...station, distance: map.distance([latitude, longitude], [station.lat, station.lon]) / 1000 }))
      .sort((left, right) => left.distance - right.distance).slice(0, 3) : [];
  const age = result ? Math.max(0, Math.floor((clock - Date.parse(result.latest_at)) / 60000)) : 0;

  return <div className="wind-panel" aria-label="바람 관측 정보">
    <p className="wind-panel__direction-guide">화살표 끝이 바람이 향하는 쪽입니다. 예: 서쪽 → 동쪽은 서풍 · 숫자는 풍속(m/s)</p>
    {!result && !error && <p role="status">기상청 관측소의 바람을 불러오고 있어요.</p>}
    {error && <p className="radar-card__error" role="alert">{error}</p>}
    {result && <>
      <p className="wind-panel__time"><strong>{observedLabel(result.latest_at)} 관측</strong> · {result.stations.length}개 지점 · {age}분 전
        {age > 90 && <span> · 자료 갱신 지연</span>}</p>
      <div className="radar-card__legend"><span>풍속(m/s)</span>
        {[{ value: 0, label: '0~3' }, { value: 3, label: '3~6' }, { value: 6, label: '6~10' }, { value: 10, label: '10+' }].map(item =>
          <span key={item.value}><i style={{ background: windColor(item.value) }} />{item.label}</span>)}
      </div>
      {nearby.length > 0 && <div className="wind-panel__nearby">
        {nearby.map(station => <button type="button" key={station.id} className="wind-panel__station"
          onClick={() => map.setView([station.lat, station.lon], 10)}>
          <span>{station.name} <small>약 {station.distance.toFixed(1)}km</small></span>
          <strong style={{ color: windColor(station.speed) }}>{station.speed.toFixed(1)} <small>m/s</small></strong>
          <span className="wind-panel__travel">{windTravelLabel(station.direction, station.speed)}</span>
          <small>{windDirectionLabel(station.direction)} · {observedLabel(station.observed_at)}</small>
        </button>)}
      </div>}
      <p className="radar-card__note">기상청 ASOS 관측소 기준 · 화살표는 바람이 불어가는 방향입니다. 각 지점을 누르면 관측 시각과 돌풍을 확인할 수 있어요. 조회 지역과 관측소 사이의 실제 바람은 다를 수 있습니다.</p>
    </>}
  </div>;
}
