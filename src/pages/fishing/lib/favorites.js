// 낚시 페이지: 즐겨찾는 포인트 목록 합치기 (계정 목록 순서 유지 + 브라우저에만 있던 것 뒤에 추가, 최대 10곳)
export const MAX_FAVORITE_POINTS = 10;

export function mergeFavoritePoints(account = [], guest = []) {
  return [...account, ...guest.filter((name) => !account.includes(name))].slice(0, MAX_FAVORITE_POINTS);
}
