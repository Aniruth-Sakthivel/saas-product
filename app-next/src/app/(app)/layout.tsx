import { getMemberships, requireActiveContext } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { listNotifications } from "@/features/notifications/services";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveContext();
  const [memberships, notifications] = await Promise.all([
    getMemberships(ctx.userId),
    listNotifications(ctx.organization.id),
  ]);

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
      orgId={ctx.organization.id}
      organizations={organizations}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
