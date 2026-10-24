// アップデート情報の最小テスト：node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { renderBody, splitItems, LATEST } = require('../js/updates.js');
const data = JSON.parse(readFileSync(new URL('../data/updates.json', import.meta.url), 'utf8'));

test('各項目に必要な欄がそろっている', () => {
  const ids = new Set();
  for (const x of data.items) {
    for (const k of ['id', 'app', 'status', 'title', 'body']) assert.ok(x[k], `${x.id}: ${k} が空`);
    assert.ok(!ids.has(x.id), `id の重複 ${x.id}`); ids.add(x.id);
    assert.ok(data.apps[x.app], `${x.id}: 未登録のアプリ ${x.app}`);
    assert.ok(['released', 'upcoming'].includes(x.status), `${x.id}: status ${x.status}`);
  }
});

test('公開済みは日付あり・準備中は日付なし（架空の日付を入れない）', () => {
  for (const x of data.items) {
    if (x.status === 'released') assert.match(x.date, /^\d{4}-\d{2}-\d{2}$/, x.id);
    else assert.equal(x.date, null, `${x.id}: 準備中に日付がある`);
  }
});

test('ファイルは 準備中 → 公開済み（新しい順）に並んでいる', () => {
  const st = data.items.map(x => x.status);
  assert.equal(st.lastIndexOf('upcoming') < st.indexOf('released'), true);
  const d = data.items.filter(x => x.status === 'released').map(x => x.date);
  assert.deepEqual(d, [...d].sort().reverse());
});

test('splitItems：準備中は公開済みの一覧に混ざらない・最新は5件', () => {
  const s = splitItems(data);
  assert.ok(s.latest.every(x => x.status === 'released'));
  assert.ok(s.past.every(x => x.status === 'released'));
  assert.ok(s.upcoming.every(x => x.status === 'upcoming'));
  assert.equal(s.latest.length, Math.min(LATEST, data.items.filter(x => x.status === 'released').length));
  assert.equal(s.latest.length + s.past.length + s.upcoming.length, data.items.length);
});

test('renderBody：太字・箇条書き・段落、HTML は無害化', () => {
  assert.equal(renderBody('a **b**\n\n● x\n● y'), '<p>a <b>b</b></p><ul><li>x</li><li>y</li></ul>');
  assert.equal(renderBody('<script>'), '<p>&lt;script&gt;</p>');
});

test('renderBody：[文字](https://…) はリンク・https 以外はリンクにしない', () => {
  assert.equal(renderBody('[開く](https://otonlab.github.io/chuju-bansou/)'), '<p><a href="https://otonlab.github.io/chuju-bansou/">開く</a></p>');
  assert.equal(renderBody('[x](javascript:alert(1))'), '<p>[x](javascript:alert(1))</p>');
});
