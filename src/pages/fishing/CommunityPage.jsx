// 낚시 커뮤니티 ( /fishing/community ) — 준비 중 안내와 예시 화면
// 실제 글쓰기·목록은 아직 없습니다. 예시 글은 lib/communitySamples.js
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiFlag, FiHeart, FiLock, FiMapPin, FiMessageSquare, FiWind } from 'react-icons/fi';
import './FishingPage.css';
import { COMMUNITY_SAMPLES } from './lib/communitySamples';

const PLANS = [
  { icon: FiMapPin, title: '포인트별 현장 소식', text: '추자도·영흥도처럼 포인트마다 조황과 바다 상황을 짧게 남겨요. 정확한 자리(좌표)는 받지 않아요.' },
  { icon: FiWind, title: '남길 때 바다 상태 자동 기록', text: '글을 쓴 시각의 파고·바람·물때가 함께 붙어서, 예보와 실제를 비교할 수 있어요.' },
  { icon: FiLock, title: '읽기는 누구나, 쓰기는 로그인', text: '스팸을 막기 위해 글쓰기는 로그인한 사람만 할 수 있어요.' },
  { icon: FiFlag, title: '공감 · 신고', text: '도움이 된 글에는 공감을, 문제가 있는 글은 신고할 수 있어요. 관리자가 확인해요.' },
  { icon: FiCamera, title: '사진은 다음 단계', text: '처음에는 글과 선택 버튼(조황·어종·바다 상태)으로 시작해요.' },
];

export default function CommunityPage() {
  return <main className="fishing-page fish-community-page">
    <Link className="fish-community-back" to="/fishing"><FiArrowLeft /> 바다 낚시로 돌아가기</Link>
    <section className="fish-panel">
      <div className="fish-panel-title"><FiMessageSquare /><div><h2>낚시 현장 소식 <span className="fish-community-soon">준비 중</span></h2>
        <p>다녀온 사람의 생생한 소식을 포인트별로 모아 보는 커뮤니티를 만들고 있어요.</p></div></div>
      <ul className="fish-community-plans">{PLANS.map(({ icon: Icon, title, text }) => <li key={title}><Icon aria-hidden="true" /><div><b>{title}</b><span>{text}</span></div></li>)}</ul>
    </section>

    <section className="fish-panel">
      <div className="fish-panel-title"><FiMessageSquare /><div><h2>이런 모습이 될 거예요</h2>
        <p>아래 글은 화면 예시예요. 실제 사용자가 쓴 글이 아닙니다.</p></div></div>
      <ul className="fish-community-list">{COMMUNITY_SAMPLES.map((post) => <li key={post.id}>
        <header><em className="kind">{post.kind}</em><span className="sample">예시</span><b>{post.title}</b></header>
        <small>{post.point} · {post.ago}{post.sea && ` · 남길 때 바다: ${post.sea}`}</small>
        <span className="likes"><FiHeart aria-hidden="true" /> {post.likes}</span>
      </li>)}</ul>
      <button type="button" className="fish-community-write" disabled title="준비 중이에요">글쓰기 (준비 중)</button>
    </section>
  </main>;
}
