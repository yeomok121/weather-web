import React from 'react';
import './CourseSource.css';

export default function CourseSource({ source }) {
  if (!source) return null;
  return <details className="course-source">
    <summary>코스 출처 · {source.status}</summary>
    <div>
      {source.route && <p>경로: {source.route}</p>}
      {source.basis && <p>거리·시간 기준: {source.basis}</p>}
      <p><a href={source.source_url} target="_blank" rel="noreferrer">{source.source_name} ↗</a> · 자료 대조 {source.checked_on}</p>
      <p>{source.note}</p>
    </div>
  </details>;
}
