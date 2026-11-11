import React, { useMemo, useState } from 'react';
import { summarizeMountainWindow } from '../lib/mountainWindow.js';
import { solarTimes } from '../lib/solarTimes.js';
import { koreanDate } from '../lib/hikingPlan.js';
import './MountainWeatherPanel.css';

const timeText = value => new Intl.DateTimeFormat('ko-KR', {timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(value));

export default function MountainWeatherPanel({ mountainInfo, weatherData, hourlyData, isStale }) {
  const [selectedStart, setStart] = useState('');
  const [referenceAt] = useState(() => Date.now());
  const [duration, setDuration] = useState('3');
  const [checked, setChecked] = useState({});
  const rows = useMemo(() => (Array.isArray(hourlyData) ? hourlyData : []).filter(row => Number.isFinite(Date.parse(row.valid_at))).sort((a, b) => Date.parse(a.valid_at) - Date.parse(b.valid_at)), [hourlyData]);
  const start = rows.some(row => row.valid_at === selectedStart) ? selectedStart : (rows.find(row => Date.parse(row.valid_at) >= referenceAt - 3600000) || rows[0])?.valid_at || '';
  const dustMatch = (weatherData?.dust || '').match(/\((\d+(?:\.\d+)?)\)/);
  const pm25 = dustMatch ? Number(dustMatch[1]) : null;
  const summary = useMemo(() => summarizeMountainWindow({hourlyData: rows, start, durationHours: Number(duration), pm25}), [rows, start, duration, pm25]);
  const sun = start ? solarTimes(start, mountainInfo?.lat, mountainInfo?.lon) : null;
  const crossesDay = start && summary.endMs && koreanDate(new Date(start)) !== koreanDate(new Date(summary.endMs));
  const gear = ['등산화와 물', '비상식량', '휴대전화와 보조배터리', '헤드랜턴'];
  if (summary.minTemp !== null && summary.minTemp <= 5) gear.push('방한 의류와 장갑');
  if (summary.maxWind !== null && summary.maxWind >= 5) gear.push('방풍 재킷');
  if (summary.maxPop !== null && summary.maxPop >= 40) gear.push('방수 의류와 배낭 커버');
  if (summary.minTemp !== null && summary.minTemp <= 0) gear.push('결빙 가능 구간 확인·필요 시 아이젠');
  const search = encodeURIComponent(`${mountainInfo?.name || ''} 등산 안내`);
  return <section className="glass-card mountain-weather-panel" aria-labelledby="mountain-weather-heading">
    <div className="mountain-weather-panel__heading"><div><span>산악 기상 · 시간대 확인</span><h3 id="mountain-weather-heading">{mountainInfo?.name}에 갈 때 날씨는?</h3><p>코스 정보가 없어 날씨 중심으로 제공합니다. 실제 산행 시간은 직접 확인해 주세요.</p></div></div>
    {isStale && <p className="mountain-weather-panel__notice" role="status">지난 자료이거나 업데이트 중입니다. 출발 전 최신 예보를 다시 확인하세요.</p>}
    <div className="mountain-weather-panel__controls"><label>출발 예정 시각<select value={start} onChange={event => setStart(event.target.value)} disabled={!rows.length}>
      {!rows.length && <option value="">시간별 예보 없음</option>}{rows.map(row => <option key={row.valid_at} value={row.valid_at}>{timeText(row.valid_at)}</option>)}
    </select></label><label>날씨 확인 시간<select value={duration} onChange={event => setDuration(event.target.value)}><option value="2">2시간</option><option value="3">3시간</option><option value="4">4시간</option><option value="6">6시간</option><option value="8">8시간</option></select></label></div>
    <p className="mountain-weather-panel__caption">선택 시간은 사용자가 확인할 예보 범위이며, 코스 소요시간이나 하산 예상 시간이 아닙니다.</p>
    {summary.status === 'complete' ? <><div className="mountain-weather-panel__scores"><div><span>기상 조건 점수 · 참고</span><strong>{summary.assessment.weatherAssessment.score ?? '—'}</strong><small>{summary.assessment.weatherAssessment.status}</small></div><div><span>조망 환경 점수 · 참고</span><strong>{summary.assessment.viewEstimate.score ?? '—'}</strong><small>{summary.assessment.viewEstimate.gradeText}</small></div></div><p className="mountain-weather-panel__caption">{timeText(start)} ~ {timeText(summary.endMs)} 예보 중 낮은 점수 기준 · 미세먼지는 현재 관측값</p><details className="mountain-weather-panel__gear"><summary>점수 판단 근거와 한계</summary><p>기상: {summary.assessment.weatherAssessment.reasons.join(' · ')}</p><p>조망: {summary.assessment.viewEstimate.summaryReason}</p><p>기상 요소를 조합한 참고 지표이며 탐방로 상태·통제·실제 시야는 반영하지 않습니다.</p></details></> : <p className="mountain-weather-panel__notice" role="status">{summary.status === 'invalid' || summary.status === 'missing' ? '선택 시간의 예보를 확인할 수 없습니다.' : '선택 구간의 예보 또는 대기질이 부족해 점수를 표시하지 않습니다. 제공된 항목만 참고하세요.'}</p>}
    <div className="mountain-weather-panel__metrics"><div><span>예상 최저 기온</span><strong>{summary.minTemp == null ? '자료 없음' : `${summary.minTemp}°C`}</strong></div><div><span>예상 최대 풍속</span><strong>{summary.maxWind == null ? '자료 없음' : `${summary.maxWind} m/s`}</strong></div><div><span>최대 강수확률</span><strong>{summary.maxPop == null ? '자료 없음' : `${summary.maxPop}%`}</strong></div><div><span>선택 날짜 일몰</span><strong>{sun ? sun.sunset : '자료 없음'}</strong></div></div>
    {sun && <p className="mountain-weather-panel__notice">{crossesDay ? '날짜를 넘기는 일정입니다. 각 날짜의 일출·일몰을 확인하세요.' : summary.endMs > sun.sunsetAt ? '선택한 예보 확인 구간이 일몰 이후까지 이어집니다. 야간 산행과 입산 제한에 유의하세요.' : Date.parse(start) < sun.sunriseAt ? '선택한 시각은 일출 전입니다. 야간 산행과 입산 제한에 유의하세요.' : '일몰 전이라도 지형·날씨와 속도에 따라 어두워질 수 있습니다.'} 일출·일몰은 좌표 기준 계산값입니다.</p>}
    <details className="mountain-weather-panel__gear"><summary>🎒 날씨 참고 준비물 확인</summary><p>기본 예시입니다. 코스와 실제 상황에 맞게 준비하고 공식 통제 정보를 확인하세요.</p><div>{gear.map(item => <label key={item}><input type="checkbox" checked={!!checked[item]} onChange={event => setChecked(previous => ({...previous, [item]: event.target.checked}))} />{item}</label>)}</div><small>체크 상태는 현재 화면에만 유지됩니다.</small></details>
    <div className="mountain-weather-panel__links"><a href={`https://map.naver.com/p/search/${search}`} target="_blank" rel="noreferrer">네이버지도에서 등산 안내 찾기 ↗</a><a href="https://www.knps.or.kr/front/portal/safe/acsCtrList.do?menuNo=8000340" target="_blank" rel="noreferrer">국립공원 통제정보 확인 ↗</a></div><p className="mountain-weather-panel__caption">국립공원 외 산은 해당 지자체나 관리기관의 통제 안내를 따로 확인하세요.</p>
    <p className="mountain-weather-panel__caption">기상·조망 점수는 공식 안전 판정이 아닙니다. 코스·소요시간·통제 여부는 관리기관 안내를 확인하세요. 정상 부근 예보는 고도 보정 추정값이며 실제 현장과 다를 수 있습니다. 위치 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap 기여자</a>.</p>
  </section>;
}
