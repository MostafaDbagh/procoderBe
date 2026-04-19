const BlogPost = require("../models/BlogPost");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

// ─── PUBLIC ───

exports.listPublished = async (req, res) => {
 try {
 const { category, tag, region } = req.query;
 const filter = { isPublished: true };
 if (category) filter.category = category;
 if (tag) filter.tags = tag;
 if (region) filter.targetRegions = region;

 const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
 const [total, posts] = await Promise.all([
 BlogPost.countDocuments(filter),
 BlogPost.find(filter)
 .select("-body")
 .sort({ publishedAt: -1 })
 .skip(skip)
 .limit(limit)
 .lean(),
 ]);
 res.set("Cache-Control", "public, max-age=60, s-maxage=300");
 res.json({ items: posts, ...paginationMeta(total, page, limit) });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.getBySlug = async (req, res) => {
 try {
 const post = await BlogPost.findOneAndUpdate(
 { slug: req.params.slug, isPublished: true },
 { $inc: { viewCount: 1 } },
 { new: true }
 ).lean();
 if (!post) return res.status(404).json({ message: "Post not found" });
 res.json(post);
 } catch (error) {
 sendServerError(res, error);
 }
};

// ─── ADMIN ───

exports.listAdmin = async (req, res) => {
 try {
 const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15, maxLimit: 100 });
 const filter = {};
 if (req.query.published === "true") filter.isPublished = true;
 if (req.query.published === "false") filter.isPublished = false;
 if (req.query.category) filter.category = req.query.category;

 const [total, posts] = await Promise.all([
 BlogPost.countDocuments(filter),
 BlogPost.find(filter)
 .select("-body")
 .sort({ createdAt: -1 })
 .skip(skip)
 .limit(limit)
 .lean(),
 ]);
 res.json({ items: posts, ...paginationMeta(total, page, limit) });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.getBySlugAdmin = async (req, res) => {
 try {
 const post = await BlogPost.findOne({ slug: req.params.slug }).lean();
 if (!post) return res.status(404).json({ message: "Post not found" });
 res.json(post);
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.create = async (req, res) => {
 try {
 const data = {
 ...req.body,
 slug: String(req.body.slug || "").trim().toLowerCase().replace(/\s+/g, "-"),
 };
 if (data.isPublished && !data.publishedAt) {
 data.publishedAt = new Date();
 }
 // Estimate read time from English body
 if (data.body?.en) {
 const words = data.body.en.split(/\s+/).length;
 data.readTimeMinutes = Math.max(1, Math.ceil(words / 200));
 }
 const post = await BlogPost.create(data);
 res.status(201).json(post);
 } catch (error) {
 if (error.code === 11000) return res.status(400).json({ message: "Blog slug already exists" });
 sendServerError(res, error);
 }
};

exports.update = async (req, res) => {
 try {
 const updates = { ...req.body };
 if (updates.isPublished && !updates.publishedAt) {
 const existing = await BlogPost.findOne({ slug: req.params.slug }).select("publishedAt").lean();
 if (!existing?.publishedAt) updates.publishedAt = new Date();
 }
 if (updates.body?.en) {
 const words = updates.body.en.split(/\s+/).length;
 updates.readTimeMinutes = Math.max(1, Math.ceil(words / 200));
 }
 const post = await BlogPost.findOneAndUpdate(
 { slug: req.params.slug },
 updates,
 { new: true, runValidators: true }
 );
 if (!post) return res.status(404).json({ message: "Post not found" });
 res.json(post);
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.remove = async (req, res) => {
 try {
 const post = await BlogPost.findOneAndDelete({ slug: req.params.slug });
 if (!post) return res.status(404).json({ message: "Post not found" });
 res.json({ message: "Post deleted" });
 } catch (error) {
 sendServerError(res, error);
 }
};
