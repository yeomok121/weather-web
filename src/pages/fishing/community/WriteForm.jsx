// 커뮤니티 글쓰기: 조과 자랑(사진 필수)·낚시 팁, 관리자는 공지도
// 사진은 브라우저에서 줄여(lib/photoResize.js) 보내고, 금지체장·금어기 어종은 자랑 글로 올릴 수 없게 막습니다.
import { useState } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
import { createCommunityPost } from '../communityApi';
import { CATEGORIES, LIMITS, draftProblem } from '../lib/communityRules';
import { resizePhoto } from '../lib/photoResize';
import { SPECIES } from '../lib/speciesRules';
import { readCachedPoints } from '../lib/resilience';

export default function WriteForm({ token, isAdmin, onCreated, onCancel }) {
  const [draft, setDraft] = useState({ category: '자랑', title: '', body: '', species: '', length_cm: '', point_name: '', photos: [] });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pointNames] = useState(() => (readCachedPoints() || []).map((p) => p.name || p.id).filter(Boolean));
  const set = (field) => (event) => { setError(''); setDraft((d) => ({ ...d, [field]: event.target.value })); };
  const categories = isAdmin ? [...CATEGORIES, { id: '공지', label: '공지', hint: '커뮤니티 맨 위에 고정돼요 (관리자)' }] : CATEGORIES;

  const addPhotos = async (event) => {
    const files = [...event.target.files].slice(0, LIMITS.photos - draft.photos.length);
    event.target.value = '';
    if (!files.length) { setError(`사진은 ${LIMITS.photos}장까지 올릴 수 있어요.`); return; }
    setBusy('사진을 줄이는 중…'); setError('');
    try {
      const added = [];
      for (const file of files) added.push(await resizePhoto(file));
      setDraft((d) => ({ ...d, photos: [...d.photos, ...added].slice(0, LIMITS.photos) }));
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  const submit = async (event) => {
    event.preventDefault();
    const problem = draftProblem(draft, { isAdmin });
    if (problem) { setError(problem); return; }
    setBusy('올리는 중…'); setError('');
    try {
      const post = await createCommunityPost(token, {
        ...draft, length_cm: draft.category === '자랑' && draft.length_cm !== '' ? Number(draft.length_cm) : null,
        species: draft.category === '자랑' ? draft.species : '', point_name: draft.point_name,
      });
      onCreated(post);
    } catch (e) { setError(e.message || '글을 올리지 못했어요. 잠시 후 다시 시도해 주세요.'); } finally { setBusy(''); }
  };

  const brag = draft.category === '자랑';
  return <form className="fish-write" onSubmit={submit}>
    <div className="fish-write-kinds" role="radiogroup" aria-label="분류">{categories.map((c) => <button type="button" key={c.id} role="radio" aria-checked={draft.category === c.id}
      className={draft.category === c.id ? 'on' : ''} onClick={() => setDraft((d) => ({ ...d, category: c.id }))}><b>{c.label}</b><small>{c.hint}</small></button>)}</div>
    <input value={draft.title} onChange={set('title')} maxLength={LIMITS.title} placeholder={brag ? '예: 추자도 감성돔 2마리!' : '예: 밤 볼락 채비 무게 고르는 법'} aria-label="제목" />
    {brag && <div className="fish-write-facts">
      <input list="fish-write-species" value={draft.species} onChange={set('species')} placeholder="어종 (선택)" aria-label="어종" />
      <datalist id="fish-write-species">{SPECIES.map((s) => <option key={s.id} value={s.name} />)}</datalist>
      <input type="number" inputMode="decimal" min="1" max="499" step="0.1" value={draft.length_cm} onChange={set('length_cm')} placeholder="길이 cm (선택)" aria-label="길이(cm)" />
    </div>}
    <input list="fish-write-points" value={draft.point_name} onChange={set('point_name')} placeholder="포인트 이름 (선택 · 정확한 자리는 적지 마세요)" aria-label="포인트" maxLength={80} />
    <datalist id="fish-write-points">{pointNames.map((name) => <option key={name} value={name} />)}</datalist>
    <textarea value={draft.body} onChange={set('body')} maxLength={LIMITS.body} rows={brag ? 3 : 6} placeholder={brag ? '한마디 (선택): 물때, 채비, 입질 시간 등' : '팁 내용을 적어 주세요'} aria-label="내용" />
    <div className="fish-write-photos">
      {draft.photos.map((src, i) => <span key={src.slice(-40) + i}><img src={src} alt={`올릴 사진 ${i + 1}`} />
        <button type="button" onClick={() => setDraft((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))} aria-label={`사진 ${i + 1} 빼기`}><FiX /></button></span>)}
      {draft.photos.length < LIMITS.photos && <label className="add"><FiCamera aria-hidden="true" /><span>사진 {draft.photos.length}/{LIMITS.photos}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={addPhotos} disabled={Boolean(busy)} /></label>}
    </div>
    <p className="fish-write-note">사진의 위치정보는 지워져서 올라가요. 금지체장 이하·금어기 어종은 자랑 글로 올릴 수 없어요.</p>
    {error && <p className="fish-write-error" role="alert">{error}</p>}
    <div className="fish-write-actions">
      <button type="submit" className="primary" disabled={Boolean(busy)}>{busy || '올리기'}</button>
      <button type="button" onClick={onCancel} disabled={Boolean(busy) && busy !== '사진을 줄이는 중…'}>취소</button>
    </div>
  </form>;
}
