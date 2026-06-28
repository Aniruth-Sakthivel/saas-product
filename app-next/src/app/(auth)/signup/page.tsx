import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata = { title: "Sign up · HotelOS" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Start your free trial
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        14 days free. No credit card required.
      </p>
      <div className="mt-7">
        <SignUpForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
