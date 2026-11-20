// 커뮤니티 글 하나: 사진, (자랑이면) 어종·길이·포인트, 본문, 공감·신고·삭제
import { useState } from 'react';
import { FiFlag, FiHeart, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { communityPhotoUrl } from '../communityApi';
import { timeAgo } from '../lib/communityRules';

const LABEL = { 자랑: '조과 자랑', 팁: '낚시 팁', 공지: '공지' };

export default function PostCard({ post, now, onLike, onReport, onDelete, onOpenPhoto, compact = false }) {
  const [open, setOpen] = useState(!compact);
  const long = post.body.length > 220 || post.body.split('\n').length > 6;
  const canDelete = post.mine || 'report_count' in post; // report_count는 관리자에게만 옵니다
  return <article className={`fish-post ${post.category === '공지' ? 'notice' : ''}`}>
    <header>
      <em className={`fish-post-kind k-${post.category}`}>{LABEL[post.category] || post.category}</em>
      <h3>{post.title}</h3>
    </header>
    {post.photos.length > 0 && <div className={`fish-post-photos n${post.photos.length}`}>
      {post.photos.map((photo, i) => <button type="button" key={photo.id} onClick={() => onOpenPhoto(post, i)} aria-label={`사진 ${i + 1} 크게 보기`}>
        <img src={communityPhotoUrl(photo.id)} alt={`${post.title} 사진 ${i + 1}`} loading="lazy" width={photo.width} height={photo.height} />
      </button>)}
    </div>}
    {(post.species || post.length_cm || post.point_name) && <p className="fish-post-facts">
      {post.species && <b>{post.species}</b>}{post.length_cm != null && <b>{post.length_cm}cm</b>}
      {post.point_name && <span><FiMapPin aria-hidden="true" /> {post.point_name}</span>}
    </p>}
    {post.body && <p className={`fish-post-body ${long && !open ? 'clamped' : ''}`}>{post.body}</p>}
    {long && <button type="button" className="fish-post-more" onClick={() => setOpen((v) => !v)}>{open ? '접기' : '더 보기'}</button>}
    <footer>
      <span className="who">{post.author} · {timeAgo(post.created_at, now)}{'report_count' in post && post.report_count > 0 ? ` · 신고 ${post.report_count}` : ''}</span>
      {post.category !== '공지' && <button type="button" className={`like ${post.liked ? 'on' : ''}`} onClick={() => onLike(post)} aria-pressed={post.liked} aria-label="공감">
        <FiHeart aria-hidden="true" /> {post.like_count}</button>}
      {!post.mine && post.category !== '공지' && <button type="button" onClick={() => onReport(post)} aria-label="신고"><FiFlag aria-hidden="true" /> 신고</button>}
      {canDelete && <button type="button" onClick={() => onDelete(post)} aria-label="삭제"><FiTrash2 aria-hidden="true" /> 삭제</button>}
    </footer>
  </article>;
}
