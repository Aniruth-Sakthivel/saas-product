"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  upsertPlanAction,
  togglePlanActiveAction,
} from "@/features/admin/actions";
import type { Plan } from "@/types/database";

export function PlansManager({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, formAction] = useActionState(upsertPlanAction, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Plan saved.");
      setOpen(false);
      router.refresh();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, router]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(plan: Plan) {
    setEditing(plan);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" /> New plan
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Yearly</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  {plan.currency} {Number(plan.price_monthly).toLocaleString()}
                </TableCell>
                <TableCell>
                  {plan.currency} {Number(plan.price_yearly).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(plan.features) ? plan.features : []).map(
                      (f) => (
                        <Badge key={String(f)} variant="secondary">
                          {String(f)}
                        </Badge>
                      ),
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await togglePlanActiveAction(
                          plan.id,
                          !plan.is_active,
                        );
                        if (res.ok) {
                          toast.success(
                            plan.is_active ? "Plan disabled." : "Plan enabled.",
                          );
                          router.refresh();
                        } else toast.error(res.error);
                      })
                    }
                  >
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(plan)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit plan" : "New plan"}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="grid gap-4 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Name">
              <Input name="name" defaultValue={editing?.name ?? ""} required />
            </Field>
            <Field label="Code">
              <Input
                name="code"
                defaultValue={editing?.code ?? ""}
                placeholder="pro"
                required
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Input
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </Field>
            <Field label="Monthly price">
              <Input
                name="priceMonthly"
                type="number"
                min={0}
                step="0.01"
                defaultValue={Number(editing?.price_monthly ?? 0)}
                required
              />
            </Field>
            <Field label="Yearly price">
              <Input
                name="priceYearly"
                type="number"
                min={0}
                step="0.01"
                defaultValue={Number(editing?.price_yearly ?? 0)}
                required
              />
            </Field>
            <Field label="Currency">
              <Input
                name="currency"
                maxLength={3}
                defaultValue={editing?.currency ?? "USD"}
              />
            </Field>
            <Field label="Sort order">
              <Input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sort_order ?? 0}
              />
            </Field>
            <Field label="Features (comma-separated)" className="sm:col-span-2">
              <Input
                name="features"
                defaultValue={(Array.isArray(editing?.features)
                  ? (editing?.features as string[])
                  : []
                ).join(", ")}
                placeholder="hotel, crm, analytics"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editing ? editing.is_active : true}
                className="size-4"
              />
              Active (available for subscription)
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton>{editing ? "Save changes" : "Create plan"}</SubmitButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
