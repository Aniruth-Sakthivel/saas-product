import { listPlans } from "@/features/admin/services";
import { PageHeader } from "@/components/page-header";
import { PlansManager } from "@/features/admin/components/plans-manager";

export const metadata = { title: "Admin · Plans" };

export default async function AdminPlansPage() {
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Create and manage the platform plan catalog. Changes apply immediately; run Stripe sync to push pricing to Stripe."
      />
      <PlansManager plans={plans} />
    </div>
  );
}
