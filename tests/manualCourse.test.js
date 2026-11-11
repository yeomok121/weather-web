import test from 'node:test';
import assert from 'node:assert/strict';
import { makeManualCourse, parseManualCourse } from '../src/pages/mountain/lib/manualCourse.js';
test('manual courses round trip through saved course name', () => {
 const course = makeManualCourse({name:'휴양림 왕복', distance:'8.25', minutes:'240'});
 assert.deepEqual(parseManualCourse(course.name), course);
 assert.equal(course.diff, '미확인');
});
test('reject invalid or misleading manual input', () => {
 for (const row of [{name:'',distance:8,minutes:240}, {name:'A·B',distance:8,minutes:240}, {name:'A',distance:0,minutes:240}, {name:'A',distance:8,minutes:0}, {name:'A',distance:'1e2',minutes:30}, {name:'A',distance:8,minutes:1441}]) assert.equal(makeManualCourse(row), null);
 assert.equal(parseManualCourse('일반 코스'), null);
});
