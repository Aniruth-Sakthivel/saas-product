"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { createContactAction } from "@/features/crm/actions";

export function ContactForm() {
  const [state, formAction] = useActionState(createContactAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Contact added.");
      formRef.current?.reset();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
    >
      <Input name="fullName" placeholder="Full name *" required />
      <Input name="companyName" placeholder="Company" />
      <Input name="email" type="email" placeholder="Email" />
      <Input name="phone" placeholder="Phone" />
      <Input name="title" placeholder="Job title" className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton>Add contact</SubmitButton>
      </div>
    </form>
  );
}
