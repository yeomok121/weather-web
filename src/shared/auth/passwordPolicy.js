export const newPasswordHint = '15자 이상 · UTF-8 기준 72바이트 이하 · 아이디 포함 금지';

export function newPasswordError(username, password) {
  if ([...password].length < 15 || new TextEncoder().encode(password).length > 72) {
    return '새 비밀번호는 15자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.';
  }
  const normalizedId = username.normalize('NFKC').toLowerCase();
  if (normalizedId && password.normalize('NFKC').toLowerCase().includes(normalizedId)) {
    return '비밀번호에 아이디를 포함할 수 없습니다.';
  }
  return '';
}
