"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrganizationAction } from "@/features/organizations/actions";
import { cn } from "@/lib/utils";

const STEPS = ["Hotel Info", "Property", "Branding"];
const COLORS = ["#4F46E5", "#059669", "#DC2626", "#F59E0B", "#8B5CF6", "#0EA5E9"];

export function OnboardingWizard() {
  const [state, formAction] = useActionState(createOrganizationAction, null);
  const [step, setStep] = useState(0);
  const [brandColor, setBrandColor] = useState(COLORS[0]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const isLast = step === STEPS.length - 1;

  return (
    <div className="rounded-2xl border bg-card p-7 shadow-sm sm:p-9">
      <ol className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full text-sm font-semibold",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 hidden text-xs font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded",
                  i < step ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </li>
        ))}
      </ol>

      {state && !state.ok && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-5">
        {/* Step 1 — all fields stay mounted so the final submit includes them */}
        <div className={cn("space-y-4", step !== 0 && "hidden")}>
          <h2 className="text-lg font-semibold">Tell us about your hotel</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Hotel name</Label>
            <Input id="name" name="name" placeholder="Grand Marina Hotel" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Hotel type</Label>
            <Select name="type" defaultValue="City Hotel">
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["City Hotel", "Resort", "Boutique Stay", "Hostel", "Serviced Apartments"].map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="120 Harbor View Blvd" />
          </div>
        </div>

        {/* Step 2 */}
        <div className={cn("space-y-4", step !== 1 && "hidden")}>
          <h2 className="text-lg font-semibold">Property setup</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rooms">Number of rooms</Label>
              <Input id="rooms" name="rooms" type="number" defaultValue={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floors">Floors</Label>
              <Input id="floors" name="floors" type="number" defaultValue={5} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue="USD">
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "INR", "AED"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue="UTC">
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["UTC", "America/New_York", "Europe/London", "Asia/Kolkata"].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className={cn("space-y-4", step !== 2 && "hidden")}>
          <h2 className="text-lg font-semibold">Branding</h2>
          <input type="hidden" name="brandColor" value={brandColor} />
          <div>
            <Label>Primary brand color</Label>
            <div className="mt-2 flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setBrandColor(c)}
                  className={cn(
                    "size-9 rounded-full",
                    brandColor === c && "ring-2 ring-offset-2 ring-foreground",
                  )}
                  style={{ background: c }}
                  aria-label={`Select ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {isLast ? (
            <SubmitButton>Create hotel</SubmitButton>
          ) : (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
