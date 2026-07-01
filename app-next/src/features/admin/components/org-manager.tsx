"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  changeOrgPlanAction,
  setOrgStatusAction,
  deleteOrganizationAction,
} from "@/features/admin/actions";
import type { Plan } from "@/types/database";

const STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"] as const;

export function OrgManager({
  organizationId,
  name,
  plans,
  currentPlanId,
  currentStatus,
}: {
  organizationId: string;
  name: string;
  plans: Plan[];
  currentPlanId: string | null;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [planId, setPlanId] = useState(currentPlanId ?? "");
  const [status, setStatus] = useState(currentStatus ?? "ACTIVE");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Something went wrong.");
      else {
        toast.success(msg);
        router.refresh();
      }
    });
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Subscription management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-1.5">
          <Label>Plan</Label>
          <div className="flex gap-2">
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Select a plan
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.currency} {Number(p.price_monthly)}/mo
                </option>
              ))}
            </select>
            <Button
              disabled={pending || !planId || planId === currentPlanId}
              onClick={() =>
                run(
                  () => changeOrgPlanAction({ organizationId, planId }),
                  "Plan updated.",
                )
              }
            >
              Save
            </Button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Status</Label>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={pending || status === currentStatus}
              onClick={() =>
                run(
                  () => setOrgStatusAction({ organizationId, status }),
                  "Status updated.",
                )
              }
            >
              Update
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium text-destructive">Danger zone</p>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  `Delete ${name}? This removes all tenant data and cannot be undone.`,
                )
              ) {
                run(async () => {
                  const res = await deleteOrganizationAction(organizationId);
                  if (res.ok) router.push("/admin/organizations");
                  return res;
                }, "Organization deleted.");
              }
            }}
          >
            Delete organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
