import './MountainSummaryCard.css';

const departureText = value => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)) : '자료 없음';

// Embedded itinerary presentation. No weather or schedule calculations live here.
export default function MountainSummaryCard({ weatherData, timeline, departureAt, finishTime, safeDescentTime, sunset, decisionSummary, isStale, canPlan, onTomorrow, onEdit }) {
  const hasData = weatherData.hasData === true;
  const status = hasData && canPlan ? timeline : null;
  return <section className="mountain-summary" aria-label="선택 일정 기준 산행 안내">
    <div className="mountain-summary-status" style={status ? { color: status.safetyColor, backgroundColor: status.safetyBg } : undefined} role={status?.status === 'danger' ? 'alert' : 'status'}>
      <p>선택 일정 기준 · 출발 <strong>{canPlan ? departureText(departureAt) : '자료 없음'}</strong></p>
      <strong>{status ? status.safetyBadge : !hasData ? '기상 자료 확인 필요' : '코스·출발 일정 입력 필요'}</strong>
      {status && <p>{decisionSummary}</p>}
    </div>
    <dl className="mountain-summary-metrics">
      <div><dt>권장 하산 시작 시각</dt><dd>{hasData ? safeDescentTime || '자료 없음' : '자료 없음'}</dd><span>정상에서 하산을 시작할 시각</span></div>
      <div><dt>예상 하산 완료 시각</dt><dd>{hasData && canPlan ? finishTime || '자료 없음' : '자료 없음'}</dd><span>선택한 코스·속도·출발 시각 기준</span></div>
    </dl>
    <div className="mountain-summary-footer"><p>{canPlan ? '선택 일정 기준' : '현재 자료 기준'} 일몰 <strong>{hasData ? sunset || '자료 없음' : '자료 없음'}</strong><span>지형에 따라 더 일찍 어두워질 수 있어요.</span></p>
      {canPlan && <div className="mountain-summary-actions"><button type="button" className="ui-button" onClick={onTomorrow}>내일 6시</button><button type="button" className="ui-button" onClick={onEdit}>일정 변경</button></div>}
    </div>
    {isStale && hasData && <p className="mountain-summary-stale" role="status">지난 자료이거나 업데이트 중입니다. 최신 예보를 확인하세요.</p>}
  </section>;
}
