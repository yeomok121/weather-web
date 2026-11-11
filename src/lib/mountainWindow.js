import { assessHikingForecastWindow } from '../components/mountainAssessment.js';

const number = value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);

// A score represents the whole selected interval only when its hourly data is complete.
export function summarizeMountainWindow({ hourlyData = [], start, durationHours, pm25 = null }) {
  const startMs = Date.parse(start);
  const duration = Number(durationHours);
  const dust = number(pm25);
  if (!Number.isFinite(startMs) || !Number.isFinite(duration) || duration <= 0 || duration > 12) return { status: 'invalid' };
  const endMs = startMs + duration * 3600000;
  const rows = hourlyData.map(row => ({ ...row, timestamp: Date.parse(row.valid_at) }))
    .filter(row => Number.isFinite(row.timestamp) && row.timestamp >= startMs - 1800000 && row.timestamp <= endMs + 1800000)
    .sort((a, b) => a.timestamp - b.timestamp);
  const complete = rows.length > 0 && rows[0].timestamp <= startMs + 1800000 && rows.at(-1).timestamp >= endMs - 1800000 && rows.every((row, index) => !index || row.timestamp - rows[index - 1].timestamp <= 5400000);
  const vals = key => rows.map(row => number(row[key]));
  const temps = vals('temp'), winds = vals('wind_speed'), humidity = vals('humidity'), pops = vals('pop');
  const metrics = {
    minTemp: temps.every(value => value !== null) && temps.length ? Math.min(...temps) : null,
    maxWind: winds.every(value => value !== null) && winds.length ? Math.max(...winds) : null,
    maxPop: pops.every(value => value !== null && value >= 0 && value <= 1) && pops.length ? Math.round(Math.max(...pops) * 100) : null,
    maxHumidity: humidity.every(value => value !== null) && humidity.length ? Math.max(...humidity) : null,
  };
  const sufficient = complete && dust !== null && Object.values(metrics).every(value => value !== null);
  if (!sufficient) return { status: rows.length ? 'partial' : 'missing', rows, endMs, ...metrics };
  const assessment = assessHikingForecastWindow({ hourlyData: rows, now: new Date(startMs), departureOffsetHours: 0.001, durationMinutes: duration * 60,
    fallbackWeather: { temp: null, wind: null, humidity: null, condition: '', targetPop: null, pm25: dust } });
  return { status: 'complete', rows, endMs, ...metrics, assessment };
}
