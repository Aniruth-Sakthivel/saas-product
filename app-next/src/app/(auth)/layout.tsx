import Link from "next/link";
import { Hotel, Check } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/login" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Hotel className="size-[18px]" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            HotelOS
          </span>
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </div>

      <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 p-12 lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-md text-white">
          <h2 className="text-3xl font-semibold leading-tight">
            Run your hotel from one beautiful platform.
          </h2>
          <p className="mt-4 text-indigo-100">
            Reservations, front desk, housekeeping, billing, and AI insights —
            all in HotelOS.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Increase occupancy by up to 32%",
              "Cut manual work by 18 hours a week",
              "Delight guests with faster service",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm">
                <span className="grid size-6 place-items-center rounded-full bg-white/20">
                  <Check className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
