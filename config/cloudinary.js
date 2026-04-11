const cloudinary = require("cloudinary").v2;

/**
 * Configure only from environment — never commit Cloudinary secrets to the repo.
 * Option A: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 * Option B: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
function isCloudinaryConfigured() {
  if (process.env.CLOUDINARY_URL) return true;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
  );
}

const hasUrl = Boolean(process.env.CLOUDINARY_URL);
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const hasTriple = Boolean(cloudName && apiKey && apiSecret);

if (hasTriple) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else if (hasUrl) {
  cloudinary.config();
} else if (!process.env.SUPPRESS_CLOUDINARY_MISSING_WARN) {
  console.warn(
    "[cloudinary] Missing CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET). Team photos use local disk until set."
  );
}

module.exports = { cloudinary, isCloudinaryConfigured };
