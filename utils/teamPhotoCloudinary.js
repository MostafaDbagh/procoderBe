const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

/**
 * Remove a team member image from Cloudinary (by public_id).
 */
async function destroyTeamMemberPhoto(publicId) {
  const id = String(publicId || "").trim();
  if (!id || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(id, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[team] Cloudinary destroy failed:", id, msg);
  }
}

module.exports = { destroyTeamMemberPhoto };
