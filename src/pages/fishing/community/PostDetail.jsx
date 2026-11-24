// 커뮤니티 글 전체 (창으로 열림): 사진(작게, 누르면 크게), 어종·길이·포인트, 본문, 공감·신고·고치기·삭제
import { useEffect } from 'react';
import { FiEdit2, FiFlag, FiHeart, FiMapPin, FiTrash2, FiX } from 'react-icons/fi';
import { communityPhotoUrl } from '../communityApi';
import { KIND_LABEL, timeAgo } from '../lib/communityRules';

export default function PostDetail({ post, now, onClose, onLike, onReport, onDelete, onEdit, onOpenPhoto, children }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const canDelete = post.mine || 'report_count' in post; // report_count는 관리자에게만 옵니다
  return <div className="fish-modal-backdrop" role="dialog" aria-modal="true" aria-label={post.title} onClick={onClose}>
    <div className="fish-modal-frame" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="fish-modal-close" onClick={onClose} aria-label="닫기"><FiX /></button>
      <article className={`fish-modal fish-post ${post.category === '공지' ? 'notice' : ''}`}>
        {children || <>
          <header><em className={`fish-post-kind k-${post.category}`}>{KIND_LABEL[post.category]}</em><h3>{post.title}</h3></header>
          <p className="fish-post-who">{post.author} · {timeAgo(post.created_at, now)}{post.updated_at ? ` · 수정됨 ${timeAgo(post.updated_at, now)}` : ''}</p>
          {post.photos.length > 0 && <div className={`fish-post-photos n${post.photos.length}`}>
            {post.photos.map((photo, i) => <button type="button" key={photo.id} onClick={() => onOpenPhoto(post, i)} aria-label={`사진 ${i + 1} 크게 보기`}>
              <img src={communityPhotoUrl(photo.id)} alt={`${post.title} 사진 ${i + 1}`} width={photo.width} height={photo.height} />
            </button>)}
          </div>}
          {(post.species || post.length_cm || post.point_name) && <p className="fish-post-facts">
            {post.species && <b>{post.species}</b>}{post.length_cm != null && <b>{post.length_cm}cm</b>}
            {post.point_name && <span><FiMapPin aria-hidden="true" /> {post.point_name}</span>}
          </p>}
          {post.body && <p className="fish-post-body">{post.body}</p>}
          <footer>
            <span className="who" />
            {post.category !== '공지' && <button type="button" className={`like ${post.liked ? 'on' : ''}`} onClick={() => onLike(post)} aria-pressed={post.liked} aria-label="공감">
              <FiHeart aria-hidden="true" /> {post.like_count}</button>}
            {!post.mine && post.category !== '공지' && <button type="button" onClick={() => onReport(post)}><FiFlag aria-hidden="true" /> 신고</button>}
            {post.mine && <button type="button" onClick={() => onEdit(post)}><FiEdit2 aria-hidden="true" /> 고치기</button>}
            {canDelete && <button type="button" onClick={() => onDelete(post)}><FiTrash2 aria-hidden="true" /> 삭제</button>}
          </footer>
        </>}
      </article>
    </div>
  </div>;
}
