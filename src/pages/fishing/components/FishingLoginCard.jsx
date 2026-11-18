// 낚시 페이지 오른쪽 위 로그인 (날씨·산악 페이지와 같은 LoginCard, 안내 문구만 낚시용)
import { useApp } from '../../../shared/AppContext';
import LoginCard from '../../../shared/auth/LoginCard';

const FISHING_GUEST_INTRO = {
  icon: '🎣', title: '먼저 둘러보세요',
  text: '바다 날씨·낚시지수·물때는 가입 없이 볼 수 있어요.',
  perks: ['⭐ 자주 가는 낚시 포인트를 즐겨찾기', '☑️ 나만의 준비물 목록을 만들고 어느 기기에서든 불러오기'],
};

export default function FishingLoginCard() {
  const { loggedInUser, loginPrompt, handleLogin, handleLogout, handleUpdateUser, handleDeleteAccount, setIsSignUpOpen, setIsFindPasswordOpen } = useApp();
  return <div id="member-login" className="glass-card fish-login-card">
    <LoginCard loginPrompt={loginPrompt} guestIntro={FISHING_GUEST_INTRO}
      onSignUpClick={() => setIsSignUpOpen(true)} onFindPasswordClick={() => setIsFindPasswordOpen(true)}
      loggedInUser={loggedInUser} onLogin={handleLogin} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onDeleteAccount={handleDeleteAccount} />
  </div>;
}

