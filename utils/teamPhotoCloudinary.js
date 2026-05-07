const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const logger = require("./logger");

/**
 * Remove an image from Cloudinary (by public_id). Used for team + course assets.
 */
async function destroyCloudinaryImage(publicId) {
  const id = String(publicId || "").trim();
  if (!id || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(id, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn("[cloudinary] destroy failed:", id, msg);
  }
}

module.exports = {
  destroyCloudinaryImage,
  /** @deprecated use destroyCloudinaryImage */
  destroyTeamMemberPhoto: destroyCloudinaryImage,
};
