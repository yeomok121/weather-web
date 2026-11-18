// 낚시 페이지: 이번 주 가장 좋은 날 추천 (바다낚시지수 7일치 기준)
import { FiStar } from 'react-icons/fi';
import { recommendFishingDay } from '../lib/bestDay';
import { formatRange, gradeTone, indexDayLabel, sessionLabel } from '../fishingFormat';

export default function BestDayCard({ days, warnings = [], now, onSelectDay }) {
  if (!days?.length) return null;
  const { best, blockedDates, insideWarning } = recommendFishingDay(days, warnings, { now });
  const activeWarning = warnings.find((item) => item.level === '주의' || item.level === '경보');
  if (!best) return <div className="fish-best none"><FiStar /><div><b>이번 주에는 지수가 '보통' 이상인 날이 없습니다</b><span>바다 상태가 좋지 않은 한 주입니다. 다른 포인트나 다음 주 예보를 확인해 보세요.</span></div></div>;
  const species = best.topSpecies.filter((name) => name !== '기타어종');
  return <div className={`fish-best ${gradeTone(best.topGrade)}`}>
    <FiStar />
    <div>
      <span>남은 예보 중 지수가 가장 높은 때</span>
      <b>{indexDayLabel(best.date, now)} {sessionLabel(best.session.session)} · <em className={`fish-grade ${gradeTone(best.topGrade)}`}>{best.topGrade}</em></b>
      <small>{species.length ? `${species.slice(0, 3).join('·')}${species.length > 3 ? ` 외 ${species.length - 3}종` : ''} · ` : ''}파고 {formatRange(best.session.wave_m, ' m')} · 풍속 {formatRange(best.session.wind_ms, ' m/s')}{best.session.tide_phase ? ` · ${best.session.tide_phase}` : ''}</small>
      {insideWarning && <small className="fish-best-warning">⚠ {activeWarning?.title} 기간이지만 이번 주에 다른 보통 이상 일정이 없습니다 · 출조 전 특보 해제 여부를 꼭 확인하세요.</small>}
      {!insideWarning && blockedDates.size > 0 && <small className="fish-best-note">{activeWarning?.title} 해제 예고일까지({[...blockedDates].map((date) => indexDayLabel(date, now)).join('·')})는 비교 대상에서 제외했습니다.</small>}
    </div>
    {onSelectDay && <button type="button" onClick={() => onSelectDay(best.date)}>자세히</button>}
  </div>;
}
