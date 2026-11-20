// 낚시 페이지: 어종 정보 — 금어기·금지체장(법령, 출처·확인일 표시)과 낚시 시즌(일반 정보)
// 값은 lib/speciesRules.js 한 곳에서 관리합니다.
import { useState } from 'react';
import { FiBookOpen, FiExternalLink } from 'react-icons/fi';
import { LAW_CHECKED_AT, LAW_SOURCE, SPECIES, findSpecies, formatRange, speciesStatus } from '../lib/speciesRules';
import { namedSpecies } from '../fishingFormat';

export default function SpeciesPanel({ indexDays = [] }) {
  const [now] = useState(() => Date.now());
  // 이 포인트 바다낚시지수에 나오는 어종을 앞에
  const here = new Set(indexDays.flatMap((day) => day.sessions.flatMap((s) => namedSpecies(s.species).map((item) => findSpecies(item.name)?.id))).filter(Boolean));
  const list = [...SPECIES].sort((a, b) => Number(here.has(b.id)) - Number(here.has(a.id)));
  const closed = SPECIES.filter((s) => speciesStatus(s, now).kind === 'closed');

  return <section className="fish-panel fish-species">
    <div className="fish-panel-title"><FiBookOpen /><div><h2>어종 정보 · 금어기 · 금지체장</h2>
      <p>법령 값은 국가법령정보센터 원문 기준({LAW_CHECKED_AT} 확인) · 시즌은 일반적으로 알려진 시기(참고용)</p></div></div>

    {closed.length > 0 && <p className="fish-species-alert">🚫 지금 금어기: <b>{closed.map((s) => s.name).join(', ')}</b> — 잡았다면 바로 놓아주세요.</p>}

    <ul className="fish-species-grid">{list.map((s) => {
      const status = speciesStatus(s, now);
      const main = s.closed.filter((r) => !r.where);
      const local = s.closed.filter((r) => r.where);
      return <li key={s.id} className={status.kind}>
        <header><b>{s.name}</b>{s.aliases.length > 0 && <small>({s.aliases.join('·')})</small>}
          {here.has(s.id) && <span className="here">이 포인트 지수 어종</span>}
          <em className={`fish-species-status ${status.kind}`}>{status.text}</em></header>
        <dl>
          <div><dt>금어기</dt><dd>{main.length ? main.map(formatRange).join(', ') : '없음'}
            {local.map((r) => <small key={r.where}>단, {r.where}: {formatRange(r)}</small>)}</dd></div>
          <div><dt>금지체장</dt><dd>{s.minSizeCm != null ? <>전장 <b>{s.minSizeCm}cm 이하</b>는 놓아주기</> : '없음'}</dd></div>
          <div><dt>낚시 시즌</dt><dd>{s.season}</dd></div>
        </dl>
        <p className="tip">{s.tip}</p>
      </li>;
    })}</ul>

    <div className="fish-species-law">
      <p>· 금어기·금지체장은 <b>낚시인(비어업인)도 지켜야 합니다</b> (수산자원관리법 제18조 ⑤). 시·도가 지역에 따라 더 강하게 정할 수 있으니(같은 법 제14조 ④) 출조 지역 고시도 확인하세요.</p>
      <p>· 금지체장은 주둥이 끝에서 꼬리지느러미 끝까지 곧게 잰 길이(전장)입니다. 표시한 길이 <b>이하</b>는 잡으면 안 됩니다.</p>
      <p>· 출처: <a href={LAW_SOURCE.url} target="_blank" rel="noreferrer">{LAW_SOURCE.name} <FiExternalLink aria-hidden="true" /></a> · {LAW_CHECKED_AT} 확인. 법령이 바뀔 수 있으니 최신 원문을 함께 확인하세요.</p>
    </div>
  </section>;
}
