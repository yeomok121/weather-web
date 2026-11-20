// 커뮤니티 사진 크게 보기 (Esc·바깥 누르면 닫힘, ←/→로 넘김)
import { useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { communityPhotoUrl } from '../communityApi';

export default function PhotoViewer({ post, index, onChange, onClose }) {
  const count = post.photos.length;
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && count > 1) onChange((index + 1) % count);
      if (event.key === 'ArrowLeft' && count > 1) onChange((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onChange, onClose]);
  return <div className="fish-modal-backdrop fish-photo-viewer" role="dialog" aria-modal="true" aria-label={`${post.title} 사진`} onClick={onClose}>
    <figure onClick={(event) => event.stopPropagation()}>
      <img src={communityPhotoUrl(post.photos[index].id)} alt={`${post.title} 사진 ${index + 1}`} />
      <figcaption>{post.title} · {index + 1}/{count}</figcaption>
      <button type="button" className="close" onClick={onClose} aria-label="닫기"><FiX /></button>
      {count > 1 && <>
        <button type="button" className="prev" onClick={() => onChange((index - 1 + count) % count)} aria-label="이전 사진"><FiChevronLeft /></button>
        <button type="button" className="next" onClick={() => onChange((index + 1) % count)} aria-label="다음 사진"><FiChevronRight /></button>
      </>}
    </figure>
  </div>;
}
