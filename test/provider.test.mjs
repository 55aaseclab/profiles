import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, getCards, getDataInventory } from '../praxis-provider.mjs';
const metadata = describe(), app = metadata.appId;
const sample = (overrides = {}) => ({ id: 'a'.repeat(64), name: 'Synthetic 文档.md', group: 'Examples', type: 'md', revision: 'b'.repeat(64), updatedAt: '2026-01-01T12:00:00.000Z', preview: 'A short synthetic original excerpt.', ...overrides });
function context(items, extra = {}) {
  const reads = [];
  return { reads, identity: { userId: 'synthetic-owner' }, read: async path => { reads.push(path); return { items }; }, ...extra };
}
test('descriptor declares browser cards and the app-owned server directory source', () => {
  assert.equal(metadata.version, 1); assert.equal(metadata.cards.supported, true); assert.equal(metadata.cards.execution, 'browser');
  assert.equal(metadata.inventory.execution, 'server'); assert.deepEqual(metadata.nativeReads, ['/api/documents']);
  assert.equal(metadata.dataSources[0].kind, 'directory'); assert.equal(metadata.dataSources[0].location.env, app === 'letters' ? 'PRAXIS_LETTERS_DIR' : 'PRAXIS_PROFILES_DIR');
  const mutable = describe(); mutable.dataSources[0].id = 'changed'; assert.equal(describe().dataSources[0].id, 'originals');
});
test('authorized catalog produces native source-backed cards with stable IDs and real revisions', async () => {
  const input = context([sample()]), result = await getCards(input), card = result.items[0];
  assert.equal(result.status, 'ready'); assert.deepEqual(input.reads, ['api/documents']);
  assert.equal(card.id, app + ':' + 'a'.repeat(64)); assert.equal(card.resourceId, 'a'.repeat(64)); assert.equal(card.revision, 'b'.repeat(64));
  assert.equal(card.kind, 'result'); assert.equal(card.title, 'Synthetic 文档.md'); assert.equal(card.preview, 'A short synthetic original excerpt.');
  assert.ok(card.reason.en && card.reason.zh); assert.equal(card.primaryAction.href, '/apps/' + app + '/#document=' + card.resourceId);
  assert.equal(card.source.href, card.primaryAction.href); assert.equal(card.evidence[0].href, card.primaryAction.href); assert.equal(card.evidence[0].revision, card.revision);
  const changed = await getCards(context([sample({ revision: 'c'.repeat(64), updatedAt: '2026-01-02T12:00:00.000Z' })]));
  assert.equal(changed.items[0].id, card.id); assert.notEqual(changed.items[0].revision, card.revision);
});
test('PDF and office cards never invent or fetch body previews', async () => {
  const input = context([sample({ type: 'pdf', name: 'Synthetic.pdf', preview: 'BINARY_BODY_NOT_A_PREVIEW' }), sample({ id: 'c'.repeat(64), type: 'docx', name: 'Synthetic.docx', preview: 'BINARY_BODY_NOT_A_PREVIEW' })]);
  const result = await getCards(input); assert.equal(result.status, 'ready'); assert.equal(result.items.length, 2); assert.deepEqual(input.reads, ['api/documents']);
  for (const card of result.items) { assert.equal(card.preview, undefined); assert.equal(card.evidence[0].excerpt, undefined); assert.ok(card.primaryAction.href); }
  assert.doesNotMatch(JSON.stringify(result), /BINARY_BODY_NOT_A_PREVIEW/);
});
test('empty, failed, malformed and partial catalogs remain distinct without manufactured versions', async () => {
  assert.equal((await getCards(context([]))).status, 'empty');
  assert.equal((await getCards(context([], { read: async () => ({ items: [], partial: true }) }))).status, 'partial');
  const failed = await getCards(context([], { read: async () => { throw new Error('/private/synthetic/secret'); } }));
  assert.equal(failed.status, 'unavailable'); assert.deepEqual(failed.items, []); assert.doesNotMatch(JSON.stringify(failed), /private|secret/);
  const invalid = await getCards(context([sample({ revision: '' })])); assert.equal(invalid.status, 'unavailable'); assert.deepEqual(invalid.items, []);
  const partial = await getCards(context([sample(), sample({ id: 'c'.repeat(64), revision: null })])); assert.equal(partial.status, 'partial'); assert.equal(partial.items.length, 1);
  const absent = context([sample()], { identity: {} }); assert.equal((await getCards(absent)).status, 'unavailable'); assert.deepEqual(absent.reads, []);
});
test('server inventory uses the supplied resolver and browser metadata exposes no private paths', async () => {
  let received;
  const expected = '/synthetic/private/originals';
  const result = await getDataInventory({ resolveDataSource: async source => { received = source; return { hostPath: expected, containerPath: '/data/originals', status: 'ready' }; } });
  assert.deepEqual(received, metadata.dataSources[0]); assert.equal(result.status, 'ready'); assert.equal(result.items[0].hostPath, expected); assert.equal(result.items[0].kind, 'directory');
  const browser = await getDataInventory(); assert.equal(browser.items[0].status, 'server-managed');
  for (const field of ['hostPath','containerPath','volumeName','storageKey']) assert.equal(browser.items[0][field], undefined);
  const unavailable = await getDataInventory({ resolveDataSource: async () => { throw new Error('unavailable'); } }); assert.equal(unavailable.status, 'unavailable'); assert.equal(unavailable.items[0].hostPath, undefined);
});
test('provider imports no Node modules and never performs its own network or filesystem access', async () => {
  const source = await readFile(new URL('../praxis-provider.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /node:|process\.env|\bfetch\s*\(|\brequire\s*\(/);
});
