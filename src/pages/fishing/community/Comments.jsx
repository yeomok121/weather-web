// 글 창 아래 댓글: 읽기는 누구나, 쓰기는 로그인. 글쓴이는 마음에 드는 남의 댓글에 하트를 누를 수 있어요.
import { useEffect, useState } from 'react';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { addComment, deleteComment, fetchComments, heartComment } from '../communityApi';
import { timeAgo } from '../lib/communityRules';

const MAX = 500;

export default function Comments({ postId, token, now, isPostAuthor, onCountChange, onRequireLogin, showToast }) {
  const [state, setState] = useState({ key: null, comments: [], error: '' });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const key = `${postId}|${token}`;

  useEffect(() => {
    const controller = new AbortController();
    fetchComments(postId, { token, signal: controller.signal })
      .then((body) => setState({ key, comments: body.comments || [], error: '' }))
      .catch((e) => { if (!controller.signal.aborted) setState({ key, comments: [], error: e.message || '댓글을 불러오지 못했어요.' }); });
    return () => controller.abort();
  }, [key, postId, token]);

  const apply = (body) => { setState({ key, comments: body.comments, error: '' }); onCountChange?.(body.comments.length); };
  const run = async (action) => { setBusy(true); try { apply(await action()); return true; } catch (e) { showToast?.(e.message); return false; } finally { setBusy(false); } };
  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    if (await run(() => addComment(token, postId, text))) setText('');
  };
  const loading = state.key !== key;

  return <section className="fish-comments" aria-label="댓글">
    <h4>댓글 {loading ? '' : state.comments.length}</h4>
    {loading ? <p className="fish-comments-empty">댓글을 불러오고 있어요…</p>
      : state.error ? <p className="fish-comments-empty">{state.error}</p>
        : state.comments.length === 0 ? <p className="fish-comments-empty">아직 댓글이 없어요. 첫 댓글을 남겨 보세요.</p>
          : <ul>{state.comments.map((c) => <li key={c.id} className={c.hearted ? 'hearted' : ''}>
            <div className="fish-comment-head">
              <b>{c.author}</b>{c.by_post_author && <span className="badge">글쓴이</span>}
              <small>{timeAgo(c.created_at, now)}</small>
              {c.hearted && <span className="heart-badge"><FiHeart aria-hidden="true" /> 글쓴이가 좋아해요</span>}
            </div>
            <p>{c.body}</p>
            <div className="fish-comment-actions">
              {c.can_heart && <button type="button" className={c.hearted ? 'on' : ''} aria-pressed={c.hearted} disabled={busy}
                onClick={() => run(() => heartComment(token, c.id))} title={c.hearted ? '하트 취소' : '이 댓글이 마음에 들어요'}>
                <FiHeart aria-hidden="true" /> {c.hearted ? '하트 취소' : '하트'}</button>}
              {c.can_delete && <button type="button" disabled={busy} onClick={() => window.confirm('댓글을 지울까요?') && run(() => deleteComment(token, c.id))}>
                <FiTrash2 aria-hidden="true" /> 삭제</button>}
            </div>
          </li>)}</ul>}
    {isPostAuthor && state.comments.some((c) => c.can_heart) && <p className="fish-comments-hint">마음에 드는 댓글에 하트를 눌러 보세요. 모두에게 '글쓴이가 좋아해요'로 보여요.</p>}
    {token ? <form className="fish-comment-form" onSubmit={submit}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX} rows={2} placeholder="댓글을 남겨 보세요" aria-label="댓글" />
      <div><small>{text.length}/{MAX}</small><button type="submit" disabled={busy || !text.trim()}>등록</button></div>
    </form> : <button type="button" className="fish-comment-login" onClick={onRequireLogin}>로그인하고 댓글 쓰기</button>}
  </section>;
}
