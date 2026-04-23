const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const { recommend } = require("./controllers/recommendController");
const { recommendLimiter } = require("./middleware/antispam");

function allowedOriginsSet() {
  const set = new Set();
  const add = (u) => {
    if (!u) return;
    const s = String(u).trim().replace(/\/$/, "");
    if (s) set.add(s);
  };
  add(process.env.CLIENT_URL);
  const extra = process.env.ALLOWED_ORIGINS || "";
  for (const part of extra.split(/[\s,]+/)) add(part);
  return set;
}

/**
 * Express app (no listen, no DB). Used by server.js and tests.
 */
function createApp() {
  const app = express();
  const allowedOrigins = allowedOriginsSet();

  if (process.env.NODE_ENV === "production" && allowedOrigins.size === 0) {
    console.warn(
      "[stem-Be] No CLIENT_URL or ALLOWED_ORIGINS set — only same-origin/no-origin and localhost browsers can call the API. Set CLIENT_URL to your Next.js site origin."
    );
  }

  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  // ── Security headers ──
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // ── CORS ──
  const isProd = process.env.NODE_ENV === "production";
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        // In production, only allow explicit origins — no localhost
        if (!isProd) {
          if (
            origin.match(/^http:\/\/localhost:(3000|5000)$/) ||
            origin.match(/^http:\/\/127\.0\.0\.1:(3000|5000)$/)
          ) {
            return callback(null, true);
          }
        }
        const normalized = origin.replace(/\/$/, "");
        if (allowedOrigins.has(normalized)) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  // ── HTTPS enforcement in production ──
  if (isProd) {
    app.use((req, res, next) => {
      if (req.headers["x-forwarded-proto"] !== "https") {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
      next();
    });
  }

  // ── Global rate limit ──
  // Skip for authenticated requests (admin dashboard makes many rapid calls)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isProd ? 300 : 5000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later" },
      skip: (req) => !!req.headers.authorization,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: "1mb" }));

  const uploadsRoot = path.join(__dirname, "uploads");
  fs.mkdirSync(path.join(uploadsRoot, "team"), { recursive: true });
  app.use("/uploads", express.static(uploadsRoot));

  app.post("/api/recommend", recommendLimiter, recommend);

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/categories", require("./routes/categories"));
  app.use("/api/courses", require("./routes/courses"));
  app.use("/api/promos", require("./routes/promos"));
  app.use("/api/enrollments", require("./routes/enrollments"));
  app.use("/api/contact", require("./routes/contact"));
  app.use("/api/parent", require("./routes/parent"));
  app.use("/api/instructor", require("./routes/instructor"));
  app.use("/api/team", require("./routes/team"));
  app.use("/api/challenges", require("./routes/challenges"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api/blog", require("./routes/blog"));
  app.use("/api/referrals", require("./routes/referral"));
  app.use("/api/careers", require("./routes/careers"));
  app.use("/api/pricing", require("./routes/pricing"));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
}

module.exports = { createApp };
