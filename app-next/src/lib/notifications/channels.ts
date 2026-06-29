import { Resend } from "resend";
import { env } from "@/config/env";
import type { ChannelProvider } from "./types";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

/** Email via Resend. Falls back to a console log when no API key is set. */
export const emailProvider: ChannelProvider = {
  channel: "email",
  async send(to, message) {
    if (!to.email) return { channel: "email", delivered: false, detail: "no email" };
    if (!resend) {
      console.info(`[notify:email] (no RESEND_API_KEY) → ${to.email}: ${message.subject}`);
      return { channel: "email", delivered: false, detail: "no provider" };
    }
    await resend.emails.send({
      from: env.resendFrom,
      to: to.email,
      subject: message.subject ?? "HotelOS",
      html: message.body,
    });
    return { channel: "email", delivered: true };
  },
};

/**
 * SMS provider stub. Wire to Twilio/MSG91 in a later phase; logs for now so the
 * notify() pipeline is exercisable end-to-end without a provider.
 */
export const smsProvider: ChannelProvider = {
  channel: "sms",
  async send(to, message) {
    if (!to.phone) return { channel: "sms", delivered: false, detail: "no phone" };
    console.info(`[notify:sms] (stub) → ${to.phone}: ${message.body}`);
    return { channel: "sms", delivered: false, detail: "stub" };
  },
};

/** Push provider stub. Wire to Expo Push / FCM with the mobile app later. */
export const pushProvider: ChannelProvider = {
  channel: "push",
  async send(to, message) {
    if (!to.pushToken) return { channel: "push", delivered: false, detail: "no token" };
    console.info(`[notify:push] (stub) → ${to.pushToken}: ${message.body}`);
    return { channel: "push", delivered: false, detail: "stub" };
  },
};
