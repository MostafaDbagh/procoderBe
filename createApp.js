const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const { recommend } = require("./controllers/recommendController");

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

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
          origin.match(/^http:\/\/localhost:\d+$/) ||
          origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)
        ) {
          return callback(null, true);
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

  app.use(compression());
  app.use(express.json({ limit: "10mb" }));

  const uploadsRoot = path.join(__dirname, "uploads");
  fs.mkdirSync(path.join(uploadsRoot, "team"), { recursive: true });
  app.use("/uploads", express.static(uploadsRoot));

  app.post("/api/recommend", recommend);

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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      method: req.method,
      path: req.originalUrl,
    });
  });

  return app;
}

module.exports = { createApp };
