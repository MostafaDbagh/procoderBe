const logger = require("../utils/logger");

/**
 * Welcome email sent once on parent registration.
 * Required env: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME
 */
async function sendParentWelcomeEmail(to, parentName) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn(`[welcome] RESEND_API_KEY missing — skipping welcome email for ${to}`);
      return;
    }
    throw new Error("RESEND_API_KEY is not set");
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const fromName  = process.env.RESEND_FROM_NAME?.trim()  || "StemTechLab";
  const siteUrl   = "https://www.stemtechlab.com";

  const subject = `Welcome to StemTechLab, ${parentName}! 🌟`;
  const html  = buildEn(parentName, siteUrl, fromName);
  const text  = `Hi ${parentName}, welcome to StemTechLab! Explore courses at ${siteUrl}/en/courses`;

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
    const err = await response.json().catch(() => ({}));
    const msg = err?.message || err?.error || response.statusText || "send failed";
    throw new Error(`Resend API error: ${response.status} - ${msg}`);
  }

  const data = await response.json().catch(() => null);
  logger.info("[EMAIL_SUCCESS] Welcome email sent", { email: to, resendId: data?.id });
}

function buildEn(name, siteUrl, fromName) {
  const first = name.split(" ")[0];
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to StemTechLab</title></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(167,139,250,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 60%,#5CC4A0 100%);padding:40px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">StemTechLab</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:0.5px;">Where every child discovers the joy of learning</p>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="padding:40px 40px 24px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">🎉</div>
            <h2 style="margin:0 0 12px;color:#1e1b4b;font-size:24px;font-weight:700;">Welcome, ${first}!</h2>
            <p style="margin:0;color:#6b7280;font-size:16px;line-height:1.7;max-width:440px;margin:0 auto;">
              We're so happy to have your family with us. Your child's learning adventure starts right here — live classes, caring teachers, and a little AI magic to find the perfect fit.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e9d5ff,transparent);"></div></td></tr>

        <!-- What's next cards -->
        <tr>
          <td style="padding:32px 40px 24px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;font-weight:600;text-align:center;">Here's what you can do right now:</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 0 12px;">
                  <div style="background:#f5f3ff;border-radius:14px;padding:20px 24px;display:flex;align-items:center;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td width="48" style="vertical-align:middle;padding-right:16px;">
                        <div style="font-size:32px;line-height:1;">🤖</div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0 0 3px;color:#1e1b4b;font-size:14px;font-weight:700;">AI Course Finder</p>
                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Tell us about your child — our AI analyses their learning behaviour and finds the right course fit</p>
                      </td>
                    </tr></table>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 12px;">
                  <div style="background:#f0fdf9;border-radius:14px;padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td width="48" style="vertical-align:middle;padding-right:16px;">
                        <div style="font-size:32px;line-height:1;">📊</div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0 0 3px;color:#1e1b4b;font-size:14px;font-weight:700;">Parent Dashboard</p>
                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Track your child's progress, read teacher notes, and stay up to date after every session</p>
                      </td>
                    </tr></table>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 4px;">
                  <div style="background:#fdf4ff;border-radius:14px;padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td width="48" style="vertical-align:middle;padding-right:16px;">
                        <div style="font-size:32px;line-height:1;">🎁</div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0 0 3px;color:#1e1b4b;font-size:14px;font-weight:700;">Free Trial Class</p>
                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Book a free 60-minute live class — no credit card, no commitment</p>
                      </td>
                    </tr></table>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:8px 40px 40px;text-align:center;">
            <a href="${siteUrl}/en/courses" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:14px;box-shadow:0 4px 16px rgba(124,58,237,0.3);">
              Explore Courses →
            </a>
            <br>
            <a href="${siteUrl}/en/recommend" style="display:inline-block;margin-top:12px;color:#a78bfa;font-size:14px;text-decoration:none;font-weight:600;">Or let our AI find the right course for your child ✨</a>
          </td>
        </tr>

        <!-- Warm note -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:linear-gradient(135deg,#f5f3ff,#f0fdf9);border-radius:14px;padding:24px;border-left:4px solid #a78bfa;">
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.8;font-style:italic;">
                "Every child has a spark. Our teachers are here to help it shine. We're honoured to be part of your family's journey."
              </p>
              <p style="margin:12px 0 0;color:#a78bfa;font-size:13px;font-weight:700;">— The StemTechLab Team</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e1b4b;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.6);font-size:12px;">Questions? Reply to this email or reach us at</p>
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

module.exports = { sendParentWelcomeEmail };
