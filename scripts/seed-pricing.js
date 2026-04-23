require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const { PricingPlan, PricingDiscount, PricingFaq } = require("../models/Pricing");

const plans = [
  {
    key: "trial",
    name: { en: "Free Trial", ar: "تجربة مجانية" },
    priceDisplay: { en: "Free", ar: "مجاني" },
    period: { en: "", ar: "" },
    description: {
      en: "Experience a full live class with one of our certified teachers — completely free, no card needed.",
      ar: "جرّب حصة مباشرة كاملة مع أحد معلمينا المعتمدين — مجاناً تماماً، لا حاجة لبطاقة.",
    },
    features: [
      { en: "1 full live class (60 min)", ar: "حصة مباشرة كاملة (60 دقيقة)" },
      { en: "Any course category", ar: "أي فئة دورة" },
      { en: "Any age 6–18", ar: "أي عمر 6–18" },
      { en: "No commitment", ar: "بدون التزام" },
    ],
    highlighted: false,
    badge: { en: "", ar: "" },
    ctaHref: "/free-trial",
    ctaLabel: { en: "Book Free Trial", ar: "احجز تجربة مجانية" },
    order: 1,
  },
  {
    key: "monthly",
    name: { en: "Monthly", ar: "شهري" },
    priceDisplay: { en: "From $49", ar: "من 49$" },
    period: { en: "/ month per child", ar: "/ شهر لكل طفل" },
    description: {
      en: "Flexible month-by-month enrollment. Pause or cancel anytime.",
      ar: "تسجيل شهري مرن. أوقف مؤقتاً أو ألغِ في أي وقت.",
    },
    features: [
      { en: "2 live classes per week", ar: "حصتان مباشرتان أسبوعياً" },
      { en: "Class recordings in dashboard", ar: "تسجيلات الحصص في لوحة التحكم" },
      { en: "Progress tracking & badges", ar: "تتبع التقدم والشارات" },
      { en: "Certified instructor", ar: "معلم معتمد" },
      { en: "Parent dashboard access", ar: "وصول لوحة تحكم الوالدين" },
    ],
    highlighted: true,
    badge: { en: "Most Popular", ar: "الأكثر طلباً" },
    ctaHref: "/courses",
    ctaLabel: { en: "Enroll Now", ar: "سجّل الآن" },
    order: 2,
  },
  {
    key: "bundle",
    name: { en: "Best Value", ar: "أفضل قيمة" },
    priceDisplay: { en: "From $37", ar: "من 37$" },
    period: { en: "/ month (billed annually)", ar: "/ شهر (يُدفع سنوياً)" },
    description: {
      en: "Our best rate for families committed to long-term learning.",
      ar: "أفضل سعر لدينا للعائلات الملتزمة بالتعلم على المدى الطويل.",
    },
    features: [
      { en: "Everything in Monthly", ar: "كل ما في الخطة الشهرية" },
      { en: "25% off with annual plan", ar: "خصم 25% مع الخطة السنوية" },
      { en: "10% off with quarterly plan", ar: "خصم 10% مع الخطة الربع سنوية" },
      { en: "15% sibling discount", ar: "خصم 15% للأشقاء" },
      { en: "Priority scheduling", ar: "جدولة ذات أولوية" },
    ],
    highlighted: false,
    badge: { en: "Save 25%", ar: "وفر 25%" },
    ctaHref: "/contact",
    ctaLabel: { en: "Get Best Value", ar: "احصل على أفضل قيمة" },
    order: 3,
  },
];

const discounts = [
  {
    key: "sibling",
    title: { en: "Sibling Discount", ar: "خصم الأشقاء" },
    value: { en: "15% off", ar: "خصم 15%" },
    description: {
      en: "Enroll a second child and save 15% on their plan",
      ar: "سجّل طفلاً ثانياً ووفر 15% على خطته",
    },
    iconColor: "from-blue-400 to-cyan-400",
    order: 1,
  },
  {
    key: "quarterly",
    title: { en: "Quarterly Plan", ar: "الخطة الربع سنوية" },
    value: { en: "10% off", ar: "خصم 10%" },
    description: {
      en: "Pay for 3 months upfront and save 10%",
      ar: "ادفع لمدة 3 أشهر مقدماً ووفر 10%",
    },
    iconColor: "from-emerald-400 to-teal-400",
    order: 2,
  },
  {
    key: "annual",
    title: { en: "Annual Plan", ar: "الخطة السنوية" },
    value: { en: "25% off", ar: "خصم 25%" },
    description: {
      en: "Our best rate — pay for a full year and save 25%",
      ar: "أفضل سعر لدينا — ادفع لسنة كاملة ووفر 25%",
    },
    iconColor: "from-primary to-purple",
    order: 3,
  },
];

const faqs = [
  {
    question: {
      en: "Is the free trial really free?",
      ar: "هل التجربة المجانية مجانية فعلاً؟",
    },
    answer: {
      en: "Yes — completely free. No credit card required. Your child attends one full 60-minute live class with a certified teacher.",
      ar: "نعم — مجانية تماماً. لا حاجة لبطاقة ائتمان. يحضر طفلك حصة مباشرة كاملة مدتها 60 دقيقة مع معلم معتمد.",
    },
    order: 1,
  },
  {
    question: { en: "Can I cancel anytime?", ar: "هل يمكنني الإلغاء في أي وقت؟" },
    answer: {
      en: "On the monthly plan, yes. Cancel before your next billing cycle and you won't be charged again. Annual plans are non-refundable after 14 days.",
      ar: "في الخطة الشهرية، نعم. ألغِ قبل دورة الفوترة التالية ولن تُحسب عليك رسوم. الخطط السنوية غير قابلة للاسترداد بعد 14 يوماً.",
    },
    order: 2,
  },
  {
    question: {
      en: "Are there discounts for multiple children?",
      ar: "هل توجد خصومات لأكثر من طفل؟",
    },
    answer: {
      en: "Yes! Enroll a second child and get 15% off their plan automatically. Contact us for families with 3 or more children.",
      ar: "نعم! سجّل طفلاً ثانياً واحصل على خصم 15% على خطته تلقائياً. تواصل معنا للعائلات التي لديها 3 أطفال أو أكثر.",
    },
    order: 3,
  },
  {
    question: {
      en: "What payment methods do you accept?",
      ar: "ما طرق الدفع المقبولة؟",
    },
    answer: {
      en: "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
      ar: "نقبل جميع بطاقات الائتمان الرئيسية وPayPal والتحويلات البنكية للخطط السنوية.",
    },
    order: 4,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const p of plans) {
    await PricingPlan.findOneAndUpdate({ key: p.key }, p, { upsert: true, new: true });
    console.log(`  plan: ${p.key}`);
  }
  for (const d of discounts) {
    await PricingDiscount.findOneAndUpdate({ key: d.key }, d, { upsert: true, new: true });
    console.log(`  discount: ${d.key}`);
  }
  await PricingFaq.deleteMany({});
  for (const f of faqs) {
    await PricingFaq.create(f);
    console.log(`  faq: ${f.question.en.slice(0, 40)}`);
  }

  console.log("Pricing seeded.");
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
