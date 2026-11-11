import React, { useState } from 'react';
import { makeManualCourse, parseManualCourse } from '../lib/manualCourse.js';
import './ManualCourseForm.css';

export default function ManualCourseForm({ mountain, course, onApply }) {
  const match = parseManualCourse(course?.name)?.name.match(/^직접 입력: (.+?) · ([\d.]+)km · (\d+)분$/);
  const [name, setName] = useState(() => match?.[1] || '');
  const [distance, setDistance] = useState(() => match?.[2] || '');
  const [minutes, setMinutes] = useState(() => match?.[3] || '');
  const [error, setError] = useState('');
  const submit = event => {
    event.preventDefault();
    const value = makeManualCourse({name, distance, minutes});
    if (!value) { setError('코스 이름, 왕복 거리(0.1~100km), 총 소요시간(20~1440분)을 확인해 주세요.'); return; }
    setError(''); onApply(value);
  };
  return <section className="glass-card manual-course" aria-label="코스 직접 입력">
    <div><h3>{mountain} 코스 정보 {course ? '수정' : '입력'}</h3><p>이 산은 검증된 코스 자료가 없어 자동 제공할 수 없습니다. 공식 탐방 안내에서 확인한 왕복 거리와 총 소요시간을 입력하면 다른 산과 같은 일정·준비 화면을 사용할 수 있어요.</p></div>
    <form onSubmit={submit} className="manual-course__form">
      <label>코스 이름<input required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="예: 주차장 ↔ 정상" /></label>
      <label>왕복 거리 (km)<input required type="number" min="0.1" max="100" step="0.01" value={distance} onChange={event => setDistance(event.target.value)} placeholder="예: 8" /></label>
      <label>총 소요시간 (분)<input required type="number" min="20" max="1440" step="1" value={minutes} onChange={event => setMinutes(event.target.value)} placeholder="예: 240" /></label>
      <button type="submit">{course ? '입력 정보 적용' : '일정에 적용'}</button>
    </form>
    {error && <p className="manual-course__error" role="alert">{error}</p>}
    <p className="manual-course__note"><a href={`https://map.naver.com/p/search/${encodeURIComponent(`${mountain} 등산 안내`)}`} target="_blank" rel="noreferrer">등산 안내 검색 ↗</a> · 위치 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap 기여자</a></p>
    <p className="manual-course__note">직접 입력한 코스는 서비스가 검증하지 않았습니다. 소요시간은 보통 속도 기준으로 적용되며, 경로·난이도·통제 여부와 실제 하산 가능 시각은 출발 전 확인하세요.</p>
  </section>;
}
