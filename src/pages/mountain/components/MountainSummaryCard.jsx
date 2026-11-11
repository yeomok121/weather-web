import './MountainSummaryCard.css';

const numericText = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? `${value}°C` : '자료 없음';
const departureText = value => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)) : '자료 없음';

// Presentation only: every status and time comes from the existing itinerary.
export default function MountainSummaryCard({ mountainName, weatherData, timeline, departureAt, finishTime, safeDescentTime, sunset, decisionSummary, isStale, canPlan, onTomorrow, onEdit }) {
  const hasData = weatherData.hasData === true;
  const status = hasData && canPlan ? timeline : null;
  return <section className="ui-card mountain-summary" aria-labelledby="mountain-summary-title">
    <div className="mountain-summary-heading">
      <div><p className="ui-caption">{mountainName || '선택한 산'} · 한국 시간</p><h2 id="mountain-summary-title">산행 요약</h2></div>
      {canPlan && <div className="mountain-summary-actions"><button type="button" className="ui-button ui-button--primary" onClick={onTomorrow}>내일 6시</button><button type="button" className="ui-button" onClick={onEdit}>일정 변경</button></div>}
    </div>
    <p className="mountain-summary-departure">선택 일정 기준 · 출발 <strong>{canPlan ? departureText(departureAt) : '자료 없음'}</strong></p>
    <div className="mountain-summary-status" style={status ? { color: status.safetyColor, backgroundColor: status.safetyBg } : undefined}>
      {status ? status.safetyBadge : !hasData ? '기상 자료 확인 필요' : '코스·출발 일정 입력 필요'}
    </div>
    <dl className="mountain-summary-metrics">
      <div><dt>정상 기온</dt><dd>{hasData ? numericText(weatherData.temp) : '자료 없음'}</dd><span>고도 보정 등 산악 추정값</span></div>
      <div><dt>체감온도</dt><dd>{hasData ? numericText(weatherData.feelsLike) : '자료 없음'}</dd><span>예보 기반 참고값</span></div>
      <div><dt>권장 하산 시작 시각</dt><dd>{hasData ? safeDescentTime || '자료 없음' : '자료 없음'}</dd><span>정상에서 하산을 시작할 시각</span></div>
      <div><dt>일몰 시각</dt><dd>{hasData ? sunset || '자료 없음' : '자료 없음'}</dd><span>지형에 따라 더 일찍 어두워질 수 있어요</span></div>
    </dl>
    <p className="mountain-summary-finish">예상 하산 완료 시각 <strong>{hasData && canPlan ? finishTime || '자료 없음' : '자료 없음'}</strong></p>
    {isStale && hasData && <p className="mountain-summary-stale" role="status">지난 자료이거나 업데이트 중입니다. 최신 예보를 확인하세요.</p>}
    {status && <p className={`mountain-summary-message ${status.status === 'danger' ? 'is-danger' : ''}`} role={status.status === 'danger' ? 'alert' : 'status'}>{decisionSummary}</p>}
  </section>;
}
