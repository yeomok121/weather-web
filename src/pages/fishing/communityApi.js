// 낚시 커뮤니티 서버 요청 (백엔드 app/routers/community.py)
import { API } from '../../shared/lib/config';
import { requestJson } from '../../shared/lib/apiClient';
import { withRetry } from './lib/resilience';

export const COMMUNITY_PATH = '/fishing/community';

const auth = (token) => (token ? { Authorization: `Bearer ${token}` } : {});
const json = (token) => ({ 'Content-Type': 'application/json', ...auth(token) });

export function fetchCommunityPosts({ category = '', before = null, limit = 20, token = '', signal } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (category) query.set('category', category);
  if (before) query.set('before', String(before));
  return withRetry(() => requestJson(`/api/community/posts?${query}`, { signal, timeoutMs: 30000, headers: auth(token) }), { signal });
}

export const createCommunityPost = (token, post) => requestJson('/api/community/posts', { method: 'POST', timeoutMs: 60000, headers: json(token), body: JSON.stringify(post) });
export const deleteCommunityPost = (token, id) => requestJson(`/api/community/posts/${id}`, { method: 'DELETE', timeoutMs: 20000, headers: auth(token) });
export const likeCommunityPost = (token, id) => requestJson(`/api/community/posts/${id}/like`, { method: 'POST', timeoutMs: 20000, headers: auth(token) });
export const reportCommunityPost = (token, id, reason) => requestJson(`/api/community/posts/${id}/report`, { method: 'POST', timeoutMs: 20000, headers: json(token), body: JSON.stringify({ reason }) });
export const fetchMyRole = (token, { signal } = {}) => requestJson('/api/users/me/role', { signal, timeoutMs: 20000, headers: auth(token) });
export const communityPhotoUrl = (id) => `${API}/api/community/photos/${id}`;
