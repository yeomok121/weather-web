// 낚시 커뮤니티: 글쓰기 확인(법령 포함)과 시간 표시 — 화면과 분리해 시험할 수 있게
import { findSpecies, isClosedNow } from './speciesRules.js';

export const CATEGORIES = [
  { id: '자랑', label: '조과 자랑', hint: '잡은 물고기 사진을 자랑해요 (사진 필수)' },
  { id: '팁', label: '낚시 팁', hint: '채비·포인트 공략·안전 팁을 나눠요' },
];
export const KIND_LABEL = { 자랑: '조과 자랑', 팁: '낚시 팁', 공지: '공지' };
export const LIMITS = { title: 60, body: 2000, photos: 3 };

// 받침에 맞춘 '은/는' (감성돔은 · 볼락은 · 농어는)
const topic = (name) => { const code = name.charCodeAt(name.length - 1) - 0xac00; return `${name}${code >= 0 && code < 11172 && code % 28 ? '은' : '는'}`; };

// 올리기 전 확인. 문제가 있으면 사용자용 문구, 없으면 ''.
// 금지체장 이하이거나 금어기인 어종은 '자랑' 글로 올릴 수 없게 막습니다. (수산자원관리법 시행령 별표 1·2)
export function draftProblem(draft, { now = Date.now(), isAdmin = false } = {}) {
  const category = draft.category;
  if (category === '공지' ? !isAdmin : !CATEGORIES.some((c) => c.id === category)) return '분류를 골라 주세요.';
  const title = String(draft.title || '').trim();
  if (!title) return '제목을 입력해 주세요.';
  if (title.length > LIMITS.title) return `제목은 ${LIMITS.title}자까지 쓸 수 있어요.`;
  const body = String(draft.body || '').trim();
  if (category !== '자랑' && !body) return '내용을 입력해 주세요.';
  if (body.length > LIMITS.body) return `내용은 ${LIMITS.body}자까지 쓸 수 있어요.`;
  const photos = draft.photos || [];
  if (photos.length > LIMITS.photos) return `사진은 ${LIMITS.photos}장까지 올릴 수 있어요.`;
  if (category === '자랑') {
    if (!photos.length) return '자랑 글에는 사진을 한 장 이상 올려 주세요.';
    const species = findSpecies(String(draft.species || '').trim());
    const length = draft.length_cm === '' || draft.length_cm == null ? null : Number(draft.length_cm);
    if (length != null && !(length > 0 && length < 500)) return '길이를 확인해 주세요.';
    if (species && isClosedNow(species, now)) return `${topic(species.name)} 지금 금어기라 자랑 글로 올릴 수 없어요. 잡았다면 놓아주세요.`;
    if (species?.minSizeCm != null && length != null && length <= species.minSizeCm) {
      return `${topic(species.name)} 전장 ${species.minSizeCm}cm 이하는 잡으면 안 돼요(금지체장). 놓아주세요.`;
    }
  }
  return '';
}

// "방금 · 5분 전 · 3시간 전 · 어제 · 11/18"
export function timeAgo(iso, now = Date.now()) {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return '';
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  if (hours < 48) return '어제';
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(time).replace(/\.\s?/g, '/').replace(/\/$/, '');
}
