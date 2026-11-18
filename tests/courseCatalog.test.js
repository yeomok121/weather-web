import test from 'node:test';
import assert from 'node:assert/strict';
import { MOUNTAINS_LIST } from '../src/pages/mountain/mountains.js';
import { buildMountainCatalog, enrichMountain, mergeMountainForecast } from '../src/pages/mountain/lib/courseCatalog.js';

test('all 50 mountains have usable courses or traceable official references offline', () => {
  const catalog = buildMountainCatalog(MOUNTAINS_LIST);
  assert.equal(catalog.length, 50);
  assert.equal(new Set(catalog.map(item => item.name)).size, 50);
  for (const mountain of catalog) {
    assert.ok(mountain.courses.length || mountain.course_references.length, mountain.name);
    assert.equal(mountain.course_available, mountain.courses.length > 0);
    for (const course of mountain.courses) {
      assert.ok(course.time > 0 && Number.parseFloat(course.distance) > 0);
      assert.ok(course.provenance?.source_url.startsWith('https://'), course.name);
      assert.ok(course.provenance.checked_on);
    }
  }
});

test('existing saved route indexes and calculation inputs remain unchanged', () => {
  for (const mountain of MOUNTAINS_LIST) {
    const enriched = enrichMountain(mountain);
    mountain.courses.forEach((course, index) => {
      const { provenance, ...actual } = enriched.courses[index];
      assert.deepEqual(actual, course);
      assert.match(provenance.status, /재확인/);
    });
    assert.deepEqual(enrichMountain(enriched), enriched);
  }
});

test('server weather-only flag cannot hide locally sourced routes or references', () => {
  const catalog = buildMountainCatalog(MOUNTAINS_LIST, [{name: '금오산', course_available: false}]);
  for (const name of ['금오산', '방태산']) {
    const local = catalog.find(item => item.name === name);
    const merged = mergeMountainForecast(local, { course_available: false, courses: [] });
    assert.equal(merged.course_available, local.course_available);
    assert.deepEqual(merged.courses, local.courses);
    assert.deepEqual(merged.course_references, local.course_references);
  }
  assert.equal(mergeMountainForecast(null, {course_available: true}).course_available, false);
});

test('new routes distinguish full official distances from round-trip conversions', () => {
  const catalog = buildMountainCatalog(MOUNTAINS_LIST);
  const newCourses = catalog.filter(item => !MOUNTAINS_LIST.some(old => old.name === item.name)).flatMap(item => item.courses);
  assert.equal(newCourses.length, 14);
  assert.equal(catalog.filter(item => item.course_available).length, 26);
  for (const course of newCourses) {
    assert.equal(course.diff, '미제공');
    assert.ok(course.provenance.basis);
    assert.ok(course.provenance.route);
  }
  const jangAn = catalog.find(item => item.name === '장안산').courses[0];
  assert.match(jangAn.provenance.status, /환산/);
  assert.match(jangAn.provenance.basis, /공식 제공값이 아니/);
  const samak = catalog.find(item => item.name === '삼악산').courses[0];
  assert.match(samak.provenance.basis, /종주/);
});
