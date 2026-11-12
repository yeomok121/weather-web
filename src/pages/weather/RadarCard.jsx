import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiCloudRain, FiCrosshair, FiPause, FiPlay, FiRefreshCw } from 'react-icons/fi';
import { API } from '../../shared/lib/config';
import { requestJson } from '../../shared/lib/apiClient';
import './RadarCard.css';

const timeLabel = value => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date(value));

export default function RadarCard({ latitude, longitude, region }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const images = useRef(new Map());
  const [map, setMap] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [revision, setRevision] = useState(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState(false);
  const [mapMoving, setMapMoving] = useState(false);
  const [frameState, setFrameState] = useState(null);
  const [clock, setClock] = useState(() => Date.now());
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const selectedFrame = manifest?.frames[index];
  const currentFrame = frameState?.id === selectedFrame?.id ? frameState : null;
  const imageLoading = !!selectedFrame && !currentFrame;
  const displayedAt = currentFrame?.observedAt;
  const visibleError = error || currentFrame?.error;

  const refresh = () => {
    setLoading(true);
    setPlaying(false);
    setError('');
    setManifest(null);
    setFrameState(null);
    if (mapError) mapRef.current?.eachLayer(layer => { if (layer instanceof L.TileLayer) layer.redraw(); });
    setRevision(value => value + 1);
  };

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const instance = L.map(container.current, {
      center: [36.2, 127.5], zoom: 7, minZoom: 5, maxZoom: 11,
      scrollWheelZoom: false, dragging: !L.Browser.mobile,
    });
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(instance);
    tiles.on('tileerror', () => setMapError(true));
    tiles.on('loading', () => setMapError(false));
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    mapRef.current = instance;
    setMap(instance);
    return () => {
      observer.disconnect();
      instance.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map || !hasLocation) return;
    map.setView([latitude, longitude], 8);
    markerRef.current?.remove();
    markerRef.current = L.circleMarker([latitude, longitude], {
      radius: 7, color: '#ffffff', weight: 3, fillColor: '#1978d2', fillOpacity: 1,
    }).addTo(map).bindTooltip(() => {
      const text = document.createElement('span');
      text.textContent = region || '조회 지역';
      return text;
    });
  }, [map, hasLocation, latitude, longitude, region]);

  useEffect(() => {
    const controller = new AbortController();
    requestJson('/api/weather/radar/frames', { signal: controller.signal, timeoutMs: 90000 })
      .then(data => {
        if (!Array.isArray(data.frames) || data.frames.length === 0) throw new Error('표시할 레이더 관측 자료가 없습니다.');
        setIndex(data.frames.length - 1);
        setManifest(data);
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason.status === 404
          ? '레이더 기능이 아직 서버에 반영되지 않았습니다. 잠시 후 다시 확인해 주세요.' : reason.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => () => {
    images.current.forEach(url => URL.revokeObjectURL(url));
    images.current.clear();
  }, []);

  useEffect(() => {
    if (!map || !selectedFrame) return;
    const controller = new AbortController();
    let cancelled = false;
    let overlay;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      controller.abort();
      overlay?.remove();
      setFrameState({ id: selectedFrame.id, error: '레이더 영상 응답이 지연되고 있습니다. 다시 시도해 주세요.' });
      setPlaying(false);
    }, 60000);
    async function showFrame() {
      let url = images.current.get(selectedFrame.id);
      if (!url) {
        const response = await fetch(`${API}${selectedFrame.path}`, { signal: controller.signal });
        if (!response.ok) {
          const failure = await response.json().catch(() => null);
          throw new Error(failure?.error_code === 'expired_time'
            ? '관측 목록이 오래되었습니다. 새로고침하면 최근 관측을 확인할 수 있어요.'
            : failure?.detail || '선택한 시각의 레이더 자료를 받지 못했습니다. 다른 시각을 선택하거나 다시 시도해 주세요.');
        }
        if (!response.headers.get('content-type')?.includes('image/png')) throw new Error('레이더 영상 형식을 확인하지 못했습니다.');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        images.current.set(selectedFrame.id, url);
        while (images.current.size > 14) {
          const oldest = images.current.keys().next().value;
          URL.revokeObjectURL(images.current.get(oldest));
          images.current.delete(oldest);
        }
      }
      if (controller.signal.aborted) return;
      overlay = L.imageOverlay(url, manifest.bounds, { opacity: 0.85, interactive: false });
      overlay.once('load', () => {
        if (controller.signal.aborted) return;
        clearTimeout(timeout);
        setFrameState({ id: selectedFrame.id, observedAt: selectedFrame.observed_at });
      });
      overlay.once('error', () => {
        if (controller.signal.aborted) return;
        clearTimeout(timeout);
        images.current.delete(selectedFrame.id);
        URL.revokeObjectURL(url);
        overlay.remove();
        setFrameState({ id: selectedFrame.id, error: '레이더 영상을 표시하지 못했습니다. 다시 시도해 주세요.' });
        setPlaying(false);
      });
      overlay.addTo(map);
    }
    showFrame().catch(reason => {
      if (cancelled) return;
      clearTimeout(timeout);
      setFrameState({ id: selectedFrame.id, error: controller.signal.aborted ? '레이더 영상 응답이 지연되고 있습니다. 다시 시도해 주세요.' : reason.message });
      setPlaying(false);
    });
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); overlay?.remove(); };
  }, [map, selectedFrame, manifest]);

  useEffect(() => {
    if (!playing || imageLoading || !displayedAt || visibleError) return;
    const timer = setTimeout(() => setIndex(value => (value + 1) % manifest.frames.length), 1000);
    return () => clearTimeout(timer);
  }, [playing, imageLoading, displayedAt, visibleError, manifest]);

  const latestAge = manifest ? Math.max(0, Math.floor((clock - Date.parse(manifest.latest_at)) / 60000)) : 0;
  return (
    <section className="glass-card radar-card" aria-labelledby="radar-title">
      <div className="radar-card__heading">
        <div><h2 id="radar-title"><FiCloudRain aria-hidden="true" /> 비구름 레이더</h2>
          <p>최근 강수 관측 · {hasLocation ? region : '전국'} 주변</p></div>
        <button type="button" className="radar-button" disabled={loading || imageLoading}
          onClick={refresh}><FiRefreshCw aria-hidden="true" /> 새로고침</button>
      </div>
      <div className="radar-card__map-wrap">
        <div ref={container} className="radar-card__map" aria-label="기상청 강수 관측 지도" />
        {hasLocation && <button type="button" className="radar-button radar-card__recenter" aria-label="조회 지역으로 지도 이동"
          onClick={() => mapRef.current?.setView([latitude, longitude], 8)}><FiCrosshair aria-hidden="true" /></button>}
        <button type="button" className="radar-button radar-card__move" aria-pressed={mapMoving}
          onClick={() => {
            if (mapMoving) mapRef.current?.dragging.disable();
            else mapRef.current?.dragging.enable();
            setMapMoving(value => !value);
          }}>{mapMoving ? '지도 이동 끄기' : '지도 이동 켜기'}</button>
        {(loading || imageLoading) && <div className="radar-card__status" role="status">
          {loading ? '기상청 레이더 자료를 확인하고 있어요.' : '선택한 시각의 영상을 불러오고 있어요.'}
        </div>}
        {!loading && !imageLoading && !displayedAt && <div className="radar-card__status">레이더 관측 영상 없음</div>}
      </div>
      {visibleError && <div className="radar-card__error" role="alert"><span>{visibleError}</span>
        <button type="button" className="radar-button" onClick={refresh}>다시 시도</button></div>}
      {mapError && <p className="radar-card__error">배경 지도를 일부 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</p>}
      {manifest && <>
        <div className="radar-card__playback">
          <button type="button" className="radar-button radar-button--primary" disabled={!!visibleError || (imageLoading && !playing)}
            aria-label={playing ? '레이더 영상 일시정지' : '레이더 영상 재생'} aria-pressed={playing}
            onClick={() => setPlaying(value => !value)}>{playing ? <FiPause /> : <FiPlay />}</button>
          <output aria-live="polite">{displayedAt ? timeLabel(displayedAt) : visibleError ? '영상 조회 실패' : '영상 확인 중'}<small>한국 시간 관측</small></output>
          <label className="radar-card__timeline"><span className="radar-sr-only">레이더 관측 시각 선택</span>
            <input type="range" min="0" max={manifest.frames.length - 1} step="1" value={index}
              aria-valuetext={timeLabel(selectedFrame.observed_at)} onChange={event => { setPlaying(false); setIndex(Number(event.target.value)); }} />
            <span><small>{timeLabel(manifest.frames[0].observed_at)}</small><small>최근 관측</small></span>
          </label>
        </div>
        <div className="radar-card__legend"><span>반사도(dBZ)</span>
          {manifest.legend.map(item => <span key={item.value}><i style={{ background: item.color }} />{item.value}{item.value === 50 ? '+' : ''}</span>)}
        </div>
        <p className="radar-card__note">최근 관측은 {latestAge}분 전 자료입니다.{latestAge > 30 ? ' 최신 자료 갱신이 지연되고 있습니다.' : ''} 회색은 자료 없음, 투명 영역은 에코 없음 또는 0dBZ 미만입니다.</p>
      </>}
      <p className="radar-card__note">기상청 HSR 합성 관측 · 관측 범위 밖의 강수는 확인할 수 없습니다. 현재 선택한 예보 날짜와 관계없이 최근 관측을 표시합니다.</p>
      <details className="radar-card__help"><summary>지도 조작·자료 안내</summary>
        <p>휴대폰에서는 ‘지도 이동 켜기’를 누르면 지도를 움직일 수 있어요. 페이지를 스크롤하려면 지도 이동을 꺼주세요. 색상은 레이더 반사도를 나타내며 강수확률과 다른 정보입니다.</p>
        <a href="https://www.weather.go.kr/w/image/radar.do" target="_blank" rel="noreferrer">기상청 레이더 확인 ↗</a>
      </details>
    </section>
  );
}
