const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { createApp } = require("./createApp");

dotenv.config({ override: true });

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 16) {
    console.error(
      "[stem-Be] JWT_SECRET must be set to a strong value (at least 16 characters)."
    );
    process.exit(1);
  }
  await connectDB();
  const app = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log("POST /api/recommend — AI course recommendations");
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
