// 낚시 페이지: 기관 자료를 화면용 글자·숫자로 바꾸는 함수 모음 (화면과 분리해 테스트할 수 있게 둠)

const LABELS = {
  WH: '유의파고', WH_SIG: '유의파고', WH_MAX: '최대파고', WS: '풍속', WS1: '풍속', WS2: '풍속 범위',
  WD: '풍향', WD1: '풍향', TW: '해수면 온도', TA: '기온', HM: '습도', PA: '해면기압', WP: '파주기',
  STN_KO: '관측 지점', STN_ID: '지점 ID', TM: '관측 시각', REG_ID: '예보 구역', TM_FC: '예보 발표',
  TM_EF: '예보 시각', W1: '풍향 시작', W2: '풍향 종료', ST: '강수 확률', SKY: '하늘 상태', PREP: '강수 형태', WF: '날씨',
  LON: '경도', LAT: '위도', TP: '관측 종류', WH1: '파고 시작', WH2: '파고 범위',
  obsvtrNm: '기준 관측소', obsrvnDt: '예측 시각', obsrvnHgt: '예측 조위', distance_km: '기준 위치와 거리',
};

export const METRIC_UNITS = { WH: ' m', WH_SIG: ' m', WS: ' m/s', WS1: ' m/s', TW: '°C', TA: '°C', HM: '%' };

export const prettyKey = (key = '') => LABELS[key] || key.replaceAll('_', ' ');

// 2026111115 → "11/11 15시"
export function formatKmaTime(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10) return value || '—';
  return `${digits.slice(4, 6)}/${digits.slice(6, 8)} ${digits.slice(8, 10)}시`;
}

export function numberFrom(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

// WH, WH1, WH2 처럼 범위로 오는 값 중 가장 큰 값
export function rangeHigh(row, key) {
  const values = [row[key], row[`${key}1`], row[`${key}2`]].map(numberFrom).filter((value) => value !== null);
  return values.length ? Math.max(...values) : null;
}

export function forecastCards(row) {
  const windDirection = [row.W1, row.W2].filter(Boolean).join(' → ') || '—';
  const windSpeed = [row.WS1, row.WS2].filter(Boolean).join('–');
  const waveHeight = [row.WH1, row.WH2].filter(Boolean).join('–');
  const precipitation = ({ '0': '없음', '1': '비', '2': '비·눈', '3': '눈', '4': '눈·비' })[row.PREP] || '—';
  return [['예보 시각', formatKmaTime(row.TM_EF)], ['날씨', row.WF || '—'], ['파고', waveHeight ? `${waveHeight} m` : '—'], ['풍향', windDirection], ['풍속', windSpeed ? `${windSpeed} m/s` : '—'], ['강수', precipitation]];
}

// 예보 중 파고가 가장 높은 행과 바람이 가장 센 행
export function forecastOutlook(forecastRows = []) {
  const waveRow = forecastRows.filter((row) => rangeHigh(row, 'WH') !== null).sort((a, b) => rangeHigh(b, 'WH') - rangeHigh(a, 'WH'))[0];
  const windRow = forecastRows.filter((row) => rangeHigh(row, 'WS') !== null).sort((a, b) => rangeHigh(b, 'WS') - rangeHigh(a, 'WS'))[0];
  return { waveRow, windRow };
}

// TideBED 응답에서 지금 이후의 조위만 (최대 limit개)
export function upcomingTides(tideData, { now = Date.now(), limit = 6 } = {}) {
  const items = tideData?.body?.items?.item || [];
  const list = Array.isArray(items) ? items : [items];
  const rows = list.filter((item) => Date.parse(`${String(item.obsrvnDt || '').replace(' ', 'T')}:00+09:00`) >= now).slice(0, limit);
  return {
    rows,
    station: rows[0]?.obsvtrNm || list[0]?.obsvtrNm,
  };
}

const kstTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const kstDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

// "14:21", 그리고 오늘이 아니면 "내일 14:21"처럼 날짜 구분을 붙입니다.
export function formatTideTime(value, now = Date.now()) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return '—';
  const days = Math.round((Date.parse(`${kstDate.format(time)}T00:00:00+09:00`) - Date.parse(`${kstDate.format(now)}T00:00:00+09:00`)) / 86400000);
  const prefix = days === 0 ? '' : days === 1 ? '내일 ' : days === -1 ? '어제 ' : `${kstDate.format(time).slice(5).replace('-', '/')} `;
  return prefix + kstTime.format(time);
}

// 서버가 정리해 준 조위(predictions·extremes)에서 지금 이후 만조·간조와 그래프용 점을 고릅니다.
export function tideTimeline(tideSource, { now = Date.now(), extremeLimit = 4 } = {}) {
  const predictions = Array.isArray(tideSource?.predictions) ? tideSource.predictions : [];
  const extremes = Array.isArray(tideSource?.extremes) ? tideSource.extremes : [];
  const points = predictions
    .map((point) => ({ time: Date.parse(point.time), height: Number(point.height_cm) }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.height) && point.time >= now - 3 * 3600000);
  const upcoming = extremes
    .map((item) => ({ ...item, at: Date.parse(item.time) }))
    .filter((item) => Number.isFinite(item.at) && item.at >= now)
    .slice(0, extremeLimit);
  return { points, upcoming, station: tideSource?.station || '' };
}
