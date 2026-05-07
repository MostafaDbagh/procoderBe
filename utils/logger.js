/**
 * Tiny logger that gates verbose levels by NODE_ENV.
 *
 * - `error` / `warn`: always written (essential for prod observability).
 * - `info` / `debug`: only when NODE_ENV !== "production" (or LOG_LEVEL=debug
 *   is explicitly set), so dev/diagnostic logs don't leak request payloads
 *   into hosting log aggregators.
 *
 * Use this everywhere except CLI scripts (seed/migrate/etc.), where plain
 * `console.*` is expected for human terminal output.
 */

const isProd = process.env.NODE_ENV === "production";
const verbose = !isProd || process.env.LOG_LEVEL === "debug";

const noop = () => {};

module.exports = {
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  info: verbose ? (...args) => console.info(...args) : noop,
  debug: verbose ? (...args) => console.log(...args) : noop,
};
