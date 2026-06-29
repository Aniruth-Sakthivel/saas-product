import { requireFeatureContext } from "@/lib/auth";
import { CrmShell } from "@/components/crm/crm-shell";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gates the whole CRM product behind the `crm` entitlement.
  const ctx = await requireFeatureContext("crm");
  return <CrmShell orgName={ctx.organization.name}>{children}</CrmShell>;
}
