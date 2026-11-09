import React from 'react';
import { assessHikingForecastWindow } from './mountainAssessment';

export default function HikingScheduleComparison({ hourlyData, weatherData, durationMinutes, activeOffset, onSelectOffset, restoredDepartureAt, onSelectDeparture }) {
  const now = new Date();
  const selected = restoredDepartureAt ? new Date(restoredDepartureAt) : new Date(now.getTime() + Number(activeOffset) * 3600000);
  const candidates = [-2, -1, 0, 1, 2].map(hours => ({ hours, date: new Date(selected.getTime() + hours * 3600000) })).filter(item => item.hours === 0 || item.date >= now);
  const format = date => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const pm25 = (weatherData.dust || '').match(/\d+/);
  return <section className="schedule-comparison" aria-label="출발 시간별 일정 비교">
    <p>선택한 코스와 속도로 앞뒤 시간을 비교합니다.</p>
    <div className="schedule-options">{candidates.map(({ hours, date }) => {
      const offset = (date.getTime() - now.getTime()) / 3600000;
      const assessment = assessHikingForecastWindow({ hourlyData, now, departureOffsetHours: offset, durationMinutes,
        fallbackWeather: { temp: weatherData.temp, wind: weatherData.wind_speed, condition: weatherData.condition,
          humidity: weatherData.humidity, pm25: pm25 ? Number(pm25[0]) : 15, targetPop: weatherData.targetPop },
      });
      const covered = assessment.mode === 'course_window' || assessment.mode === 'partial_window';
      const finish = new Date(date.getTime() + durationMinutes * 60000);
      return <button key={hours} type="button" aria-pressed={hours === 0} onClick={() => onSelectDeparture ? onSelectDeparture(date.toISOString()) : onSelectOffset(Math.round(offset))}>
        <span className="schedule-start">{hours === 0 ? '선택한 출발' : hours < 0 ? `${-hours}시간 앞당김` : `${hours}시간 늦춤`}<strong>{format(date)}</strong></span>
        <span className="schedule-score">기상 <strong>{covered && assessment.weatherAssessment.score !== null ? `${assessment.weatherAssessment.score}점` : '자료 부족'}</strong></span>
        <span className="schedule-score">조망 <strong>{covered && assessment.viewEstimate.score !== null ? `${assessment.viewEstimate.score}점` : '—'}</strong></span>
        <span className="schedule-finish">하산 {format(finish)} · 해당 날짜의 일몰 확인</span>
        {assessment.mode === 'partial_window' && <span>일부 시간만 예보 제공</span>}
      </button>;
    })}</div>
    <p className="muted">점수는 예보가 제공된 시간대의 참고값입니다. 일부 구간만 제공되면 전체 산행의 조건을 나타내지 않습니다.</p>
  </section>;
}
