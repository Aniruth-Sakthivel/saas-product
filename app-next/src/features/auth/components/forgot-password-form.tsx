"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { requestPasswordResetAction } from "@/features/auth/actions";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, null);

  if (state?.ok && state.data.sent) {
    return (
      <div className="rounded-lg border bg-muted/40 p-5 text-center">
        <p className="text-sm font-medium">Reset link sent</p>
        <p className="mt-1 text-sm text-muted-foreground">
          If an account exists for that email, you&apos;ll receive a password
          reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@hotel.com" required />
        {state && !state.ok && state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </form>
  );
}
