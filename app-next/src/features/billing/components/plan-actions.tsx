"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSessionAction } from "@/features/billing/actions";
import type { BillingInterval, Plan } from "@/types/database";

/** Upgrade/switch buttons that launch Stripe Checkout for each paid plan. */
export function PlanActions({
  plans,
  currentPlanCode,
}: {
  plans: Plan[];
  currentPlanCode: string | null;
}) {
  const [interval, setInterval] = useState<BillingInterval>("MONTHLY");
  const [pending, startTransition] = useTransition();
  const [busyCode, setBusyCode] = useState<string | null>(null);

  function checkout(code: string) {
    setBusyCode(code);
    startTransition(async () => {
      const res = await createCheckoutSessionAction(code, interval);
      // On success the action redirects; we only get here on failure.
      if (res && !res.ok) toast.error(res.error);
      setBusyCode(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border p-0.5 text-sm">
        {(["MONTHLY", "YEARLY"] as const).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInterval(i)}
            className={`rounded-md px-3 py-1 ${
              interval === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {i === "MONTHLY" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          const price = interval === "YEARLY" ? plan.price_yearly : plan.price_monthly;
          return (
            <Button
              key={plan.id}
              variant={isCurrent ? "secondary" : "default"}
              disabled={isCurrent || pending}
              onClick={() => checkout(plan.code)}
            >
              {busyCode === plan.code
                ? "Redirecting…"
                : isCurrent
                  ? `Current: ${plan.name}`
                  : `Upgrade to ${plan.name} · ${plan.currency} ${price}/${interval === "YEARLY" ? "yr" : "mo"}`}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
