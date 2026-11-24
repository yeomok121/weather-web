// 커뮤니티 목록 한 줄: 분류·제목·글쓴이·시간 + 오른쪽 작은 사진 (마우스를 올리면 크게 미리보기)
// 줄을 누르면 글 전체(PostDetail)가 열립니다.
import { FiCamera, FiHeart } from 'react-icons/fi';
import { communityPhotoUrl } from '../communityApi';
import { KIND_LABEL, timeAgo } from '../lib/communityRules';

export default function PostRow({ post, now, onOpen }) {
  const photo = post.photos[0];
  return <li className={`fish-row ${post.category === '공지' ? 'notice' : ''}`}>
    <button type="button" className="fish-row-main" onClick={() => onOpen(post)}>
      <span className="fish-row-text">
        <span className="fish-row-title"><em className={`fish-post-kind k-${post.category}`}>{KIND_LABEL[post.category]}</em><b>{post.title}</b></span>
        <small>{post.author} · {timeAgo(post.created_at, now)}{post.updated_at ? ' · 수정됨' : ''}
          {post.category !== '공지' && <> · <FiHeart aria-label="공감" /> {post.like_count}</>}
          {post.photos.length > 1 && <> · <FiCamera aria-label="사진" /> {post.photos.length}</>}
          {'report_count' in post && post.report_count > 0 && ` · 신고 ${post.report_count}`}</small>
      </span>
      {photo && <span className="fish-row-thumb">
        <img src={communityPhotoUrl(photo.id)} alt="" loading="lazy" />
        <span className="fish-row-peek" aria-hidden="true"><img src={communityPhotoUrl(photo.id)} alt="" loading="lazy" /></span>
      </span>}
    </button>
  </li>;
}
