import { Resend } from "resend";
import { env } from "@/config/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

interface InviteEmailInput {
  to: string;
  organizationName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}

/**
 * Sends a staff invite email. When RESEND_API_KEY is absent, logs the invite
 * link instead so development still works without email configured.
 */
export async function sendInviteEmail(input: InviteEmailInput) {
  if (!resend) {
    console.info(
      `[email] (no RESEND_API_KEY) invite for ${input.to} → ${input.acceptUrl}`,
    );
    return { delivered: false as const, url: input.acceptUrl };
  }

  await resend.emails.send({
    from: env.resendFrom,
    to: input.to,
    subject: `You're invited to ${input.organizationName} on HotelOS`,
    html: inviteHtml(input),
  });

  return { delivered: true as const, url: input.acceptUrl };
}

function inviteHtml(i: InviteEmailInput) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#111827;margin:0 0 8px">Join ${i.organizationName}</h2>
    <p style="color:#6B7280;line-height:1.6">
      ${i.inviterName} invited you to join <b>${i.organizationName}</b> on HotelOS
      as a <b>${i.role}</b>.
    </p>
    <a href="${i.acceptUrl}"
       style="display:inline-block;margin:16px 0;background:#4F46E5;color:#fff;
              text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">
      Accept invitation
    </a>
    <p style="color:#9CA3AF;font-size:12px">
      If you weren't expecting this, you can ignore this email.
    </p>
  </div>`;
}
