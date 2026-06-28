import Link from "next/link";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata = { title: "Log in · HotelOS" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Log in to your HotelOS account.
      </p>
      <div className="mt-7">
        <SignInForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
