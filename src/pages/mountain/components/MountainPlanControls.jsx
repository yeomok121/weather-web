import React, { useState } from 'react';
import { koreanDate } from '../lib/hikingPlan';
import HikingScheduleComparison from './HikingScheduleComparison';

// All itinerary inputs live together; forecast results stay directly below them.
export default function MountainPlanControls({ courses, courseIndex, onCourse, paces, pace, onPace,
  departureDraft, departureError, onDepartureDraft, onDeparture, onOffset, activeOffset,
  restoredDepartureAt, offsets, getOffsetLabel, compareOpen, onCompareOpen,
  hourlyData, weatherData, durationMinutes, departureAt, mountainName, onReview }) {
  const [referenceAt] = useState(() => Date.now());
  const tomorrow = hour => onDeparture(new Date(`${koreanDate(referenceAt + 86400000)}T${String(hour).padStart(2, '0')}:00:00+09:00`).toISOString());
  return <section id="hike-schedule" className="mountain-plan-controls" tabIndex={-1} aria-labelledby="mountain-plan-heading">
    <div className="mountain-section-heading"><h3 id="mountain-plan-heading">{mountainName || '산행'} 일정 선택</h3><span>변경 즉시 아래 결과에 반영 · 한국 시간</span></div>
    <div className="mountain-input-grid">
      <label className="mountain-course-input">코스<select value={courseIndex} onChange={event => onCourse(Number(event.target.value))}>
        {courses.map((course, index) => <option key={index} value={index}>{course.name} · {course.distance} · 난이도 {course.diff}</option>)}
      </select></label>
      <fieldset className="mountain-pace-input"><legend>산행 속도</legend><div>
        {paces.map(item => <button type="button" key={item.key} aria-pressed={item.key === pace} onClick={() => onPace(item.key)}>{item.label.split('(')[0]}</button>)}
      </div></fieldset>
      <label className="mountain-date-input">출발 날짜·시간<input type="datetime-local" value={departureDraft} aria-invalid={!!departureError} aria-describedby={departureError ? 'departure-error' : undefined} onChange={event => onDepartureDraft(event.target.value)} /></label>
      <div className="mountain-quick-times" role="group" aria-label="출발 시간 빠른 선택">
        <button type="button" onClick={() => onOffset(0)}>{weatherData.isFuture ? '선택일 오전 8시' : '지금'}</button>
        {[6, 8, 10].map(hour => <button key={hour} type="button" onClick={() => tomorrow(hour)}>내일 {hour}시</button>)}
      </div>
    </div>
    {departureError && <p id="departure-error" className="mountain-input-error" role="alert">{departureError} 아래 결과는 마지막으로 선택한 유효한 일정입니다.</p>}
    <div className="mountain-schedule-tools">
      <details className="mountain-offset-picker"><summary>1~24시간 뒤 선택</summary>
        <label>출발 간격<select value={activeOffset} onChange={event => onOffset(Number(event.target.value))}>
          {offsets.map(item => <option key={item.value} value={item.value}>{restoredDepartureAt && item.value === 0 ? '직접 선택한 일정' : getOffsetLabel(item)}</option>)}
        </select></label>
      </details>
      <button type="button" className="mountain-compare-toggle" aria-expanded={compareOpen} aria-controls="mountain-comparison" onClick={() => onCompareOpen(!compareOpen)}>{compareOpen ? '시간 비교 접기' : '앞뒤 시간 비교하기'} <span aria-hidden="true">{compareOpen ? '−' : '+'}</span></button>
    </div>
    {compareOpen && <div id="mountain-comparison"><HikingScheduleComparison hourlyData={hourlyData} weatherData={weatherData} durationMinutes={durationMinutes} activeOffset={activeOffset} onSelectOffset={onOffset} restoredDepartureAt={departureAt} onSelectDeparture={onDeparture} /></div>}
    <button type="button" className="mountain-next-action" disabled={!!departureError} onClick={onReview}>선택한 일정의 조건 확인 ↓</button>
  </section>;
}
