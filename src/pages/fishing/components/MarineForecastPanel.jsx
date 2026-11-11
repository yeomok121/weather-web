// 낚시 페이지: 기상청 단기 해상예보 목록
import { FiWind } from 'react-icons/fi';
import { formatKmaTime } from '../fishingFormat';
import DataRows from './DataRows';

export default function MarineForecastPanel({ regionName, forecastRows, error }) {
  return <section className="fish-panel fish-forecast-panel"><div className="fish-panel-title"><FiWind /><div><h2>해상예보</h2><p>기상청 단기 해상예보 · {regionName}{forecastRows[0]?.TM_FC ? ` · 발표 ${formatKmaTime(forecastRows[0].TM_FC)}` : ''}</p></div></div>
    <DataRows rows={forecastRows} type="forecast" />{error && <p className="fish-inline-error">{error}</p>}
  </section>;
}
