/**
 * Pure helpers for payment summaries (used in overview + tests).
 * @param {{ currency?: string; amountCents?: number; refundedCents?: number }[]} rows
 */
function summarizeSucceededNetByCurrency(rows) {
  const byCurrency = {};
  let totalCount = 0;
  for (const r of rows) {
    const cur = (r.currency || "USD").toUpperCase();
    const gross = Math.max(0, Number(r.amountCents) || 0);
    const ref = Math.max(0, Number(r.refundedCents) || 0);
    const net = Math.max(0, gross - ref);
    if (!byCurrency[cur]) {
      byCurrency[cur] = { grossCents: 0, netCents: 0, count: 0 };
    }
    byCurrency[cur].grossCents += gross;
    byCurrency[cur].netCents += net;
    byCurrency[cur].count += 1;
    totalCount += 1;
  }
  return { byCurrency, totalCount };
}

function centsToMoneyMap(byCurrency) {
  const out = {};
  for (const [cur, v] of Object.entries(byCurrency)) {
    out[cur] = {
      gross: Math.round(v.grossCents) / 100,
      net: Math.round(v.netCents) / 100,
      count: v.count,
    };
  }
  return out;
}

module.exports = { summarizeSucceededNetByCurrency, centsToMoneyMap };
