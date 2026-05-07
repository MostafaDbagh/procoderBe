/**
 * Unit tests for utils/logger.js — confirms NODE_ENV gating works:
 *  - error/warn always log
 *  - info/debug log in dev / when LOG_LEVEL=debug
 *  - info/debug are no-ops in production unless LOG_LEVEL=debug
 *
 * Pure unit test — no DB, no network. Always runs.
 */
const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

function freshLogger(envOverrides) {
  // Wipe require cache so the logger module re-reads NODE_ENV / LOG_LEVEL.
  const path = require.resolve("../utils/logger");
  delete require.cache[path];
  const prevEnv = process.env.NODE_ENV;
  const prevLog = process.env.LOG_LEVEL;
  if ("NODE_ENV" in envOverrides) process.env.NODE_ENV = envOverrides.NODE_ENV;
  if ("LOG_LEVEL" in envOverrides) process.env.LOG_LEVEL = envOverrides.LOG_LEVEL;
  const logger = require("../utils/logger");
  return {
    logger,
    restore: () => {
      process.env.NODE_ENV = prevEnv;
      process.env.LOG_LEVEL = prevLog;
      delete require.cache[path];
    },
  };
}

function captureConsole() {
  const calls = { log: [], info: [], warn: [], error: [] };
  const orig = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  console.log = (...a) => calls.log.push(a);
  console.info = (...a) => calls.info.push(a);
  console.warn = (...a) => calls.warn.push(a);
  console.error = (...a) => calls.error.push(a);
  return {
    calls,
    restore: () => {
      console.log = orig.log;
      console.info = orig.info;
      console.warn = orig.warn;
      console.error = orig.error;
    },
  };
}

describe("utils/logger — NODE_ENV gating", () => {
  let restoreEnv;
  let restoreConsole;
  let calls;

  beforeEach(() => {
    const cap = captureConsole();
    calls = cap.calls;
    restoreConsole = cap.restore;
  });

  afterEach(() => {
    restoreConsole();
    if (restoreEnv) restoreEnv();
  });

  test("dev mode: error / warn / info / debug all log", () => {
    const { logger, restore } = freshLogger({ NODE_ENV: "development", LOG_LEVEL: "" });
    restoreEnv = restore;
    logger.error("e");
    logger.warn("w");
    logger.info("i");
    logger.debug("d");
    assert.equal(calls.error.length, 1);
    assert.equal(calls.warn.length, 1);
    assert.equal(calls.info.length, 1);
    assert.equal(calls.log.length, 1, "debug routes through console.log");
  });

  test("production: error and warn log; info and debug are silenced", () => {
    const { logger, restore } = freshLogger({ NODE_ENV: "production", LOG_LEVEL: "" });
    restoreEnv = restore;
    logger.error("e");
    logger.warn("w");
    logger.info("i");
    logger.debug("d");
    assert.equal(calls.error.length, 1, "error must still log in prod");
    assert.equal(calls.warn.length, 1, "warn must still log in prod");
    assert.equal(calls.info.length, 0, "info must be silenced in prod");
    assert.equal(calls.log.length, 0, "debug must be silenced in prod");
  });

  test("production with LOG_LEVEL=debug: all four log", () => {
    const { logger, restore } = freshLogger({ NODE_ENV: "production", LOG_LEVEL: "debug" });
    restoreEnv = restore;
    logger.error("e");
    logger.warn("w");
    logger.info("i");
    logger.debug("d");
    assert.equal(calls.error.length, 1);
    assert.equal(calls.warn.length, 1);
    assert.equal(calls.info.length, 1, "LOG_LEVEL=debug overrides prod silencing");
    assert.equal(calls.log.length, 1, "LOG_LEVEL=debug overrides prod silencing");
  });

  test("logger forwards arguments to underlying console fn", () => {
    const { logger, restore } = freshLogger({ NODE_ENV: "development", LOG_LEVEL: "" });
    restoreEnv = restore;
    const obj = { x: 1 };
    logger.error("first", 2, obj);
    assert.deepEqual(calls.error[0], ["first", 2, obj]);
  });
});
