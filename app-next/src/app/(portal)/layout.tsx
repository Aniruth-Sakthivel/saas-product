import { requireActiveContext } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveContext();

  return (
    <PortalShell
      userName={ctx.profile?.full_name ?? ctx.profile?.email ?? "User"}
      userEmail={ctx.profile?.email ?? ""}
      orgName={ctx.organization.name}
    >
      {children}
    </PortalShell>
  );
}
