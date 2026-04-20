const { Resend } = require("resend");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} to
 * @param {string} code — 4-digit OTP (plain); never log in production except via dev fallback below
 * @param {"en"|"ar"} locale
 */
async function sendParentPasswordResetOtpEmail(to, code, locale) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[password-reset] RESEND_API_KEY missing — dev OTP for ${to}: ${code}`);
      return;
    }
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(key);
  const from =
    process.env.RESEND_FROM?.trim() || "StemTechLab <onboarding@resend.dev>";

  const isAr = locale === "ar";
  const subject = isAr
    ? "رمز إعادة تعيين كلمة المرور — StemTechLab"
    : "Your StemTechLab password reset code";

  const safeCode = escapeHtml(code);
  const html = isAr
    ? `<p>مرحباً،</p>
<p>رمز التحقق لإعادة تعيين كلمة مرور حساب ولي الأمر في StemTechLab:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${safeCode}</p>
<p>صالح لمدة 15 دقيقة. إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.</p>
<p>— فريق StemTechLab</p>`
    : `<p>Hello,</p>
<p>Your verification code to reset your StemTechLab parent account password:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${safeCode}</p>
<p>This code expires in 15 minutes. If you didn’t request a password reset, you can ignore this email.</p>
<p>— The StemTechLab team</p>`;

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }
}

module.exports = { sendParentPasswordResetOtpEmail };
