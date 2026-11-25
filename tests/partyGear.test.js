import test from 'node:test';
import assert from 'node:assert/strict';
import { gearSummary, myGear, shareGear } from '../src/pages/mountain/lib/partyGear.js';

test('personal gear uses per-person quantity and independent completion', () => {
  const item = { name: '식수', kind: 'personal', quantity: 2, unit: 'L',
    member_items: [{ username: 'one', quantity: 1, is_packed: true }] };
  assert.deepEqual(myGear(item, 'one'), { quantity: 2, is_packed: true });
  assert.deepEqual(myGear(item, 'two'), { quantity: 2, is_packed: false });
  assert.equal(gearSummary(item, 2), '식수 · 각자 2L · 1/2명 준비');
});

test('shared gear reports the remaining quantity and names the assigned members when shared', () => {
  const item = { name: '보조배터리', kind: 'shared', quantity: 2,
    member_items: [{ username: 'one', name: '민수', quantity: 1, is_packed: true }] };
  assert.equal(myGear(item, 'two'), null);
  assert.equal(shareGear(item, 2), '보조배터리 · 함께 2개 · 1개 담당 미정 · 민수 1개');
  item.member_items.push({ username: 'two', name: '지연', quantity: 1, is_packed: false });
  assert.equal(gearSummary(item, 2), '보조배터리 · 함께 2개 · 준비 중');
  item.member_items[1].is_packed = true;
  assert.equal(gearSummary(item, 2), '보조배터리 · 함께 2개 · 완료');
});

test('assigned gear appears only on the named member checklist', () => {
  const item = { name: '응급키트', kind: 'assigned', quantity: 2,
    member_items: [{ username: 'one', name: '민수', quantity: 2, is_packed: false }] };
  assert.equal(myGear(item, 'two'), null);
  assert.equal(myGear(item, 'one').quantity, 2);
  assert.equal(shareGear(item, 2), '응급키트 · 2개 · 민수 담당 · 준비 중');
  item.member_items[0].is_packed = true;
  assert.equal(gearSummary(item, 2), '응급키트 · 2개 · 민수 담당 · 완료');
  item.member_items = [];
  assert.equal(myGear(item, 'one'), null);
  assert.equal(gearSummary(item, 2), '응급키트 · 2개 · 담당 미지정');
});
