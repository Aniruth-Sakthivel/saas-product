import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Verify email · HotelOS" };

export default function VerifyPage() {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        Verify your email
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We sent a confirmation link to your inbox. Click it to activate your
        account, then log in.
      </p>
      <Button asChild className="mt-6 w-full">
        <Link href="/login">Back to login</Link>
      </Button>
    </div>
  );
}
