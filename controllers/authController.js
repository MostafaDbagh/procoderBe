const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ParentPasswordResetOtp = require("../models/ParentPasswordResetOtp");
const { sendParentPasswordResetOtpEmail } = require("../services/parentPasswordResetMail");
const { sendParentWelcomeEmail } = require("../services/welcomeMail");
const { sendServerError } = require("../utils/safeErrorResponse");
const logger = require("../utils/logger");
const Enrollment = require("../models/Enrollment");
const {
 hasMatchingEnrollmentForParentSignup,
 findMatchingEnrollmentsForParentSignup,
 summarizeChildrenForSignupResponse,
} = require("../utils/parentEnrollmentEligibility");

const signToken = (user) =>
 jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
 expiresIn: "7d",
 });

const formatUser = (user) => ({
 id: user._id,
 name: user.name,
 email: user.email,
 username: user.username || undefined,
 role: user.role,
});

exports.checkParentSignupEligibility = async (req, res) => {
 try {
 const { name, email, phone } = req.body;
 const matches = await findMatchingEnrollmentsForParentSignup(
 email,
 name,
 phone
 );
 const eligible = matches.length > 0;
 const children = eligible
 ? summarizeChildrenForSignupResponse(matches)
 : [];
 res.json({ eligible, children });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.register = async (req, res) => {
 try {
 const { name, email, password, phone } = req.body;

 const existing = await User.findOne({ email });
 if (existing) {
 return res.status(400).json({ message: "Email already registered" });
 }

 const eligible = await hasMatchingEnrollmentForParentSignup(
 email,
 name,
 phone
 );
 if (!eligible) {
 return res.status(400).json({
 message:
 "No enrollment matches this name with the email or phone you entered. Use the same details as on your child’s enrollment, or enroll in a course first.",
 });
 }

 const user = await User.create({ name, email, password, phone });

 const linked = await findMatchingEnrollmentsForParentSignup(
 email,
 name,
 phone
 );
 if (linked.length > 0) {
 await Enrollment.updateMany(
 { _id: { $in: linked.map((r) => r._id) } },
 { $set: { user: user._id } }
 );
 }

 const token = signToken(user);

 res.status(201).json({ token, user: formatUser(user) });

 // Fire welcome email after response — don't block registration on email failure
 sendParentWelcomeEmail(user.email, user.name).catch((err) =>
   logger.error("[welcome-email] failed to send:", err.message)
 );
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.login = async (req, res) => {
 try {
 const { email, password } = req.body;

 const user = await User.findOne({ email }).select("+password");
 // Timing-safe: always run bcrypt compare even if user not found
 // to prevent email enumeration via response time differences
 const dummyHash = "$2a$12$000000000000000000000uGWDDnVVG2e0sweOaGMeJjhtPsG.gIEC";
 const isMatch = await bcrypt.compare(password, user?.password || dummyHash);
 if (!user || !isMatch) {
 logger.warn(`[auth] login failed | email=${email} | IP ${req.ip}`);
 return res.status(400).json({ message: "Invalid credentials" });
 }
 if (user.isActive === false) {
 return res.status(403).json({ message: "Account deactivated" });
 }

 const token = signToken(user);
 res.json({ token, user: formatUser(user) });
 } catch (error) {
 sendServerError(res, error);
 }
};

/** Admin dashboard: requires email + username + password to all match an admin user. */
exports.adminLogin = async (req, res) => {
 try {
 const { email, username, password } = req.body;
 if (!email || !username || !password) {
 return res
 .status(400)
 .json({ message: "Email, username, and password are required" });
 }

 const user = await User.findOne({
 email: String(email).toLowerCase().trim(),
 role: "admin",
 }).select("+password");

 if (!user || !user.username) {
 return res.status(400).json({ message: "Invalid credentials" });
 }
 if (user.isActive === false) {
 return res.status(403).json({ message: "Account deactivated" });
 }

 if (
 user.username.toLowerCase() !== String(username).toLowerCase().trim()
 ) {
 return res.status(400).json({ message: "Invalid credentials" });
 }

 const isMatch = await user.comparePassword(password);
 if (!isMatch) {
 return res.status(400).json({ message: "Invalid credentials" });
 }

 const token = signToken(user);
 res.json({ token, user: formatUser(user) });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.getMe = async (req, res) => {
 try {
 const user = await User.findById(req.user.id).select("-password");
 if (!user) {
 return res.status(404).json({ message: "User not found" });
 }
 res.json(user);
 } catch (error) {
 sendServerError(res, error);
 }
};

const RESET_OTP_EXPIRES_MS = 5 * 60 * 1000;
const RESET_MAX_OTP_ATTEMPTS = 5;
const DEV_MOCK_OTP = "0000";

function isDevMockOtpEnabled() {
 return process.env.DEV_OTP_BYPASS === "true";
}

function generateOtp4() {
 // Local/dev mock OTP to simplify frontend testing when Resend isn't configured yet.
 if (
 isDevMockOtpEnabled() &&
 !String(process.env.RESEND_API_KEY || "").trim()
 ) {
 return DEV_MOCK_OTP;
 }
 return String(crypto.randomInt(0, 10_000)).padStart(4, "0");
}

/** Public: sends email OTP via Resend for parent accounts only (anti-enumeration). */
exports.requestParentPasswordReset = async (req, res) => {
 try {
 const rawEmail = String(req.body.email || "").trim().toLowerCase();
 const locale = req.body.locale === "ar" ? "ar" : "en";
 const generic = {
 ok: true,
 message:
 locale === "ar"
 ? "إذا وُجد حساب ولي أمر بهذا البريد، فستصلك رسالة تحتوي رمز التحقق قريباً."
 : "If a parent account exists for this email, you’ll receive a verification code shortly.",
 };

 if (!rawEmail) {
 return res.status(400).json({ message: "Valid email is required" });
 }

 const user = await User.findOne({ email: rawEmail, role: "parent" })
 .select("_id")
 .lean();
 if (!user) {
 logger.info(`[password-reset] no parent user | ${rawEmail}`);
 return res.json(generic);
 }

 const code = generateOtp4();
 const codeHash = await bcrypt.hash(code, 10);

 await ParentPasswordResetOtp.findOneAndUpdate(
 { email: rawEmail },
 {
 email: rawEmail,
 codeHash,
 expiresAt: new Date(Date.now() + RESET_OTP_EXPIRES_MS),
 attempts: 0,
 },
 { upsert: true }
 );

 try {
 await sendParentPasswordResetOtpEmail(rawEmail, code);
 } catch (e) {
 logger.error("[password-reset] send failed", e);
 await ParentPasswordResetOtp.deleteOne({ email: rawEmail });
 return res.status(503).json({
 message:
 locale === "ar"
 ? "تعذّر إرسال البريد حالياً. حاول لاحقاً أو تواصل مع الدعم."
 : "We couldn’t send the email right now. Please try again later or contact support.",
 });
 }

 return res.json(generic);
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * Public: check OTP only (does not reset password). Same attempt rules as reset.
 * Lets the client show success/error on the OTP screen before the new-password step.
 */
exports.verifyParentResetOtp = async (req, res) => {
 try {
 const rawEmail = String(req.body.email || "").trim().toLowerCase();
 const code = String(req.body.code || "").replace(/\D/g, "");

 if (!rawEmail) {
 return res.status(400).json({ message: "Valid email is required" });
 }
 if (code.length !== 4) {
 return res
 .status(400)
 .json({ message: "Enter the 4-digit code from your email" });
 }

 if (isDevMockOtpEnabled() && code === DEV_MOCK_OTP) {
 return res.json({
 ok: true,
 message: "Code verified. Continue to choose your new password.",
 });
 }

 const parentExists = await User.exists({ email: rawEmail, role: "parent" });
 if (!parentExists) {
 return res
 .status(400)
 .json({ message: "Invalid or expired code. Request a new one." });
 }

 const record = await ParentPasswordResetOtp.findOne({ email: rawEmail });
 if (!record || record.expiresAt.getTime() < Date.now()) {
 return res
 .status(400)
 .json({ message: "Invalid or expired code. Request a new one." });
 }
 if (record.attempts >= RESET_MAX_OTP_ATTEMPTS) {
 await ParentPasswordResetOtp.deleteOne({ _id: record._id });
 return res
 .status(400)
 .json({ message: "Too many attempts. Request a new code." });
 }

 const match = await bcrypt.compare(code, record.codeHash);
 if (!match) {
 record.attempts += 1;
 await record.save();
 return res.status(400).json({ message: "Invalid verification code" });
 }

 res.json({
 ok: true,
 message:
 "Code verified. Continue to choose your new password.",
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

/** Public: verify OTP and set new password (parent only). */
exports.resetParentPasswordWithOtp = async (req, res) => {
 try {
 const rawEmail = String(req.body.email || "").trim().toLowerCase();
 const code = String(req.body.code || "").replace(/\D/g, "");
 const { password } = req.body;

 if (!rawEmail) {
 return res.status(400).json({ message: "Valid email is required" });
 }
 if (code.length !== 4) {
 return res
 .status(400)
 .json({ message: "Enter the 4-digit code from your email" });
 }

 if (isDevMockOtpEnabled() && code === DEV_MOCK_OTP) {
 const user = await User.findOne({ email: rawEmail, role: "parent" }).select(
 "+password"
 );
 if (!user) {
 return res
 .status(400)
 .json({ message: "Invalid or expired code. Request a new one." });
 }
 if (user.isActive === false) {
 return res.status(403).json({ message: "Account deactivated" });
 }
 user.password = password;
 await user.save();
 await ParentPasswordResetOtp.deleteOne({ email: rawEmail });
 return res.json({
 ok: true,
 message: "Password updated. You can sign in with your new password.",
 });
 }

 const record = await ParentPasswordResetOtp.findOne({ email: rawEmail });
 if (!record || record.expiresAt.getTime() < Date.now()) {
 return res
 .status(400)
 .json({ message: "Invalid or expired code. Request a new one." });
 }
 if (record.attempts >= RESET_MAX_OTP_ATTEMPTS) {
 await ParentPasswordResetOtp.deleteOne({ _id: record._id });
 return res
 .status(400)
 .json({ message: "Too many attempts. Request a new code." });
 }

 const match = await bcrypt.compare(code, record.codeHash);
 if (!match) {
 record.attempts += 1;
 await record.save();
 return res.status(400).json({ message: "Invalid verification code" });
 }

 const user = await User.findOne({ email: rawEmail, role: "parent" }).select(
 "+password"
 );
 if (!user) {
 await ParentPasswordResetOtp.deleteOne({ _id: record._id });
 return res
 .status(400)
 .json({ message: "Invalid or expired code. Request a new one." });
 }
 if (user.isActive === false) {
 await ParentPasswordResetOtp.deleteOne({ _id: record._id });
 return res.status(403).json({ message: "Account deactivated" });
 }

 user.password = password;
 await user.save();
 await ParentPasswordResetOtp.deleteOne({ _id: record._id });

 res.json({
 ok: true,
 message: "Password updated. You can sign in with your new password.",
 });
 } catch (error) {
 sendServerError(res, error);
 }
};
