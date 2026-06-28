import { getMemberships, requireActiveContext } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveContext();
  const memberships = await getMemberships(ctx.userId);

  const organizations = memberships.map((m) => ({
    id: m.organization_id,
    name: m.organization.name,
  }));

  return (
    <AppShell
      role={ctx.membership.role}
      userName={ctx.profile?.full_name ?? ctx.profile?.email ?? "User"}
      userEmail={ctx.profile?.email ?? ""}
      orgName={ctx.organization.name}
      organizations={organizations}
    >
      {children}
    </AppShell>
  );
}
