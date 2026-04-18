/**
 * @param {Record<string, unknown>} query - req.query
 * @param {{ defaultLimit?: number; maxLimit?: number }} [opts]
 */
function parsePagination(query, opts = {}) {
  const defaultLimit = opts.defaultLimit ?? 15;
  const maxLimit = opts.maxLimit ?? 100;

  const maxPage = opts.maxPage ?? 10000;
  const pageRaw = parseInt(String(query.page ?? "1"), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, maxPage) : 1;

  let limitRaw = parseInt(String(query.limit ?? ""), 10);
  if (!Number.isFinite(limitRaw) || limitRaw < 1) {
    limitRaw = defaultLimit;
  }
  if (limitRaw > maxLimit) {
    limitRaw = maxLimit;
  }
  const limit = limitRaw;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginationMeta(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages };
}

module.exports = { parsePagination, paginationMeta };
