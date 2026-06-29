/** Delivery channels the platform can send through. */
export type Channel = "email" | "sms" | "push";

/** Where to reach a recipient (only the relevant fields per channel are used). */
export interface Recipient {
  email?: string | null;
  phone?: string | null;
  pushToken?: string | null;
}

/** A rendered message for a single channel. */
export interface RenderedMessage {
  subject?: string;
  /** HTML for email; plain text for sms/push. */
  body: string;
}

/** Result of attempting one channel. */
export interface ChannelResult {
  channel: Channel;
  delivered: boolean;
  detail?: string;
}

/** A channel provider knows how to deliver a rendered message. */
export interface ChannelProvider {
  channel: Channel;
  send(to: Recipient, message: RenderedMessage): Promise<ChannelResult>;
}
