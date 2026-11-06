const test = require('node:test');
const assert = require('node:assert/strict');
const { withDeadline } = require('../services/recommendationDeadline');
test('successful optional dependencies return their actual value', async () => {
 assert.equal(await withDeadline(async () => 'actual', 100, 'fallback'), 'actual');
});
test('throwing or rejecting dependencies use the local fallback', async () => {
 assert.equal(await withDeadline(() => { throw Error('offline'); }, 100, () => 'local'), 'local');
 assert.equal(await withDeadline(async () => { throw Error('offline'); }, 100, null), null);
});
test('hung dependency is aborted and late completion cannot replace fallback', async () => {
 let signal; let finish;
 const value = await withDeadline(s => { signal = s; return new Promise(resolve => { finish = resolve; }); }, 10, 'fallback');
 assert.equal(value, 'fallback');
 assert.equal(signal.aborted, true);
 finish('late incorrect answer');
 assert.equal(value, 'fallback');
});
