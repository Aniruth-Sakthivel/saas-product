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
};
