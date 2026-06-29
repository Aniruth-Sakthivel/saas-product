import { requirePlatformAdmin } from "@/lib/admin";
import { getProfile } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminId = await requirePlatformAdmin();
  const profile = await getProfile(adminId);

  return (
    <AdminShell userName={profile?.full_name ?? profile?.email ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
