// 낚시 페이지: 출조 전 예보 요약 (예보 중 가장 높은 파고·가장 센 바람)
import { useMemo } from 'react';
import { FiActivity, FiInfo } from 'react-icons/fi';
import { forecastOutlook, formatKmaTime } from '../fishingFormat';

export default function ForecastOutlook({ forecastRows }) {
  const outlook = useMemo(() => forecastOutlook(forecastRows), [forecastRows]);
  return <section className="fish-panel fish-outlook"><div className="fish-panel-title"><FiActivity /><div><h2>출조 전 예보 요약</h2><p>선택한 해역의 단기 예보에서 가장 큰 값을 표시합니다. 안전 판정은 아닙니다.</p></div></div>
    {outlook.waveRow || outlook.windRow ? <div className="fish-outlook-grid">
      {outlook.waveRow && <article><span>예보상 가장 큰 파고 범위</span><b>{outlook.waveRow.WH1 || '—'}–{outlook.waveRow.WH2 || outlook.waveRow.WH1 || '—'} m</b><small>{formatKmaTime(outlook.waveRow.TM_EF)} · 파고를 확인할 구간</small></article>}
      {outlook.windRow && <article><span>예보상 가장 강한 바람 범위</span><b>{outlook.windRow.WS1 || '—'}–{outlook.windRow.WS2 || outlook.windRow.WS1 || '—'} m/s</b><small>{formatKmaTime(outlook.windRow.TM_EF)} · 풍속을 확인할 구간</small></article>}
    </div> : <p className="fish-empty">예보 자료를 받으면 파고와 바람이 큰 시간대를 요약합니다.</p>}
    <p className="fish-outlook-note"><FiInfo /> 해역 단위 예보 요약입니다. 출조 전 최신 기상특보와 실제 현장 상황을 반드시 함께 확인하세요.</p>
  </section>;
}
