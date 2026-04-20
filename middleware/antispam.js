/**
 * Anti-spam middleware for public form endpoints.
 *
 * Layers:
 *  1. Honeypot — rejects if a hidden field (`_hp`) is filled (bots auto-fill all fields)
 *  2. Timing gate — rejects if submission arrives faster than `minMs` after page load
 *  3. Flood detection — per-IP sliding window that blocks after `maxHits` in `windowMs`
 */
const rateLimit = require("express-rate-limit");

// ── 1. Honeypot check ──
function honeypot(req, res, next) {
  // If the hidden `_hp` field has any value a bot filled it in
  if (req.body && req.body._hp) {
    console.warn(`[antispam] honeypot triggered | IP ${req.ip} | ${req.method} ${req.originalUrl}`);
    // Return a fake 200 so bots think it succeeded
    return res.status(200).json({ ok: true });
  }
  next();
}

// ── 2. Timing gate ──
// Clients send `_t` = Date.now() of when the form was first rendered.
// If the delta is below `minMs` (default 3 s) the submission is too fast for a human.
function timingGate(minMs = 3000) {
  return (req, res, next) => {
    const t = Number(req.body?._t);
    if (t && Date.now() - t < minMs) {
      console.warn(`[antispam] timing gate triggered (${Date.now() - t}ms) | IP ${req.ip} | ${req.originalUrl}`);
      return res.status(429).json({ message: "Please slow down and try again" });
    }
    next();
  };
}

// ── 3. Per-endpoint rate limiters (pre-configured) ──

/** Contact form: max 5 submissions per 15 min per IP */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages sent. Please try again later." },
});

/** Enrollment form: max 5 per 15 min per IP */
const enrollmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many enrollment attempts. Please try again later." },
});

/** Promo quote: max 5 per 15 min per IP */
const promoQuoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many promo lookups. Please try again later." },
});

/** AI recommend: max 10 per 15 min per IP (expensive — calls LLM) */
const recommendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many recommendation requests. Please try again later." },
});

/** Signup eligibility check: max 20 per 15 min per IP (polled on keystroke) */
const signupCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

/** Parent password reset — email OTP (Resend): max 5 requests per hour per IP */
const parentPasswordResetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many reset requests. Please try again in an hour or contact support.",
  },
});

/** Parent reset OTP verify: max 30 checks per 15 min per IP */
const parentPasswordResetVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Please try again later." },
});

module.exports = {
  honeypot,
  timingGate,
  contactLimiter,
  enrollmentLimiter,
  promoQuoteLimiter,
  recommendLimiter,
  signupCheckLimiter,
  parentPasswordResetRequestLimiter,
  parentPasswordResetVerifyLimiter,
};
