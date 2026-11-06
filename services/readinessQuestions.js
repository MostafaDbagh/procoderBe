/** One missing question per turn. Values are the validated assessment API enums. */
function nextReadinessQuestion(assessment, locale) {
 if (assessment.status !== 'needs_information') return null;
 const field = assessment.missingFields[0];
 if (!field) return null;
 const ar = locale === 'ar';
 const say = (en, arabic) => ar ? arabic : en;
 const questions = {
  age: { prompt: say('How old is your child?', 'كم عمر طفلك؟'), options: [] },
  experience: { prompt: say('What has your child tried before?', 'ما الذي جرّبه طفلك من قبل؟'), options: [
   ['none', say('No previous experience', 'دون خبرة سابقة')],
   ['beginner', say('A few guided activities', 'أنشطة قليلة بالتوجيه')],
   ['intermediate', say('Several completed projects', 'عدة مشاريع مكتملة')],
   ['advanced', say('Sustained experience with substantial projects', 'خبرة مستمرة في مشاريع متكاملة')],
   ['unsure', say('I’m not sure yet', 'لست متأكداً بعد')],
  ] },
  readiness: { prompt: say('Which best describes what your child can do now?', 'ما الوصف الأقرب لما يستطيع طفلك فعله الآن؟'), options: [
   ['sequences', say('Practise simple steps through stories and play', 'يتدرّب على خطوات بسيطة عبر القصص واللعب')],
   ['guided', say('Build a small project with step-by-step guidance', 'ينجز مشروعاً صغيراً بتوجيه خطوة بخطوة')],
   ['independent', say('Make and explain a small project independently', 'ينجز مشروعاً صغيراً ويشرحه باستقلالية')],
   ['open_ended', say('Compare solutions and improve an open-ended project', 'يقارن الحلول ويحسّن مشروعاً مفتوحاً')],
   ['specialization', say('Plan, test and explain substantial projects in a chosen field', 'يخطط ويختبر ويشرح مشاريع متكاملة في مجال مختار')],
   ['unsure', say('I’m not sure yet', 'لست متأكداً بعد')],
  ] },
  support: { prompt: say('When something is difficult, what usually helps your child?', 'عندما تصعب المهمة، ما الذي يساعد طفلك عادةً؟'), options: [
   ['frequent', say('Frequent adult guidance', 'توجيه متكرر من شخص بالغ')],
   ['occasional', say('Occasional hints are enough', 'تكفيه تلميحات أحياناً')],
   ['independent', say('They try alternatives and explain what changed', 'يجرّب بدائل ويشرح ما تغيّر')],
   ['unsure', say('I’m not sure yet', 'لست متأكداً بعد')],
  ] },
 };
 const question = questions[field];
 return { field, prompt: question.prompt, options: question.options.map(([value, label]) => ({ value, label })) };
}
module.exports = { nextReadinessQuestion };
