/**
 * Default “paper pixel letter” monthly challenge (EN/AR).
 * monthKey is set by the seed script to the current UTC month.
 */
module.exports = {
  slug: "paper-pixel-letter",
  badgeEn: "Free mini-challenge · No account needed",
  badgeAr: "تحدي صغير مجاني · بلا حساب",
  titleEn: "Paper pixel letter",
  titleAr: "حرفك على شكل بكسل ورقي",
  subtitleEn:
    "A 10-minute offline activity that connects art with how computers store simple images — perfect to try before your first coding class.",
  subtitleAr:
    "نشاط ورقي قصير يربط الرسم بفكرة كيف تخزن الحواسيب صورًا بسيطة — مناسب قبل أول حصة برمجة.",
  steps: [
    {
      titleEn: "Draw the grid",
      titleAr: "ارسم الشبكة",
      bodyEn:
        "On a blank sheet, draw a 5×5 grid (five rows and five columns). Use a ruler if you like — neat squares make the trick easier.",
      bodyAr:
        "على ورقة فارغة، ارسم شبكة من خمسة صفوف وخمسة أعمدة. يمكنك استخدام مسطرة — المربعات المرتبة تسهّل التجربة.",
    },
    {
      titleEn: "Design your letter",
      titleAr: "صمّم حرفك",
      bodyEn:
        "Shade squares so the dark squares form the first letter of your first name, block-letter style. Only use the grid — no curves outside the boxes.",
      bodyAr:
        "ظلّل المربعات بحيث تشكّل المربعات المظلمة الحرف الأول من اسمك، بأسلوب الحروف المربّعة. استخدم الشبكة فقط — بلا منحنيات خارج المربعات.",
    },
    {
      titleEn: "Encode each row",
      titleAr: "رمّز كل صف",
      bodyEn:
        "For each row, write how many shaded squares are in that row (0–5), left to right. You now have five numbers — that’s a tiny “program” describing your letter.",
      bodyAr:
        "لكل صف، اكتب عدد المربعات المظللة في ذلك الصف (من صفر إلى خمسة) من اليسار إلى اليمين. صار لديك خمسة أرقام — وصف صغير «مثل البرمجة» لحرفك.",
    },
    {
      titleEn: "Bonus round",
      titleAr: "جولة إضافية",
      bodyEn:
        "Show a parent or friend only your five numbers. Can they guess your letter? That’s how computers often trade compact descriptions instead of big pictures.",
      bodyAr:
        "أرِ والدًا أو صديقًا الأرقام الخمسة فقط. هل يستطيعون تخمين الحرف؟ هكذا تتبادل الحواسيب أحيانًا وصفًا مضغوطًا بدل صورة كبيرة.",
    },
  ],
  hintBodyEn:
    "Think of early video games: letters and icons were often tiny grids of on/off pixels. Font files still use similar ideas today — your grid is a handmade bitmap!",
  hintBodyAr:
    "تخيّل ألعاب الفيديو القديمة: الحروف والأيقونات كانت غالبًا شبكات صغيرة من بكسل مضيء/مطفأ. ملفات الخطوط ما زالت تعتمد أفكارًا مشابهة — شبكتك هي صورة نقطية مصنوعة يدويًا!",
  formTitleEn: "Get next month’s challenge by email",
  formTitleAr: "استقبل تحدي الشهر القادم بالبريد",
  formSubtitleEn:
    "We’ll only use this to share fun projects and occasional tips. You can unsubscribe anytime.",
  formSubtitleAr:
    "نستخدم بريدك فقط لمشاركة مشاريع ممتعة ونصائح مناسبة للأطفال. يمكنك إلغاء الاشتراك في أي وقت.",
  isPublished: true,
};
