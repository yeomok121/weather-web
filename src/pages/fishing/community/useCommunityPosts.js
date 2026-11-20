// 커뮤니티 글 목록 상태: 분류·로그인(내 공감·내 글 표시)이 바뀌면 처음부터 다시 받습니다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCommunityPosts } from '../communityApi';

const EMPTY = { notices: [], posts: [], nextBefore: null };

export function useCommunityPosts({ category, token }) {
  const key = `${category}|${token}`;
  const [state, setState] = useState({ key: null, ...EMPTY, error: '', loadingMore: false });
  const [reloadTick, setReloadTick] = useState(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    fetchCommunityPosts({ category, token, signal: controller.signal })
      .then((body) => setState({ key, notices: body.notices || [], posts: body.posts || [], nextBefore: body.next_before, error: '', loadingMore: false }))
      .catch((error) => { if (!controller.signal.aborted) setState({ key, ...EMPTY, error: error.message || '글을 불러오지 못했어요.', loadingMore: false }); });
    return () => controller.abort();
  }, [key, category, token, reloadTick]);

  const ready = state.key === key;
  const loadMore = useCallback(() => {
    if (!state.nextBefore || state.loadingMore) return;
    setState((prev) => ({ ...prev, loadingMore: true }));
    fetchCommunityPosts({ category, token, before: state.nextBefore })
      .then((body) => setState((prev) => ({ ...prev, posts: [...prev.posts, ...(body.posts || [])], nextBefore: body.next_before, loadingMore: false })))
      .catch(() => setState((prev) => ({ ...prev, loadingMore: false })));
  }, [category, token, state.nextBefore, state.loadingMore]);

  const update = (id, change) => setState((prev) => ({
    ...prev,
    posts: prev.posts.map((p) => (p.id === id ? { ...p, ...change } : p)),
    notices: prev.notices.map((p) => (p.id === id ? { ...p, ...change } : p)),
  }));
  const remove = (id) => setState((prev) => ({ ...prev, posts: prev.posts.filter((p) => p.id !== id), notices: prev.notices.filter((p) => p.id !== id) }));
  const add = (post) => setState((prev) => (post.category === '공지' ? { ...prev, notices: [post, ...prev.notices] }
    : (!category || category === post.category) ? { ...prev, posts: [post, ...prev.posts] } : prev));

  return {
    loading: !ready, error: ready ? state.error : '', notices: ready ? state.notices : [], posts: ready ? state.posts : [],
    hasMore: ready && Boolean(state.nextBefore), loadingMore: state.loadingMore,
    loadMore, reload: () => setReloadTick((n) => n + 1), update, remove, add,
  };
}
