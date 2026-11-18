// 준비물 안내 등에서 '로그인하기'를 누르면 오른쪽 위 로그인 칸(#member-login)을 열고 그쪽으로 이동합니다.
export function openFishingLogin(promptLogin) {
  promptLogin?.();
  document.getElementById('member-login')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
