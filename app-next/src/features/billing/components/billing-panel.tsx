import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/types/database";
import type { SubscriptionOverview } from "@/features/billing/services/subscription";
import { PlanActions } from "@/features/billing/components/plan-actions";

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  "default" | "secondary" | "destructive"
> = {
  TRIALING: "default",
  ACTIVE: "default",
  PAST_DUE: "destructive",
  CANCELED: "destructive",
  INCOMPLETE: "secondary",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: "Trial",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
};

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null | undefined;
}) {
  const unlimited = limit === null || limit === undefined;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const over = !unlimited && used >= (limit as number);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function BillingPanel({ overview }: { overview: SubscriptionOverview }) {
  const { entitlements, usage, trialDaysLeft } = overview;

  if (!entitlements) {
    return (
      <p className="text-sm text-muted-foreground">
        No active subscription for this workspace.
      </p>
    );
  }

  const { plan, subscription, features, limits } = entitlements;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-lg font-semibold">{plan.name} plan</p>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[subscription.status]}>
          {STATUS_LABEL[subscription.status]}
        </Badge>
        {trialDaysLeft !== null && (
          <span className="text-sm text-muted-foreground">
            {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left in trial
          </span>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Usage
        </p>
        <div className="grid max-w-md gap-3">
          <UsageRow label="Rooms" used={usage.rooms} limit={limits.rooms} />
          <UsageRow label="Staff" used={usage.staff} limit={limits.staff} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Included features
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[...features].map((f) => (
            <Badge key={f} variant="secondary">
              {f}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Change plan
        </p>
        <PlanActions
          plans={overview.availablePlans}
          currentPlanCode={plan.code}
        />
      </div>
    </div>
  );
}
