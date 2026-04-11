/**
 * @param {{ price?: number; discountPercent?: number; currency?: string }} course
 */
function priceAfterCourseDiscount(course) {
  const list = Math.max(0, Number(course.price) || 0);
  const d = Math.min(100, Math.max(0, Number(course.discountPercent) || 0));
  return Math.round(list * (1 - d / 100) * 100) / 100;
}

/**
 * @param {number} amount - major units
 * @param {{ discountType: 'percent'|'fixed'; discountValue: number; currency?: string }} promo
 * @param {string} courseCurrency
 */
function applyPromo(amount, promo, courseCurrency) {
  if (!promo || amount <= 0) {
    return { final: amount, saved: 0 };
  }
  if (promo.discountType === "percent") {
    const pct = Math.min(100, Math.max(0, Number(promo.discountValue) || 0));
    const off = Math.round(amount * (pct / 100) * 100) / 100;
    const final = Math.max(0, Math.round((amount - off) * 100) / 100);
    return { final, saved: Math.round((amount - final) * 100) / 100 };
  }
  const curP = String(promo.currency || "USD").toUpperCase();
  const curC = String(courseCurrency || "USD").toUpperCase();
  if (curP !== curC) {
    return { final: amount, saved: 0, error: "promo_currency_mismatch" };
  }
  const off = Math.min(amount, Math.max(0, Number(promo.discountValue) || 0));
  const final = Math.max(0, Math.round((amount - off) * 100) / 100);
  return { final, saved: Math.round((amount - final) * 100) / 100 };
}

module.exports = { priceAfterCourseDiscount, applyPromo };
