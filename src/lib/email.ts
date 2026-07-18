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

/** Invitation email for a new admin-panel account (set-password link). */
export function adminInviteEmail(
  inviteUrl: string,
  opts: { name: string; roleLabel: string },
): { subject: string; html: string } {
  return {
    subject: "You've been invited to the Creators admin panel",
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4338ca">Welcome, ${opts.name}</h2>
        <p>You've been added to the Creators admin panel as
        <strong>${opts.roleLabel}</strong>. Click the button below to set your
        password and sign in. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${inviteUrl}" style="background:#6d28d9;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Set your password</a>
        </p>
        <p style="color:#999;font-size:12px">Or paste this link into your browser:<br>${inviteUrl}</p>
      </div>`,
  };
}

/** Notifies staff that a new site-visit booking (lead) has come in. */
export function siteVisitLeadEmail(b: {
  name: string;
  phone: string;
  propertyName: string;
  visitDate: string;
  visitTime: string;
}): { subject: string; html: string } {
  return {
    subject: `New site-visit request — ${b.propertyName}`,
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4338ca">New site-visit request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0;font-weight:600">${b.name}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0;font-weight:600">${b.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Property</td><td style="padding:6px 0;font-weight:600">${b.propertyName}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Requested</td><td style="padding:6px 0;font-weight:600">${b.visitDate} at ${b.visitTime}</td></tr>
        </table>
        <p style="color:#999;font-size:12px;margin-top:16px">This lead is also saved in the admin &ldquo;Site Visits&rdquo; page.</p>
      </div>`,
  };
}
