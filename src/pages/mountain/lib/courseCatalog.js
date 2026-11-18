import sources from '../data/courseSources.json' with { type: 'json' };
import additionalMountains from '../data/additionalMountains.json' with { type: 'json' };

// Keep legacy course order: saved plans refer to their index and name.
export function enrichMountain(mountain) {
  const entry = sources[mountain.name];
  const original = (mountain.courses || []).map(course => ({
    ...course, provenance: course.provenance || entry?.legacy?.[course.name],
  }));
  const names = new Set(original.map(course => course.name));
  const courses = [...original, ...(entry?.courses || []).filter(course => !names.has(course.name))];
  return { ...mountain, courses, course_available: courses.length > 0,
    course_references: entry?.references || [] };
}

export function buildMountainCatalog(originals, remote = []) {
  const all = new Map([...originals, ...additionalMountains].map(mountain => [mountain.name, mountain]));
  for (const row of remote) {
    if (!all.has(row?.name)) continue;
    const local = all.get(row.name);
    all.set(row.name, { ...row, ...local });
  }
  return [...all.values()].map(enrichMountain);
}

export function mergeMountainForecast(local, remote) {
  if (!remote) return local;
  return { ...local, ...remote, courses: local?.courses || [],
    course_available: !!local?.courses?.length,
    course_references: local?.course_references || [] };
}
