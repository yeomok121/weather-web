// 낚시 커뮤니티 ( /fishing/community ) — 사진으로 조과 자랑, 낚시 팁, 관리자 공지
//   community/useCommunityPosts.js  목록 상태     community/PostCard.jsx  글 하나
//   community/WriteForm.jsx         글쓰기        community/PhotoViewer.jsx 사진 크게 보기
//   lib/communityRules.js           글 확인(금어기·금지체장)·시간 표시
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import './FishingPage.css';
import { useApp } from '../../shared/AppContext';
import FishingLoginCard from './components/FishingLoginCard';
import { deleteCommunityPost, fetchMyRole, likeCommunityPost, reportCommunityPost } from './communityApi';
import { openFishingLogin } from './lib/loginPrompt';
import { useCommunityPosts } from './community/useCommunityPosts';
import PostCard from './community/PostCard';
import WriteForm from './community/WriteForm';
import PhotoViewer from './community/PhotoViewer';

const FILTERS = [{ id: '', label: '전체' }, { id: '자랑', label: '조과 자랑' }, { id: '팁', label: '낚시 팁' }];
const NOTICE_ROLES = ['superadmin', 'notice_manager'];

export default function CommunityPage() {
  const { loggedInUser, showToast, promptLogin } = useApp();
  const token = loggedInUser?.accessToken || '';
  const [category, setCategory] = useState('');
  const [writing, setWriting] = useState(false);
  const [viewer, setViewer] = useState(null); // { post, index }
  const [roleState, setRoleState] = useState({ token: '', role: 'member' });
  const [now] = useState(() => Date.now());
  const list = useCommunityPosts({ category, token });
  const isAdmin = roleState.token === token && NOTICE_ROLES.includes(roleState.role);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    fetchMyRole(token, { signal: controller.signal }).then((body) => setRoleState({ token, role: body.role || 'member' })).catch(() => {});
    return () => controller.abort();
  }, [token]);

  const needLogin = (message) => { showToast?.(message); openFishingLogin(promptLogin); };
  const startWriting = () => (token ? setWriting(true) : needLogin('로그인하면 글을 쓸 수 있어요.'));
  const like = async (post) => {
    if (!token) { needLogin('로그인하면 공감할 수 있어요.'); return; }
    try { list.update(post.id, await likeCommunityPost(token, post.id)); } catch (e) { showToast?.(e.message); }
  };
  const report = async (post) => {
    if (!token) { needLogin('로그인하면 신고할 수 있어요.'); return; }
    const reason = window.prompt('신고 사유를 적어 주세요. (예: 광고, 욕설, 남의 사진, 금어기 어종)');
    if (reason === null) return;
    try { showToast?.((await reportCommunityPost(token, post.id, reason)).message); } catch (e) { showToast?.(e.message); }
  };
  const remove = async (post) => {
    if (!window.confirm(`'${post.title}' 글을 지울까요? 지운 글은 되돌릴 수 없어요.`)) return;
    try { await deleteCommunityPost(token, post.id); list.remove(post.id); showToast?.('글을 지웠어요.'); } catch (e) { showToast?.(e.message); }
  };
  const handlers = { now, onLike: like, onReport: report, onDelete: remove, onOpenPhoto: (post, index) => setViewer({ post, index }) };

  return <main className="fishing-page fish-community-page">
    <Link className="fish-community-back" to="/fishing"><FiArrowLeft /> 바다 낚시로 돌아가기</Link>
    <div className="fish-top-row">
      <div className="fish-top-main">
        <section className="fish-panel fish-board">
          <div className="fish-panel-title fish-board-title"><FiMessageSquare /><div><h2>낚시 커뮤니티</h2><p>잡은 물고기 사진 자랑과 낚시 팁을 나누는 곳이에요.</p></div>
            {!writing && <button type="button" className="fish-board-write" onClick={startWriting}><FiEdit3 /> 글쓰기</button>}</div>

          {writing && <WriteForm token={token} isAdmin={isAdmin} onCancel={() => setWriting(false)}
            onCreated={(post) => { list.add(post); setWriting(false); showToast?.('글을 올렸어요.'); }} />}

          {list.notices.length > 0 && <div className="fish-board-notices">{list.notices.map((post) => <PostCard key={post.id} post={post} compact {...handlers} />)}</div>}

          <div className="fish-board-filters" role="tablist" aria-label="글 분류">{FILTERS.map((f) => <button type="button" role="tab" key={f.id || 'all'}
            aria-selected={category === f.id} className={category === f.id ? 'on' : ''} onClick={() => setCategory(f.id)}>{f.label}</button>)}</div>

          {list.loading ? <p className="fish-board-status"><FiRefreshCw className="fish-spin" /> 글을 불러오고 있어요…</p>
            : list.error ? <p className="fish-board-status error">{list.error} <button type="button" onClick={list.reload}>다시 시도</button></p>
              : list.posts.length === 0 ? <p className="fish-board-status">아직 글이 없어요. 첫 {category === '팁' ? '낚시 팁' : '조과 자랑'}을 남겨 보세요!</p>
                : <div className="fish-board-list">{list.posts.map((post) => <PostCard key={post.id} post={post} compact {...handlers} />)}</div>}
          {list.hasMore && <button type="button" className="fish-board-more" onClick={list.loadMore} disabled={list.loadingMore}>{list.loadingMore ? '불러오는 중…' : '글 더 보기'}</button>}
        </section>
      </div>
      <div className="fish-top-side">
        <FishingLoginCard />
        <section className="glass-card fish-board-rules">
          <b>커뮤니티 규칙</b>
          <ul>
            <li>조과 자랑과 낚시 팁만 올려 주세요.</li>
            <li>금지체장 이하·금어기 어종은 자랑할 수 없어요. 놓아주세요.</li>
            <li>남의 사진, 광고, 욕설은 신고해 주세요. 5명이 신고하면 숨겨져요.</li>
            <li>정확한 낚시 자리(좌표)나 개인정보는 적지 마세요.</li>
          </ul>
        </section>
      </div>
    </div>
    {viewer && <PhotoViewer post={viewer.post} index={viewer.index} onChange={(index) => setViewer((v) => ({ ...v, index }))} onClose={() => setViewer(null)} />}
  </main>;
}
