import "server-only";
import { emailProvider, smsProvider, pushProvider } from "./channels";
import { TEMPLATES, type TemplateKey, type TemplateData } from "./templates";
import type { Channel, ChannelProvider, ChannelResult, Recipient } from "./types";

const PROVIDERS: Record<Channel, ChannelProvider> = {
  email: emailProvider,
  sms: smsProvider,
  push: pushProvider,
};

export interface NotifyInput<K extends TemplateKey> {
  to: Recipient;
  template: K;
  data: TemplateData[K];
  /** Override the template's default channels. */
  channels?: Channel[];
}

/**
 * Renders a template and delivers it across the requested channels. This is the
 * single entry point for all platform notifications (email/sms/push). Providers
 * that aren't configured log and report `delivered: false` rather than throwing,
 * so a missing SMS provider never breaks a flow.
 */
export async function notify<K extends TemplateKey>(
  input: NotifyInput<K>,
): Promise<ChannelResult[]> {
  const tpl = TEMPLATES[input.template];
  const channels = input.channels ?? tpl.defaultChannels;

  const results = await Promise.all(
    channels.map(async (channel) => {
      const renderer = tpl.render[channel];
      if (!renderer) {
        return { channel, delivered: false, detail: "no renderer" } as ChannelResult;
      }
      const message = renderer(input.data);
      return PROVIDERS[channel].send(input.to, message);
    }),
  );

  return results;
}

export type { Channel, ChannelResult, Recipient } from "./types";
export type { TemplateKey } from "./templates";
