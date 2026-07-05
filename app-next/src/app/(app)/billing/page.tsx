import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getBillingData } from "@/features/billing/services/invoices";
import { InvoicesTable } from "@/features/billing/components/invoices-table";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Billing · HotelOS" };

export default async function BillingPage() {
  const ctx = await requirePermission("billing:manage");
  const data = await getBillingData(ctx.organization.id);
  const canManage = can(ctx.membership.role, "billing:manage");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing"
        description="Invoices and payments, generated from every booking."
      />
      <InvoicesTable
        organizationId={ctx.organization.id}
        currency={ctx.organization.currency}
        data={data}
        canManage={canManage}
      />
    </div>
  );
}
