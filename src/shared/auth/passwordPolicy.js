export const newPasswordHint = '8자 이상 · 특수기호 1개 이상 (예: ! @ #) · 숫자만 사용 불가 · 아이디 포함 금지';

export function newPasswordError(username, password) {
  if ([...password].length < 8 || new TextEncoder().encode(password).length > 72) {
    return '새 비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.';
  }
  if (/^\p{Nd}+$/u.test(password.normalize('NFKC').trim())) {
    return '비밀번호를 숫자로만 만들 수 없습니다.';
  }
  if (!/[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/.test(password)) {
    return '비밀번호에 특수기호를 1개 이상 넣어 주세요.';
  }
  const normalizedId = username.normalize('NFKC').toLowerCase();
  if (normalizedId && password.normalize('NFKC').toLowerCase().includes(normalizedId)) {
    return '비밀번호에 아이디를 포함할 수 없습니다.';
  }
  return '';
}
