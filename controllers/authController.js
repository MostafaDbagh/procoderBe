const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendServerError } = require("../utils/safeErrorResponse");
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
 const bcrypt = require("bcryptjs");
 const dummyHash = "$2a$12$000000000000000000000uGWDDnVVG2e0sweOaGMeJjhtPsG.gIEC";
 const isMatch = await bcrypt.compare(password, user?.password || dummyHash);
 if (!user || !isMatch) {
 console.warn(`[auth] login failed | email=${email} | IP ${req.ip}`);
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
