import Link from "next/link";
import { redirect } from "next/navigation";
import { Hotel } from "lucide-react";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import { OnboardingWizard } from "@/features/organizations/components/onboarding-wizard";

export const metadata = { title: "Onboarding · HotelOS" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await getMemberships(user.id);
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Hotel className="size-[18px]" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            HotelOS
          </span>
          <span className="ml-auto text-sm text-muted-foreground">
            Need help?{" "}
            <Link href="/login" className="font-medium text-primary">
              Contact us
            </Link>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set up your hotel
          </h1>
          <p className="text-sm text-muted-foreground">
            A few quick details and your workspace is ready.
          </p>
        </div>
        <OnboardingWizard />
      </main>
    </div>
  );
}
