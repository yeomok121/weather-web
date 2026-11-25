import { useState } from 'react';
import { MOUNTAINS_LIST } from '../mountain/mountains';
import { buildMountainCatalog } from '../mountain/lib/courseCatalog';
import CourseSource from '../mountain/components/CourseSource';

const catalog = buildMountainCatalog(MOUNTAINS_LIST).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
const courseCount = catalog.reduce((count, mountain) => count + mountain.courses.length, 0);
const groups = {
  registered: '코스 등록',
  reference: '참고 경로만',
  empty: '등록 자료 없음',
};

function statusOf(mountain) {
  if (mountain.courses.length) return 'registered';
  return mountain.course_references.length ? 'reference' : 'empty';
}

const totals = Object.keys(groups).map(status => ({
  status,
  count: catalog.filter(mountain => statusOf(mountain) === status).length,
}));

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours && `${hours}시간`, remainder && `${remainder}분`].filter(Boolean).join(' ') || '미제공';
}

export default function AdminMountainCourses() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const term = query.trim().toLocaleLowerCase('ko');
  const rows = catalog.filter(mountain =>
    (status === 'all' || statusOf(mountain) === status) &&
    [mountain.name, mountain.region, mountain.peak].some(value => value?.toLocaleLowerCase('ko').includes(term))
  );

  return <section className="admin-mountain-courses" aria-labelledby="admin-mountain-course-title">
    <header className="admin-section-heading">
      <div>
        <h2 id="admin-mountain-course-title">산·코스 등록 현황</h2>
        <p>산행 날씨에서 사용하는 국내 산 목록입니다. 산 이름을 펼쳐 등록 코스와 출처를 확인할 수 있어요.</p>
      </div>
    </header>
    <dl className="admin-mountain-courses__totals">
      <div><dt>전체 산</dt><dd>{catalog.length}곳</dd></div>
      <div><dt>등록 코스</dt><dd>{courseCount}개</dd></div>
      {totals.filter(({ count }) => count > 0).map(({ status, count }) =>
        <div key={status}><dt>{groups[status]}</dt><dd>{count}곳</dd></div>
      )}
    </dl>
    <div className="admin-mountain-courses__filters">
      <label>산 검색 <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="산 이름, 지역, 봉우리" /></label>
      <label>등록 상태 <select value={status} onChange={event => setStatus(event.target.value)}>
        <option value="all">전체</option>
        {totals.filter(({ count }) => count > 0).map(({ status }) => <option key={status} value={status}>{groups[status]}</option>)}
      </select></label>
    </div>
    <p className="admin-mountain-courses__count" role="status">{rows.length}곳 표시 · 가나다순</p>
    {rows.length ? <ul className="admin-mountain-courses__list">
      {rows.map(mountain => <li key={mountain.name}>
        <details>
          <summary>
            <span><strong>{mountain.name}</strong><small>{[mountain.region, mountain.peak, mountain.elevation > 0 && `${mountain.elevation}m`].filter(Boolean).join(' · ')}</small></span>
            <span className="admin-mountain-courses__badge" data-status={statusOf(mountain)}>
              {mountain.courses.length ? `코스 ${mountain.courses.length}개` : groups[statusOf(mountain)]}
            </span>
          </summary>
          <div className="admin-mountain-courses__details">
            {mountain.courses.length > 0 && <section aria-label="등록 코스">
              <h3>등록 코스</h3>
              <ul>
                {mountain.courses.map(course => <li key={course.name}>
                  <strong>{course.name}</strong>
                  <p>{course.distance || '거리 미제공'} · {formatDuration(course.time)} · 난이도 {course.diff || '미제공'}</p>
                  {course.trailhead && <p>들머리 {course.trailhead}</p>}
                  {course.provenance ? <CourseSource source={course.provenance} /> : <p>출처 미등록</p>}
                </li>)}
              </ul>
            </section>}
            {mountain.course_references.length > 0 && <section aria-label="참고 경로">
              <h3>참고 경로</h3>
              <ul>
                {mountain.course_references.map(reference => <li key={reference.name}>
                  <strong>{reference.name}</strong>
                  <CourseSource source={reference} />
                </li>)}
              </ul>
            </section>}
            {statusOf(mountain) === 'empty' && <p>등록된 코스와 참고 경로가 없습니다.</p>}
          </div>
        </details>
      </li>)}
    </ul> : <p>검색 조건에 맞는 산이 없습니다.</p>}
  </section>;
}
