import React from 'react';
import { assessHikingForecastWindow } from './mountainAssessment';

export default function HikingScheduleComparison({ hourlyData, weatherData, durationMinutes, activeOffset, onSelectOffset, restoredDepartureAt }) {
  const now = new Date();
  const format = minutes => `${String(Math.floor((minutes % 1440) / 60)).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
  const baseMinutes = weatherData.isFuture ? 8 * 60 : now.getHours() * 60 + now.getMinutes();
  const pm25 = (weatherData.dust || '').match(/\d+/);
  const selectedDelay = restoredDepartureAt ? Math.max(0, (Date.parse(restoredDepartureAt) - now.getTime()) / 3600000) : Number(activeOffset);
  const offsets = [...new Set([0, 2, 4, 6, Number(activeOffset), ...(restoredDepartureAt && selectedDelay <= 12 ? [Math.round(selectedDelay)] : [])])].sort((a, b) => a - b);
  const selectedOffset = offsets.reduce((closest, offset) => Math.abs(offset - selectedDelay) < Math.abs(closest - selectedDelay) ? offset : closest);
  const sunsetParts = weatherData.sunset?.split(':').map(Number);
  const sunset = sunsetParts ? sunsetParts[0] * 60 + sunsetParts[1] : null;
  return <section id="hike-schedule" className="hike-schedule" aria-label="출발 시간별 일정 비교">
    <div className="planner-heading"><div><span className="eyebrow">출발 시간별 비교</span><h3>내 일정에 맞는 시간을 골라보세요</h3><p>선택한 코스와 속도로 기상 조건·하산 시간을 비교합니다.</p></div></div>
    <div className="schedule-options">{offsets.map(offset => {
      const start = baseMinutes + offset * 60;
      const finish = start + durationMinutes;
      const assessment = assessHikingForecastWindow({ hourlyData, now, departureOffsetHours: offset, durationMinutes,
        isFuture: !!weatherData.isFuture,
        fallbackWeather: { temp: weatherData.temp, wind: weatherData.wind_speed, condition: weatherData.condition,
          humidity: weatherData.humidity, pm25: pm25 ? Number(pm25[0]) : 15, targetPop: weatherData.targetPop },
      });
      const covered = assessment.mode === 'course_window' || assessment.mode === 'partial_window';
      const dayPrefix = start >= 1440 ? '다음 날 ' : '';
      const needsSunset = weatherData.isFuture || start >= 1440 || sunset === null;
      const late = !needsSunset && finish > sunset;
      return <button key={offset} type="button" aria-pressed={selectedOffset === offset} onClick={() => onSelectOffset(offset)}>
        <span className="schedule-start">{offset === 0 ? (weatherData.isFuture ? '오전 8시' : '지금 출발') : `+${offset}시간`}<strong>{dayPrefix}{format(start)}</strong></span>
        <span className="schedule-score">기상 <strong style={{ color: assessment.weatherAssessment.color }}>{covered && assessment.weatherAssessment.score !== null ? `${assessment.weatherAssessment.score}점` : '자료 부족'}</strong></span>
        <span className="schedule-score">조망 <strong style={{ color: assessment.viewEstimate.gradeColor }}>{covered && assessment.viewEstimate.score !== null ? `${assessment.viewEstimate.score}점` : '—'}</strong></span>
        <span className={late ? 'schedule-late' : 'schedule-finish'}>하산 {finish >= 1440 ? '다음 날 ' : ''}{format(finish)}{late ? ' · 일몰 후 예상' : needsSunset ? ' · 해당일 일몰 확인' : ''}</span>
      </button>;
    })}</div>
    <p className="muted">{weatherData.isFuture ? '선택일은 일 단위 예보만 있어 출발 시각별 기상 차이를 비교할 수 없습니다.' : '기상·조망은 산행 시간대 중 최저 참고 점수입니다. 예보가 같으면 점수도 같을 수 있습니다.'}</p>
  </section>;
}
