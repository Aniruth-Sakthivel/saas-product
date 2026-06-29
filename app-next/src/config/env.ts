/** Centralized, typed access to environment variables. */

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Surfaced at runtime when a server feature needs the var. The build
    // itself does not require these to be present.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  get supabaseServiceRoleKey() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFrom: process.env.RESEND_FROM_EMAIL ?? "HotelOS <onboarding@resend.dev>",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
  },
} as const;

export function assertSupabasePublicEnv() {
  required("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl);
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.supabaseAnonKey);
}
