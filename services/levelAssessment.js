/** Parent-reported readiness, not a diagnosis or a final enrollment decision.
 * Age bands mirror the published journey; readiness determines the candidate.
 * Interests choose activities, never a child's ability or stage.
 */
const LEVELS = [
  { key: 'explorer', name: 'Explorer', min: 5, max: 8 },
  { key: 'builder', name: 'Builder', min: 8, max: 10 },
  { key: 'creator', name: 'Creator', min: 9, max: 12 },
  { key: 'innovator', name: 'Innovator', min: 11, max: 14 },
  { key: 'pro', name: 'Pro', min: 13, max: 18 },
];
const READINESS = ['sequences', 'guided', 'independent', 'open_ended', 'specialization', 'unsure'];
const EXPERIENCE = ['none', 'beginner', 'intermediate', 'advanced', 'unsure'];
const SUPPORT = ['frequent', 'occasional', 'independent', 'unsure'];
function validateAssessment(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid assessment');
  const result = {};
  for (const [key, allowed] of Object.entries({ experience: EXPERIENCE, readiness: READINESS, support: SUPPORT })) {
    if (value[key] === undefined) continue;
    if (!allowed.includes(value[key])) throw new Error(`Invalid assessment.${key}`);
    result[key] = value[key];
  }
  if (value.age !== undefined) {
    if (!Number.isInteger(value.age) || value.age < 3 || value.age > 20) throw new Error('Invalid assessment.age');
    result.age = value.age;
  }
  return result;
}
function assessLevel(answers, _profile, locale) {
  const ar = locale === 'ar';
  const say = (en, arabic) => ar ? arabic : en;
  const missingFields = ['age', 'experience', 'readiness', 'support'].filter(key => answers[key] === undefined);
  const base = { version: '1', status: 'needs_information', suggestedLevel: null, reasons: [], considerations: [], missingFields, nextStep: '' };
  if (missingFields.length) {
    const ageKnown = answers.age !== undefined;
    return { ...base, nextStep: ageKnown
      ? say(`I have your child’s age as ${answers.age}. Complete the remaining answers below so we can suggest a suitable starting level.`, `عمر طفلك المذكور هو ${answers.age} سنة. أكمل الإجابات المتبقية أدناه لنقترح مستوى بداية مناسباً.`)
      : say('Tell us your child’s age and complete the readiness answers below so we can suggest a suitable starting level.', 'اذكر عمر طفلك وأكمل إجابات الاستعداد أدناه لنقترح مستوى بداية مناسباً.') };
  }
  if (answers.age < 5 || answers.age > 18) {
    return { ...base, status: 'review_required', nextStep: say('Our published levels cover ages 5–18. Speak with a learning guide to check whether we can offer a suitable experience.', 'مستوياتنا المنشورة تغطي الأعمار من 5 إلى 18 سنة. تواصل مع مرشد التعلّم للتحقق من إمكانية تقديم تجربة مناسبة.') };
  }
  if ([answers.readiness, answers.experience, answers.support].includes('unsure')) {
    return { ...base, status: 'review_required', nextStep: say('A short guided activity will help clarify readiness. Book a free trial before choosing a level.', 'يساعد نشاط قصير مع المعلم على توضيح الاستعداد. احجز تجربة مجانية قبل اختيار المستوى.') };
  }
  const index = READINESS.indexOf(answers.readiness);
  const level = LEVELS[index];
  const reasons = [say(
    `You reported age ${answers.age}; ${level.name}'s usual age range is ${level.min}–${level.max}. Age is guidance, not proof of readiness.`,
    `ذكرت أن العمر ${answers.age} سنة؛ النطاق المعتاد لمستوى ${level.name} هو ${level.min}–${level.max}. العمر مؤشر إرشادي وليس دليلاً على الاستعداد.`
  )];
  const descriptions = [
    ['Practising sequences through stories and guided play fits Explorer’s focus on noticing, trying and improving.', 'التدرّب على ترتيب الخطوات عبر القصص واللعب الموجّه يناسب تركيز Explorer على الملاحظة والمحاولة والتحسين.'],
    ['Building a small project with guidance suggests Builder as a starting point for organising and testing ideas.', 'إنجاز مشروع صغير بالتوجيه يشير إلى Builder كنقطة بداية لتنظيم الأفكار واختبارها.'],
    ['Making and explaining a small project independently suggests Creator as a starting point.', 'إنجاز مشروع صغير وشرحه باستقلالية يشير إلى Creator كنقطة بداية.'],
    ['Comparing solutions and improving an open-ended project suggests Innovator as a starting point.', 'مقارنة الحلول وتحسين مشروع مفتوح يشير إلى Innovator كنقطة بداية.'],
    ['Planning, testing and explaining a substantial project in a chosen field suggests exploring Pro.', 'تخطيط مشروع متكامل واختباره وشرح قراراته في مجال مختار يشير إلى إمكانية استكشاف Pro.'],
  ];
  reasons.push(say(...descriptions[index]));
  const considerations = [];
  if (answers.age < level.min || answers.age > level.max) considerations.push(say('Readiness and the usual age band point to different starting points. A teacher should check the pace and peer-group fit.', 'الاستعداد والنطاق العمري المعتاد يشيران إلى نقطتي بداية مختلفتين. يحتاج المعلم للتحقق من وتيرة التعلّم وملاءمة المجموعة.'));
  if (index >= 2 && ['none', 'beginner'].includes(answers.experience)) considerations.push(say('Independent project readiness and limited prior experience need clarification with an example of the child’s own work.', 'الاستقلالية في المشاريع مع الخبرة السابقة المحدودة تحتاج إلى توضيح بمثال من عمل الطفل نفسه.'));
  if (index >= 2 && answers.support === 'frequent') considerations.push(say('The reported need for frequent support should be discussed before confirming an independent-project level.', 'الحاجة المذكورة للدعم المتكرر تستدعي النقاش قبل تأكيد مستوى يعتمد على المشاريع المستقلة.'));
  if (index < 2 && answers.experience === 'advanced') considerations.push(say('Advanced experience and early-stage readiness appear different. A short practical activity can clarify the best starting point.', 'الخبرة المتقدمة والاستعداد في مرحلة أولية يبدوان مختلفين. يساعد نشاط عملي قصير على تحديد البداية الأنسب.'));
  if (index === 4 && answers.experience !== 'advanced') considerations.push(say('Pro involves sustained independent work in a specialization. A teacher should review a substantial project before confirming this stage.', 'يتطلب Pro عملاً مستقلاً مستمراً في مجال تخصص. ينبغي أن يراجع المعلم مشروعاً متكاملاً قبل تأكيد هذا المستوى.'));
  const status = considerations.length ? 'review_required' : 'provisional';
  return { ...base, status, suggestedLevel: level.key, reasons, considerations, nextStep: status === 'review_required'
    ? say('Discuss these points with a teacher in a free trial before confirming placement.', 'ناقش هذه النقاط مع المعلم في تجربة مجانية قبل تأكيد المستوى.')
    : say('Try a guided activity at this level. A teacher will check the child’s explanation, independence and support needs before confirming placement.', 'جرّب نشاطاً موجّهاً في هذا المستوى. يتحقق المعلم من شرح الطفل واستقلاليته واحتياجات الدعم قبل تأكيد المستوى.') };
}
function eligibleCourses(courses, assessment, answers) {
  if (assessment.status !== 'provisional') return [];
  const maxDifficulty = { none: 0, beginner: 0, intermediate: 1, advanced: 2 }[answers.experience];
  return courses.filter(c => c.isActive && c.stlLevel === assessment.suggestedLevel
    && answers.age >= c.ageMin && answers.age <= c.ageMax
    && ({ beginner: 0, intermediate: 1, advanced: 2 }[c.level] ?? 99) <= maxDifficulty);
}
module.exports = { LEVELS, validateAssessment, assessLevel, eligibleCourses };
