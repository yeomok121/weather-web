// 낚시 페이지 오른쪽(로그인 아래): 커뮤니티 미리보기 — 아직 준비 중이라 '예시' 글만 보여주고 바로가기를 둡니다.
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiMessageSquare } from 'react-icons/fi';
import { COMMUNITY_PATH, COMMUNITY_SAMPLES } from '../lib/communitySamples';

export default function CommunityPreview() {
  return <section className="glass-card fish-community-card" aria-label="낚시 현장 소식 미리보기">
    <header><FiMessageSquare aria-hidden="true" /><b>낚시 현장 소식</b><span className="soon">준비 중</span></header>
    <ul>{COMMUNITY_SAMPLES.map((post) => <li key={post.id}>
      <p title={post.title}><em className="kind">{post.kind}</em><span className="sample">예시</span> {post.title}</p>
      <small>{post.point} · {post.ago} · <FiHeart aria-label="공감" /> {post.likes}</small>
    </li>)}</ul>
    <Link className="fish-community-go" to={COMMUNITY_PATH}>커뮤니티 바로가기 <FiArrowRight aria-hidden="true" /></Link>
  </section>;
}
