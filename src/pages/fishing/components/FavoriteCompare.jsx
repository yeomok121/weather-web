// 낚시 페이지: 내 포인트 한눈에 비교 (즐겨찾는 포인트의 오늘·내일 바다낚시지수·파고·바람)
// 행을 누르면 그 포인트로 바뀝니다. 즐겨찾기가 없으면 저장 방법만 안내합니다.
import { useState } from 'react';
import { FiBarChart2, FiStar } from 'react-icons/fi';
import { gradeTone } from '../fishingFormat';
import { compareRows } from '../lib/compare';
import { useFavoriteIndexes } from '../useFavoriteIndexes';

const num = (value, unit) => (value == null ? '—' : `${value}${unit}`);
// 받침이 있으면 '이', 없으면 '가' (추자도가 · 김녕이)
const subject = (name) => { const code = name.charCodeAt(name.length - 1) - 0xac00; return `${name}${code >= 0 && code < 11172 && code % 28 ? '이' : '가'}`; };

function DayCell({ day, best }) {
  if (!day) return <td className="fish-compare-day empty">자료 없음</td>;
  return <td className={`fish-compare-day ${best ? 'best' : ''}`}>
    <em className={`fish-grade ${gradeTone(day.grade)}`}>{day.grade || '—'}</em>
    <small>파고 {num(day.waveMax, ' m')} · 바람 {num(day.windMax, ' m/s')}</small>
  </td>;
}

export default function FavoriteCompare({ favorites, currentPoint, onSelectPoint }) {
  const [now] = useState(() => Date.now());
  const indexes = useFavoriteIndexes(favorites);
  if (!favorites.length) {
    return <section className="fish-panel fish-compare empty">
      <div className="fish-panel-title"><FiBarChart2 /><div><h2>내 포인트 한눈에 비교</h2>
        <p>포인트 이름 옆 <FiStar aria-label="별" /> 을 눌러 자주 가는 곳을 저장하면, 여기서 오늘·내일 지수를 한 번에 비교할 수 있어요.</p></div></div>
    </section>;
  }
  const { rows, bestToday, bestTomorrow } = compareRows(favorites, indexes, now);
  const summary = bestToday ? `오늘은 ${subject(bestToday)} 가장 좋아요` : bestTomorrow ? `오늘은 '보통' 이상인 곳이 없어요 · 내일은 ${subject(bestTomorrow)} 가장 좋아요` : '오늘·내일 모두 \'보통\' 이상인 곳이 없어요';
  const loading = rows.some((row) => row.status === 'loading');

  return <section className="fish-panel fish-compare">
    <div className="fish-panel-title"><FiBarChart2 /><div><h2>내 포인트 한눈에 비교</h2>
      <p>{loading ? '즐겨찾는 포인트의 지수를 불러오고 있어요…' : summary} · 바다낚시지수 기준(가장 좋은 어종), 참고용</p></div></div>
    <div className="fish-compare-scroll">
      <table>
        <thead><tr><th scope="col">포인트</th><th scope="col">오늘{Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', hour: 'numeric', hourCycle: 'h23' }).format(now)) >= 12 ? ' (오후)' : ''}</th><th scope="col">내일</th><th scope="col">물때</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.name} className={row.name === currentPoint ? 'current' : ''}>
          <th scope="row"><button type="button" onClick={() => onSelectPoint(row.name)} aria-label={`${row.name}(으)로 바꾸기`}>
            <FiStar className="fav" /> {row.name}{row.name === currentPoint && <span className="now">보는 중</span>}
          </button></th>
          {row.status === 'ready' ? <>
            <DayCell day={row.today} best={row.bestToday} />
            <DayCell day={row.tomorrow} best={row.bestTomorrow} />
            <td className="fish-compare-tide">{row.today?.tide || row.tomorrow?.tide || '—'}</td>
          </> : <td colSpan={3} className="fish-compare-status">{row.status === 'loading' ? '불러오는 중…' : row.status === 'missing' ? '지금은 지수를 제공하지 않는 포인트예요' : '지수를 불러오지 못했어요'}</td>}
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}
