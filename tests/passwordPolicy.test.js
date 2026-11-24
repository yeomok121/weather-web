import test from 'node:test';
import assert from 'node:assert/strict';
import { newPasswordError } from '../src/shared/auth/passwordPolicy.js';

test('new passwords require eight characters and an ASCII special symbol', () => {
  assert.equal(newPasswordError('demo1', 'Cloud!78'), '');
  assert.match(newPasswordError('demo1', 'Cloud!7'), /8자/);
  assert.match(newPasswordError('demo1', '12345678'), /숫자로만/);
  assert.match(newPasswordError('demo1', 'Cloud789'), /특수기호/);
  assert.match(newPasswordError('demo1', 'Cloud 78'), /특수기호/);
  assert.match(newPasswordError('demo1', 'demo1!78'), /아이디/);
});
