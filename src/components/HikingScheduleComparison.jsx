import React from 'react';
import { assessHikingForecastWindow } from './mountainAssessment';
import './HikingScheduleComparison.css';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export default function HikingScheduleComparison({ hourlyData, weatherData = {}, durationMinutes, activeOffset = 0, onSelectOffset, restoredDepartureAt, onSelectDeparture }) {
  const now = new Date();
  const restoredTime = Date.parse(restoredDepartureAt);
  const offsetHours = Number.isFinite(Number(activeOffset)) ? Number(activeOffset) : 0;
  // The caller passes the resolved absolute departure, including relative offsets.
  // Do not apply activeOffset again to an already resolved date.
  const selected = new Date(Number.isFinite(restoredTime) ? restoredTime : now.getTime() + offsetHours * 3600000);
  const duration = Math.max(0, Number(durationMinutes) || 0);
  const candidates = [-2, -1, 0, 1, 2]
    .map(hours => ({ hours, date: new Date(selected.getTime() + hours * 3600000) }))
    .filter(item => item.hours === 0 || item.date >= now);
  const pm25 = (weatherData.dust || '').match(/\d+/);
  const options = candidates.map(({ hours, date }) => {
    const offset = (date.getTime() - now.getTime()) / 3600000;
    const assessment = assessHikingForecastWindow({ hourlyData, now, departureOffsetHours: offset, durationMinutes: duration,
      fallbackWeather: { temp: weatherData.temp, wind: weatherData.wind_speed, condition: weatherData.condition,
        humidity: weatherData.humidity, pm25: pm25 ? Number(pm25[0]) : 15, targetPop: weatherData.targetPop },
    });
    const covered = assessment.mode === 'course_window' || assessment.mode === 'partial_window';
    return { hours, date, offset, assessment, finish: new Date(date.getTime() + duration * 60000),
      weatherScore: covered ? assessment.weatherAssessment.score : null,
      viewScore: covered ? assessment.viewEstimate.score : null,
      label: hours === 0 ? '현재 선택' : hours < 0 ? `${-hours}시간 일찍` : `${hours}시간 늦게`,
      coverage: !covered ? '예보 없음' : assessment.mode === 'partial_window' ? '일부 구간 예보' : '',
    };
  });

  if (weatherData.isFuture) return <p className="departure-comparison-note">선택일은 일 단위 예보만 제공되어 시간별 점수를 비교할 수 없습니다. 출발 날짜·시간을 직접 선택하면 제공 범위 안의 시간별 예보로 확인할 수 있습니다.</p>;
  return <section className="departure-comparison" aria-label="출발 시간별 일정 비교">
    <div className="departure-comparison-head" aria-hidden="true"><span>출발 · 한국 시간</span><span>기상</span><span>조망</span><span>예상 하산</span></div>
    <div className="departure-comparison-options" role="group" aria-label="비교한 출발 시간 선택">
      {options.map(option => <button key={option.hours} type="button"
        className="departure-comparison-option" aria-pressed={option.hours === 0}
        aria-label={`${option.label}, ${dateFormatter.format(option.date)} ${timeFormatter.format(option.date)} 출발, 기상 ${option.weatherScore === null ? '자료 없음' : `${option.weatherScore}점`}, 조망 ${option.viewScore === null ? '자료 없음' : `${option.viewScore}점`}, ${dateFormatter.format(option.finish)} ${timeFormatter.format(option.finish)} 하산 예상${option.coverage ? `, ${option.coverage}` : ''}`}
        onClick={() => {
          if (option.hours === 0) return;
          if (onSelectDeparture) onSelectDeparture(option.date.toISOString());
          else onSelectOffset?.(Math.round(option.offset));
        }}>
        <span className="departure-comparison-time"><strong>{timeFormatter.format(option.date)} {option.hours === 0 && <span aria-hidden="true">✓</span>}</strong><small>{dateFormatter.format(option.date)} · {option.label}</small></span>
        <span className="departure-comparison-score">{option.weatherScore === null ? '—' : option.weatherScore}</span>
        <span className="departure-comparison-score">{option.viewScore === null ? '—' : option.viewScore}</span>
        <span className="departure-comparison-finish"><strong>{timeFormatter.format(option.finish)}</strong><small>{dateFormatter.format(option.finish)}</small></span>
        {option.coverage && <span className="departure-comparison-coverage">{option.coverage}{option.assessment.mode === 'partial_window' ? ' · 제공된 구간만 평가' : ' · 점수 비교 불가'}</span>}
      </button>)}
    </div>
    <p className="departure-comparison-note">시간을 누르면 일정에 적용됩니다. 점수는 제공된 산행 구간의 최저 참고값이며, 일출·일몰과 통제 여부는 별도로 확인하세요.</p>
  </section>;
}
