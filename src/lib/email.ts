/**
 * Minimal transactional email sender.
 *
 * Uses Resend's REST API (no SDK dependency) when RESEND_API_KEY is set.
 * Without a key (local dev / before email is configured) it logs the message
 * server-side and returns false, so flows still work for testing.
 *
 * Production env:
 *   RESEND_API_KEY=...                 (resend.com)
 *   EMAIL_FROM="Creators Arena <no-reply@yourdomain.com>"   (verified sender)
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Creators Arena <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping real send to ${opts.to} ("${opts.subject}")`,
    );
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send error", err);
    return false;
  }
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Reset your Creators Arena password",
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4338ca">Reset your password</h2>
        <p>We received a request to reset your Creators Arena password. Click the
        button below to choose a new one. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#6d28d9;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a>
        </p>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#999;font-size:12px">Or paste this link into your browser:<br>${resetUrl}</p>
      </div>`,
  };
}
