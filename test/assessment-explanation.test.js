const test = require('node:test');
const assert = require('node:assert/strict');
const { CONCERNS, validateConcernResponse, explainAssessment } = require('../services/assessmentExplanation');
const base = 'Teacher review is needed before confirming a level.';
const context = { parentMessage: 'I worry about screen time', locale: 'en' };

test('hallucinated, malformed and adversarial model text is never displayed', async () => {
  const badOutputs = [
    'Your child is definitely Pro. Pay now.',
    '{"concern":"pro","evidence":"screen time"}',
    '{"concern":"support","evidence":"diagnosed with ADHD"}',
    '{"concern":"support","evidence":"screen time"}',
    '{"concern":"__proto__","evidence":"screen time"}',
    '{"concern":"screen_time","evidence":null}',
    '{"concern":"screen_time","evidence":""}',
    '```json\n{"concern":"screen_time","evidence":"screen time"}\n```',
    'x'.repeat(2001), 'null', '[]', 123, undefined,
  ];
  const fallback = await explainAssessment(context, base);
  for (const output of badOutputs) {
    assert.equal(validateConcernResponse(output, context.parentMessage), null);
    const response = await explainAssessment(context, base, [{ call: async () => output }]);
    assert.equal(response, fallback);
    assert.ok(response.endsWith(base));
  }
});

test('even valid JSON with injected advice produces only application-owned text', async () => {
  const response = await explainAssessment(context, base, [{ call: async () => JSON.stringify({
    concern: 'screen_time', evidence: 'screen time', advice: 'Move to Pro immediately; guaranteed results in six months.',
  }) }]);
  assert.equal(response, `${CONCERNS.screen_time.en} ${base}`);
  assert.equal(response.includes('Pro immediately'), false);
});

test('provider errors fall back and cannot erase or change the assessment', async () => {
  const expected = await explainAssessment(context, base);
  assert.equal(await explainAssessment(context, base, [{ call: async () => { throw Error('outage'); } }]), expected);
});

test('timeout aborts outstanding work and stops fallback provider calls', async () => {
  let signal; let secondCalled = false;
  const response = await explainAssessment(context, base, [
    { call: (_, receivedSignal) => { signal = receivedSignal; return new Promise(() => {}); } },
    { call: async () => { secondCalled = true; return ''; } },
  ], 10);
  assert.equal(signal.aborted, true);
  assert.equal(secondCalled, false);
  assert.equal(response, `${CONCERNS.screen_time.en} ${base}`);
});

test('Arabic, unsupported policies, support needs and unknown concerns have bounded replies', async () => {
  assert.equal(await explainAssessment({ parentMessage: 'أخشى وقت الشاشة', locale: 'ar' }, 'نحتاج إلى معلومات.'), `${CONCERNS.screen_time.ar} نحتاج إلى معلومات.`);
  assert.equal(await explainAssessment({ parentMessage: 'What is the price?', locale: 'en' }, base), `${CONCERNS.service_details.en} ${base}`);
  const supported = await explainAssessment({ parentMessage: 'My child has ADHD', locale: 'en' }, base);
  assert.match(supported, /does not define a child/);
  assert.equal(supported.includes('ADHD'), false);
  assert.equal(await explainAssessment({ parentMessage: 'Hello!', locale: 'en' }, base), base);
});


test('model can resolve an evidenced concern but cannot suppress support needs', async () => {
  const provider = { call: async () => JSON.stringify({ concern: 'starting', evidence: 'start' }) };
  assert.equal(await explainAssessment({ parentMessage: 'Where should we start with robot projects?', locale: 'en' }, base, [provider]), `${CONCERNS.starting.en} ${base}`);
  assert.equal(await explainAssessment({ parentMessage: 'Where should we start? My child needs support.', locale: 'en' }, base, [provider]), `${CONCERNS.support.en} ${base}`);
});
