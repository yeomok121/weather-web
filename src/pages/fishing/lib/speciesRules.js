// 낚시 페이지: 어종 정보 — 금어기·금지체장(법령)과 낚시 시즌(일반 정보)
//
// [법령 값] 국가법령정보센터(law.go.kr)에서 2026-11-20에 원문을 직접 확인한 값만 넣었습니다.
//   - 수산자원관리법 시행령(대통령령 제36423호, 2026.6.23 공포, 2026.7.1 시행)
//     · 별표 1 수산자원의 포획·채취 금지 기간·구역 및 수심 <개정 2026.6.23>
//     · 별표 2 수산자원의 포획·채취금지 체장 또는 체중 <개정 2024.6.4> — 어류는 전장(주둥이~꼬리지느러미 끝) 기준
//   - 수산자원관리법 제18조 ⑤ 비어업인(낚시인)도 제14조(포획·채취 금지)를 지켜야 함 <신설 2023.6.20>
//   - 같은 법 제14조 ④ 시·도지사는 지역에 따라 더 강하게 정해 고시할 수 있음
//   법령이 바뀌면 이 표와 LAW_CHECKED_AT을 함께 고쳐 주세요. 표에 없는 값은 지어내지 말고 null로 둡니다.
// [시즌] 낚시인들 사이에 일반적으로 알려진 시기로, 지역·수온에 따라 다르며 법적 의미가 없습니다.

export const LAW_CHECKED_AT = '2026-11-20';
export const LAW_SOURCE = {
  name: '수산자원관리법 시행령 별표 1(2026.6.23 개정)·별표 2(2024.6.4 개정)',
  url: 'https://www.law.go.kr/법령/수산자원관리법시행령',
};

// closed: [{ from: [월, 일], to: [월, 일], where }] — where가 있으면 그 해역에만 적용되는 기간
export const SPECIES = [
  { id: 'black-porgy', name: '감성돔', aliases: [], lawName: '감성돔', science: 'Acanthopagrus schlegelii',
    closed: [{ from: [5, 1], to: [5, 31] }], minSizeCm: 25, season: '가을~초겨울 (9~12월)', tip: '갯바위·방파제 찌낚시 대표 어종' },
  { id: 'red-seabream', name: '참돔', aliases: [], lawName: '참돔', science: 'Pagrus major',
    closed: [], minSizeCm: 24, season: '봄 산란 전(4~6월)·가을', tip: '선상·갯바위 원투, 타이라바' },
  { id: 'rock-bream', name: '돌돔', aliases: [], lawName: '돌돔', science: 'Oplegnathus fasciatus',
    closed: [], minSizeCm: 24, season: '여름~가을 (6~10월)', tip: '수온이 높을 때 갯바위 원투' },
  { id: 'opaleye', name: '벵에돔', aliases: [], lawName: null, science: 'Girella punctata',
    closed: [], minSizeCm: null, season: '여름~가을, 제주는 겨울까지', tip: '갯바위 찌낚시, 밑밥 운용이 중요' },
  { id: 'sea-bass', name: '농어', aliases: [], lawName: '농어', science: 'Lateolabrax japonicus',
    closed: [], minSizeCm: 30, season: '여름~가을 (6~11월)', tip: '갯바위·방파제 루어, 파도가 적당할 때' },
  { id: 'rockfish', name: '우럭', aliases: ['조피볼락'], lawName: '조피볼락', science: 'Sebastes schlegelii',
    closed: [], minSizeCm: 23, season: '거의 사계절, 가을~겨울에 활발', tip: '선상·방파제 바닥 채비' },
  { id: 'darkbanded-rockfish', name: '볼락', aliases: [], lawName: '볼락', science: 'Sebastes inermis',
    closed: [], minSizeCm: 15, season: '겨울~봄 (12~4월)', tip: '밤 방파제 루어(볼락루어)·찌낚시' },
  { id: 'olive-flounder', name: '광어', aliases: ['넙치'], lawName: '넙치', science: 'Paralichthys olivaceus',
    closed: [], minSizeCm: 35, season: '가을~겨울', tip: '선상 다운샷, 모래 바닥' },
  { id: 'greenling', name: '쥐노래미', aliases: [], // '노래미'는 다른 종(Hexagrammos agrammus)이라 별칭으로 쓰지 않음 lawName: '쥐노래미', science: 'Hexagrammos otakii',
    closed: [{ from: [11, 1], to: [12, 31] }, { from: [11, 15], to: [12, 14], where: '백령도·대청도·소청도 주변 해역(별표 1 주3)' }],
    minSizeCm: 20, season: '가을~봄 (금어기 11~12월 제외)', tip: '방파제·갯바위 바닥, 금어기 주의' },
];

const kst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' });
const monthDay = (time) => { const [m, d] = kst.format(time).split('-').map(Number); return m * 100 + d; };
const key = ([m, d]) => m * 100 + d;
const within = (md, range) => (key(range.from) <= key(range.to) ? md >= key(range.from) && md <= key(range.to) : md >= key(range.from) || md <= key(range.to));

export const findSpecies = (name) => SPECIES.find((s) => s.name === name || s.aliases.includes(name) || s.lawName === name) || null;
export const formatRange = (range) => `${range.from[0]}월 ${range.from[1]}일 ~ ${range.to[0]}월 ${range.to[1]}일`;
// 기본(전국) 금어기만: 특정 해역 기간(where)은 안내 문구로 따로 보여줍니다.
const mainRanges = (species) => (species?.closed || []).filter((range) => !range.where);

// 오늘(한국 시간) 전국 기준 금어기인지
export function isClosedNow(species, now = Date.now()) {
  const md = monthDay(now);
  return mainRanges(species).some((range) => within(md, range));
}

// 다음 금어기 시작까지 남은 날 (금어기 중이거나 금어기가 없으면 null)
export function daysUntilClosed(species, now = Date.now()) {
  if (!mainRanges(species).length || isClosedNow(species, now)) return null;
  for (let d = 1; d <= 366; d += 1) if (isClosedNow(species, now + d * 86400000)) return d;
  return null;
}

// 화면용 상태: closed(금어기 중) · soon(30일 안에 시작) · open
export function speciesStatus(species, now = Date.now()) {
  if (!species) return null;
  if (isClosedNow(species, now)) return { kind: 'closed', text: '지금 금어기' };
  const days = daysUntilClosed(species, now);
  if (days != null && days <= 30) return { kind: 'soon', text: `금어기 ${days}일 전` };
  return { kind: 'open', text: mainRanges(species).length ? '금어기 아님' : '금어기 없음' };
}
