// 낚시 페이지 오른쪽(로그인 아래): 커뮤니티 최신 글 미리보기 (공지 1개 + 최신 글) 와 바로가기
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiMessageSquare } from 'react-icons/fi';
import { COMMUNITY_PATH, communityPhotoUrl, fetchCommunityPosts } from '../communityApi';
import { timeAgo } from '../lib/communityRules';

const LABEL = { 자랑: '자랑', 팁: '팁', 공지: '공지' };

export default function CommunityPreview() {
  const [state, setState] = useState({ status: 'loading', items: [] });
  const [now] = useState(() => Date.now());
  useEffect(() => {
    const controller = new AbortController();
    fetchCommunityPosts({ limit: 3, signal: controller.signal })
      .then((body) => setState({ status: 'ready', items: [...(body.notices || []).slice(0, 1), ...(body.posts || [])].slice(0, 3) }))
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'failed', items: [] }); });
    return () => controller.abort();
  }, []);

  return <section className="glass-card fish-community-card" aria-label="낚시 커뮤니티 최신 글">
    <header><FiMessageSquare aria-hidden="true" /><b>낚시 커뮤니티</b><span className="soon">자랑 · 팁</span></header>
    {state.status === 'loading' ? <p className="fish-community-empty">최신 글을 불러오고 있어요…</p>
      : state.status === 'failed' ? <p className="fish-community-empty">글을 불러오지 못했어요.</p>
        : state.items.length === 0 ? <p className="fish-community-empty">아직 글이 없어요. 첫 조과를 자랑해 보세요!</p>
          : <ul>{state.items.map((post) => <li key={post.id}>
            <Link to={`${COMMUNITY_PATH}?post=${post.id}`}>
              {post.photos[0] && <img src={communityPhotoUrl(post.photos[0].id)} alt="" loading="lazy" />}
              <span>
                <p><em className={`kind k-${post.category}`}>{LABEL[post.category]}</em> {post.title}</p>
                <small>{post.author} · {timeAgo(post.created_at, now)}{post.category !== '공지' && <> · <FiHeart aria-label="공감" /> {post.like_count}</>}</small>
              </span>
            </Link>
          </li>)}</ul>}
    <Link className="fish-community-go" to={COMMUNITY_PATH}>커뮤니티 바로가기 <FiArrowRight aria-hidden="true" /></Link>
  </section>;
}
