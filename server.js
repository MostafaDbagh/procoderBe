const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const { recommend } = require("./controllers/recommendController");

const app = express();

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

const allowedOrigins = allowedOriginsSet();

if (process.env.NODE_ENV === "production" && allowedOrigins.size === 0) {
  console.warn(
    "[stem-Be] No CLIENT_URL or ALLOWED_ORIGINS set — only same-origin/no-origin and localhost browsers can call the API. Set CLIENT_URL to your Next.js site origin."
  );
}

// Behind Railway/Render/Fly/nginx, set TRUST_PROXY=1 so req.ip / secure cookies behave correctly.
if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

// Middleware
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
app.use(express.json());

// Recommend first so POST /api/recommend is never shadowed by other /api routers
app.post("/api/recommend", recommend);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/enrollments", require("./routes/enrollments"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/parent", require("./routes/parent"));
app.use("/api/instructor", require("./routes/instructor"));
app.use("/api/team", require("./routes/team"));
app.use("/api/challenges", require("./routes/challenges"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// JSON404 for unknown API paths (easier to debug than Express default HTML/text)
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    method: req.method,
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log("POST /api/recommend — AI course recommendations");
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
