/** Bound optional dependencies so the verified local result remains available. */
async function withDeadline(operation, milliseconds, fallback) {
  const abort = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(abort.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => { abort.abort(); reject(new Error('Dependency deadline exceeded')); }, milliseconds);
      }),
    ]);
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
}
module.exports = { withDeadline };
