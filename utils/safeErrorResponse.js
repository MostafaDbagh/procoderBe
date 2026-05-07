const logger = require("./logger");

/**
 * Never expose stack traces or internal error strings to clients in production.
 */
function sendServerError(res, err) {
  if (err) logger.error(err);
  const body = { message: "Server error" };
  if (process.env.NODE_ENV !== "production" && err && err.message) {
    body.detail = err.message;
  }
  return res.status(500).json(body);
}

module.exports = { sendServerError };
