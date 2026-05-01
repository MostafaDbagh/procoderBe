/**
 * Resend Email Service (HTTP API, no SMTP).
 * Works well on Render/Vercel/Railway where SMTP ports can be blocked.
 *
 * Required env:
 * - RESEND_API_KEY
 * - RESEND_FROM_EMAIL (example: noreply@stemtechlab.com)
 *
 * Optional env:
 * - RESEND_FROM_NAME (default: StemTechLab)
 */
async function sendParentPasswordResetOtpEmail(to, code, locale) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[password-reset] RESEND_API_KEY missing — dev OTP for ${to}: ${code} (mock: use 0000 on localhost)`
      );
      return;
    }
    throw new Error("RESEND_API_KEY is not set or empty");
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME?.trim() || "StemTechLab";
  const isAr = locale === "ar";
  const subject = isAr
    ? "رمز إعادة تعيين كلمة المرور — StemTechLab"
    : "Your StemTechLab password reset OTP";

  const html = isAr
    ? `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">${subject}</h2>
      <p style="margin-bottom: 12px;">مرحباً،</p>
      <p style="margin-bottom: 12px;">رمز التحقق الخاص بك هو:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; color: #0f172a;">${code}</p>
      <p style="margin-bottom: 12px;">هذا الرمز صالح لمدة 5 دقائق. الرجاء عدم مشاركته مع أي شخص.</p>
      <p style="margin-top: 24px; color: #64748b;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.</p>
      <p style="margin-top: 24px;">مع التحية،<br/>${fromName}</p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">${subject}</h2>
      <p style="margin-bottom: 12px;">Hello,</p>
      <p style="margin-bottom: 12px;">Your One-Time Password (OTP) is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; color: #0f172a;">${code}</p>
      <p style="margin-bottom: 12px;">This code will expire in 5 minutes. Please do not share this code with anyone.</p>
      <p style="margin-top: 24px; color: #64748b;">If you did not request this OTP, please ignore this message.</p>
      <p style="margin-top: 24px;">Regards,<br/>${fromName}</p>
    </div>
  `;

  const text = isAr
    ? `رمز التحقق الخاص بك هو ${code}. هذا الرمز صالح لمدة 5 دقائق.`
    : `Your OTP is ${code}. This code will expire in 5 minutes.`;

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
    const msg =
      errorData?.message || errorData?.error || response.statusText || "send failed";
    throw new Error(`Resend API error: ${response.status} - ${msg}`);
  }

  const data = await response.json().catch(() => null);
  if (process.env.NODE_ENV !== "production") {
    console.info("[EMAIL_SUCCESS] OTP email sent via Resend", {
      email: to,
      resendId: data?.id,
    });
  }
}

module.exports = { sendParentPasswordResetOtpEmail };
