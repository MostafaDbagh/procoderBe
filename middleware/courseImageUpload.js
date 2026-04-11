const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const uploadDir = path.join(__dirname, "..", "uploads", "courses");

function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageFileFilter = (req, file, cb) => {
  const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
  if (!ok) {
    cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
    return;
  }
  cb(null, true);
};

function buildMulter() {
  if (isCloudinaryConfigured()) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: "courses",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        public_id: `course-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`,
        resource_type: "image",
      }),
    });
    return multer({
      storage,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    });
  }

  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      ensureUploadDir();
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
      const use = allowed.includes(ext) ? ext : ".jpg";
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${use}`);
    },
  });

  return multer({
    storage: diskStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  });
}

const upload = buildMulter();

/** Admin-only: single file field name `photo`. */
exports.courseImageUploadMiddleware = upload.single("photo");

exports.uploadUsesCloudinary = () => isCloudinaryConfigured();
