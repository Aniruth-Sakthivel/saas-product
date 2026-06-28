"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { signUpAction } from "@/features/auth/actions";

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, null);

  if (state?.ok && state.data.needsVerification) {
    return (
      <div className="rounded-lg border bg-muted/40 p-5 text-center">
        <p className="text-sm font-medium">Check your inbox</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a verification link to your email. Confirm it to finish
          setting up your account.
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
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
        {state && !state.ok && state.fieldErrors?.fullName && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.fullName[0]}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" placeholder="you@hotel.com" required />
        {state && !state.ok && state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
        />
        {state && !state.ok && state.fieldErrors?.password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>
      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
