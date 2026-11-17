// 낚시 페이지: 새벽·해질녘 시각 (일출·일몰과 시민박명, 선택한 위치 기준 계산값)
import { useEffect, useState } from 'react';
import { FiSunrise, FiSunset } from 'react-icons/fi';
import { fishingLightWindows } from '../lib/sunTimes';

export default function SunPanel({ area }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const windows = fishingLightWindows(now, area.lat, area.lon);
  if (!windows) return null;
  const { today, nextMorning, morningIsToday } = windows;
  return <article className="fish-panel fish-sun-panel">
    <div className="fish-panel-title"><FiSunrise /><div><h2>새벽·해질녘</h2><p>{area.place} 기준 계산값 · 박명은 해가 지평선 아래 6°까지인 밝은 시간</p></div></div>
    <div className="fish-sun-grid">
      <div className="fish-sun-item"><span><FiSunrise /> {morningIsToday ? '오늘' : '내일'} 새벽</span><b>{nextMorning.dawn} → {nextMorning.sunrise}</b><small>밝아지기 시작 → 일출</small></div>
      <div className="fish-sun-item"><span><FiSunset /> 오늘 해질녘</span><b>{today.sunset} → {today.dusk}</b><small>일몰 → 어두워짐</small></div>
    </div>
    <p className="fish-tide-note">해 뜨기 전후와 해 질 무렵은 많은 낚시인이 노리는 시간대입니다. 어두울 때 이동은 헤드랜턴과 동행자를 챙기세요.</p>
  </article>;
}
