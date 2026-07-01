import type { Channel, RenderedMessage } from "./types";

/** Known notification templates and the data each expects. */
export interface TemplateData {
  staff_invite: {
    organizationName: string;
    inviterName: string;
    role: string;
    acceptUrl: string;
  };
  payment_received: {
    organizationName: string;
    amount: string;
    invoiceNumber: string;
  };
  subscription_activated: {
    organizationName: string;
    planName: string;
  };
  booking_confirmation: {
    hotelName: string;
    guestName: string;
    code: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    currency: string;
    nightlyRate: number;
    subtotal: number;
    taxes: number;
    total: number;
    invoiceNumber: string;
  };
}

export type TemplateKey = keyof TemplateData;

type Renderers = {
  [K in TemplateKey]: {
    defaultChannels: Channel[];
    render: Partial<Record<Channel, (data: TemplateData[K]) => RenderedMessage>>;
  };
};

function emailShell(title: string, body: string, cta?: { url: string; label: string }) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#111827;margin:0 0 8px">${title}</h2>
    <p style="color:#6B7280;line-height:1.6">${body}</p>
    ${
      cta
        ? `<a href="${cta.url}" style="display:inline-block;margin:16px 0;background:#4F46E5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">${cta.label}</a>`
        : ""
    }
  </div>`;
}

export const TEMPLATES: Renderers = {
  staff_invite: {
    defaultChannels: ["email"],
    render: {
      email: (d) => ({
        subject: `You're invited to ${d.organizationName} on HotelOS`,
        body: emailShell(
          `Join ${d.organizationName}`,
          `${d.inviterName} invited you to join <b>${d.organizationName}</b> as a <b>${d.role}</b>.`,
          { url: d.acceptUrl, label: "Accept invitation" },
        ),
      }),
    },
  },
  payment_received: {
    defaultChannels: ["email"],
    render: {
      email: (d) => ({
        subject: `Payment received · ${d.invoiceNumber}`,
        body: emailShell(
          "Payment received",
          `We received <b>${d.amount}</b> for invoice <b>${d.invoiceNumber}</b> at ${d.organizationName}.`,
        ),
      }),
      sms: (d) => ({ body: `Payment of ${d.amount} received (${d.invoiceNumber}).` }),
    },
  },
  subscription_activated: {
    defaultChannels: ["email"],
    render: {
      email: (d) => ({
        subject: `Your ${d.planName} plan is active`,
        body: emailShell(
          `${d.planName} plan activated`,
          `${d.organizationName} is now on the <b>${d.planName}</b> plan. Thanks for subscribing!`,
        ),
      }),
    },
  },
  booking_confirmation: {
    defaultChannels: ["email"],
    render: {
      email: (d) => ({
        subject: `Booking confirmed · ${d.code} · ${d.hotelName}`,
        body: bookingHtml(d),
      }),
    },
  },
};

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtDate(v: string) {
  return new Date(`${v}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function bookingHtml(d: TemplateData["booking_confirmation"]) {
  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:6px 0;color:#6B7280">${label}</td>
      <td style="padding:6px 0;text-align:right;color:#111827;${strong ? "font-weight:700" : ""}">${value}</td>
    </tr>`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
    <h2 style="margin:0 0 4px">Your stay is confirmed 🎉</h2>
    <p style="color:#6B7280;line-height:1.6;margin:0 0 20px">
      Hi ${d.guestName}, thank you for booking with <b>${d.hotelName}</b>.
      Your confirmation code is <b>${d.code}</b>.
    </p>

    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("Room", d.roomTypeName)}
        ${row("Check-in", fmtDate(d.checkIn))}
        ${row("Check-out", fmtDate(d.checkOut))}
        ${row("Guests", `${d.guests} · ${d.nights} night${d.nights === 1 ? "" : "s"}`)}
      </table>
    </div>

    <h3 style="margin:0 0 8px;font-size:15px">Invoice ${d.invoiceNumber}</h3>
    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row(
          `${money(d.nightlyRate, d.currency)} × ${d.nights} night${d.nights === 1 ? "" : "s"}`,
          money(d.subtotal, d.currency),
        )}
        ${row("Taxes & fees", money(d.taxes, d.currency))}
        <tr><td colspan="2" style="border-top:1px solid #E5E7EB;padding-top:6px"></td></tr>
        ${row("Total", money(d.total, d.currency), true)}
      </table>
    </div>

    <p style="color:#9CA3AF;font-size:12px;margin-top:20px">
      This reservation is pending confirmation at the front desk. Please present
      your code ${d.code} on arrival. Payment is collected at check-in.
    </p>
  </div>`;
}
