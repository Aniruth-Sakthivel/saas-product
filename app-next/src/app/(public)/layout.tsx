/**
 * Public, unauthenticated layout for the guest-facing hotel site (landing +
 * booking). No app shell, no auth — these pages are reachable by anyone.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
