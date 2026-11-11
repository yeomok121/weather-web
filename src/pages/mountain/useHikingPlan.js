// 산악 페이지: 산행 계획 선택값(날짜·코스·속도·출발 시각·준비물)과 직접 입력 코스.
// selectedDateIdx(주간 예보 날짜 선택)는 날씨 페이지에서도 사용합니다.
import { useState } from 'react';
import { readStoredJson, writeStoredJson } from '../../shared/lib/browserStorage';
import { parseManualCourse } from './lib/manualCourse.js';

export function useHikingPlan() {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [paceType, setPaceType] = useState('normal');
  const [departureOffsetHours, setDepartureOffsetHours] = useState(0);
  const [planReferenceAt, setPlanReferenceAt] = useState(() => Date.now());
  const [restoredDepartureAt, setRestoredDepartureAt] = useState(null);
  const [customGearList, setCustomGearList] = useState([]);

  // 다른 지역·산의 예보를 새로 불러오면 선택값을 처음 상태로 되돌립니다.
  const resetPlan = () => {
    setSelectedDateIdx(0);
    setSelectedCourseIdx(0);
    setDepartureOffsetHours(0); setRestoredDepartureAt(null); setPlanReferenceAt(Date.now());
  };

  return {
    selectedDateIdx, setSelectedDateIdx, selectedCourseIdx, setSelectedCourseIdx,
    paceType, setPaceType, departureOffsetHours, setDepartureOffsetHours,
    planReferenceAt, setPlanReferenceAt, restoredDepartureAt, setRestoredDepartureAt,
    customGearList, setCustomGearList,
    resetPlan,
  };
}

// 산악 페이지: 코스 정보가 없는 산에 사용자가 직접 입력한 코스 (브라우저에 저장)
export function useManualCourse({ loggedInUser, mountainInfo }) {
  const [manualCourses, setManualCourses] = useState({});
  const manualCourseKey = (name) => `hiking_manual_course:${loggedInUser?.id || 'guest'}:${name}`;
  const manualKey = mountainInfo?.name ? manualCourseKey(mountainInfo.name) : '';
  const manualCourse = manualKey ? (manualCourses[manualKey] || parseManualCourse(readStoredJson(manualKey, null))) : null;
  const effectiveMountainInfo = mountainInfo?.course_available === false && manualCourse
    ? { ...mountainInfo, course_available: true, courses: [manualCourse], manual_course: true } : mountainInfo;
  const saveManualCourse = (name, course) => {
    const key = manualCourseKey(name);
    writeStoredJson(key, course.name);
    setManualCourses(previous => ({ ...previous, [key]: course }));
  };

  return { manualCourse, effectiveMountainInfo, saveManualCourse };
}
