"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDealAction } from "@/features/crm/actions";
import { DEAL_STAGES } from "@/features/crm/schemas";

export function DealForm() {
  const [state, formAction] = useActionState(createDealAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Deal added.");
      formRef.current?.reset();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end"
    >
      <Input name="title" placeholder="Deal title *" required />
      <Input name="value" type="number" min="0" step="0.01" placeholder="Value" />
      <Select name="stage" defaultValue="LEAD">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DEAL_STAGES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SubmitButton>Add deal</SubmitButton>
    </form>
  );
}
