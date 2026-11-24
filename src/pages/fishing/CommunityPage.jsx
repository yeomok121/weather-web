// 낚시 커뮤니티 ( /fishing/community ) — 사진으로 조과 자랑, 낚시 팁, 관리자 공지
//   community/useCommunityPosts.js  목록 상태     community/PostRow.jsx    목록 한 줄(제목 + 작은 사진, 올리면 미리보기)
//   community/PostDetail.jsx        글 전체 창    community/WriteForm.jsx  글쓰기·고치기
//   community/PhotoViewer.jsx       사진 크게 보기 · 주소 ?post=번호 로 글을 바로 엽니다.
//   lib/communityRules.js           글 확인(금어기·금지체장)·시간 표시
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import './FishingPage.css';
import { useApp } from '../../shared/AppContext';
import FishingLoginCard from './components/FishingLoginCard';
import { deleteCommunityPost, fetchCommunityPost, fetchMyRole, likeCommunityPost, reportCommunityPost } from './communityApi';
import { openFishingLogin } from './lib/loginPrompt';
import { useCommunityPosts } from './community/useCommunityPosts';
import PostRow from './community/PostRow';
import PostDetail from './community/PostDetail';
import WriteForm from './community/WriteForm';
import Comments from './community/Comments';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = Number(searchParams.get('post')) || null;
  const [fetched, setFetched] = useState(null); // 목록에 없는 글(?post=)을 따로 받은 것
  const [editing, setEditing] = useState(false);
  const opened = openId ? [...list.notices, ...list.posts].find((p) => p.id === openId) || (fetched?.id === openId ? fetched : null) : null;
  const openPost = (post) => { setEditing(false); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('post', String(post.id)); return next; }); };
  const closePost = () => { setEditing(false); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('post'); return next; }, { replace: true }); };

  // 링크로 들어왔는데 목록(최근 글)에 없으면 그 글만 받아 옵니다.
  useEffect(() => {
    if (!openId || list.loading || [...list.notices, ...list.posts].some((p) => p.id === openId)) return undefined;
    const controller = new AbortController();
    fetchCommunityPost(openId, { token, signal: controller.signal }).then(setFetched).catch(() => { if (!controller.signal.aborted) showToast?.('글을 찾을 수 없어요. 지워졌거나 숨겨진 글일 수 있어요.'); });
    return () => controller.abort();
  }, [openId, token, list.loading, list.notices, list.posts, showToast]);
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
    try { const change = await likeCommunityPost(token, post.id); list.update(post.id, change); if (fetched?.id === post.id) setFetched({ ...fetched, ...change }); } catch (e) { showToast?.(e.message); }
  };
  const report = async (post) => {
    if (!token) { needLogin('로그인하면 신고할 수 있어요.'); return; }
    const reason = window.prompt('신고 사유를 적어 주세요. (예: 광고, 욕설, 남의 사진, 금어기 어종)');
    if (reason === null) return;
    try { showToast?.((await reportCommunityPost(token, post.id, reason)).message); } catch (e) { showToast?.(e.message); }
  };
  const remove = async (post) => {
    if (!window.confirm(`'${post.title}' 글을 지울까요? 지운 글은 되돌릴 수 없어요.`)) return;
    try { await deleteCommunityPost(token, post.id); list.remove(post.id); closePost(); showToast?.('글을 지웠어요.'); } catch (e) { showToast?.(e.message); }
  };
  const handlers = { now, onLike: like, onReport: report, onDelete: remove, onEdit: () => setEditing(true), onOpenPhoto: (post, index) => setViewer({ post, index }) };

  return <main className="fishing-page fish-community-page">
    <Link className="fish-community-back" to="/fishing"><FiArrowLeft /> 바다 낚시로 돌아가기</Link>
    <div className="fish-top-row">
      <div className="fish-top-main">
        <section className="fish-panel fish-board">
          <div className="fish-panel-title fish-board-title"><FiMessageSquare /><div><h2>낚시 커뮤니티</h2><p>잡은 물고기 사진 자랑과 낚시 팁을 나누는 곳이에요.</p></div>
            {!writing && <button type="button" className="fish-board-write" onClick={startWriting}><FiEdit3 /> 글쓰기</button>}</div>

          {writing && <WriteForm token={token} isAdmin={isAdmin} onCancel={() => setWriting(false)}
            onCreated={(post) => { list.add(post); setWriting(false); showToast?.('글을 올렸어요.'); }} />}

          {list.notices.length > 0 && <ul className="fish-board-rows notices">{list.notices.map((post) => <PostRow key={post.id} post={post} now={now} onOpen={openPost} />)}</ul>}

          <div className="fish-board-filters" role="tablist" aria-label="글 분류">{FILTERS.map((f) => <button type="button" role="tab" key={f.id || 'all'}
            aria-selected={category === f.id} className={category === f.id ? 'on' : ''} onClick={() => setCategory(f.id)}>{f.label}</button>)}</div>

          {list.loading ? <p className="fish-board-status"><FiRefreshCw className="fish-spin" /> 글을 불러오고 있어요…</p>
            : list.error ? <p className="fish-board-status error">{list.error} <button type="button" onClick={list.reload}>다시 시도</button></p>
              : list.posts.length === 0 ? <p className="fish-board-status">아직 글이 없어요. 첫 {category === '팁' ? '낚시 팁' : '조과 자랑'}을 남겨 보세요!</p>
                : <ul className="fish-board-rows">{list.posts.map((post) => <PostRow key={post.id} post={post} now={now} onOpen={openPost} />)}</ul>}
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
    {opened && <PostDetail post={opened} onClose={closePost} {...handlers}
      comments={<Comments postId={opened.id} token={token} now={now} isPostAuthor={opened.mine} showToast={showToast}
        onRequireLogin={() => { closePost(); needLogin('로그인하면 댓글을 쓸 수 있어요.'); }}
        onCountChange={(count) => { list.update(opened.id, { comment_count: count }); if (fetched?.id === opened.id) setFetched({ ...fetched, comment_count: count }); }} />}>
      {editing && <WriteForm token={token} isAdmin={isAdmin} initial={opened} onCancel={() => setEditing(false)}
        onCreated={(post) => { list.update(post.id, post); if (fetched?.id === post.id) setFetched(post); setEditing(false); showToast?.('고친 내용을 저장했어요.'); }} />}
    </PostDetail>}
    {viewer && <PhotoViewer post={viewer.post} index={viewer.index} onChange={(index) => setViewer((v) => ({ ...v, index }))} onClose={() => setViewer(null)} />}
  </main>;
}
