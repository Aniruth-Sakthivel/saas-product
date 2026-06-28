"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/config/env";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";

export async function signUpAction(
  _prev: ActionResult<{ needsVerification: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ needsVerification: boolean }>> {
  const parsed = parseInput(signUpSchema, {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.appUrl}/auth/callback`,
    },
  });

  if (error) return fail(error.message);

  // When email confirmation is enabled, there is no active session yet.
  const needsVerification = !data.session;
  if (needsVerification) return ok({ needsVerification: true });

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(signInSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return fail("Invalid email or password.");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestPasswordResetAction(
  _prev: ActionResult<{ sent: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
  const parsed = parseInput(forgotPasswordSchema, {
    email: formData.get("email"),
  });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${env.appUrl}/auth/callback?next=/settings` },
  );
  if (error) return fail(error.message);

  return ok({ sent: true });
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
