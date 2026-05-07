const logger = require("../utils/logger");

/**
 * Password reset OTP email via Resend.
 * Required env: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME
 */
async function sendParentPasswordResetOtpEmail(to, code) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn(
        `[password-reset] RESEND_API_KEY missing — dev OTP for ${to}: ${code} (mock: use 0000 on localhost)`
      );
      return;
    }
    throw new Error("RESEND_API_KEY is not set or empty");
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const fromName  = process.env.RESEND_FROM_NAME?.trim()  || "StemTechLab";

  const subject = "Your StemTechLab password reset code";
  const html    = buildEn(code, fromName);
  const text    = `Your OTP is ${code}. This code expires in 5 minutes.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.message || errorData?.error || response.statusText || "send failed";
    throw new Error(`Resend API error: ${response.status} - ${msg}`);
  }

  const data = await response.json().catch(() => null);
  logger.info("[EMAIL_SUCCESS] OTP email sent via Resend", { email: to, resendId: data?.id });
}

function buildEn(code, fromName) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Password Reset</title></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(167,139,250,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 60%,#5CC4A0 100%);padding:36px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">StemTechLab</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Where every child discovers the joy of learning</p>
          </td>
        </tr>

        <!-- Icon + Title -->
        <tr>
          <td style="padding:40px 40px 24px;text-align:center;">
            <div style="display:inline-block;background:#f5f3ff;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">🔐</div>
            <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">Password Reset Request</h2>
            <p style="margin:0 auto;color:#6b7280;font-size:15px;line-height:1.7;max-width:400px;">
              Use the code below to reset your password. It expires in <strong>5 minutes</strong>.
            </p>
          </td>
        </tr>

        <!-- OTP Code -->
        <tr>
          <td style="padding:0 40px 36px;text-align:center;">
            <div style="display:inline-block;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px solid #a78bfa;border-radius:16px;padding:24px 48px;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Your verification code</p>
              <p style="margin:0;color:#7c3aed;font-size:42px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">${code}</p>
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e9d5ff,transparent);"></div></td></tr>

        <!-- Security note -->
        <tr>
          <td style="padding:28px 40px 36px;">
            <div style="background:#fdf4ff;border-radius:12px;padding:18px 20px;border-left:4px solid #C88DA8;">
              <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
                🔒 <strong>Security reminder:</strong> Never share this code with anyone. StemTechLab staff will never ask for it. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e1b4b;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.6);font-size:12px;">Need help? Contact us at</p>
            <a href="mailto:contact@stemtechlab.com" style="color:#a78bfa;font-size:13px;font-weight:600;text-decoration:none;">contact@stemtechlab.com</a>
            <p style="margin:16px 0 0;color:rgba(255,255,255,0.35);font-size:11px;">© ${new Date().getFullYear()} ${fromName} · UAE · Netherlands · Germany</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { sendParentPasswordResetOtpEmail };
