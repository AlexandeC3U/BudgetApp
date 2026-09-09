import Link from "next/link";

import { SignUpForm } from "@/components/auth/SignUpForm";
import { AuthShell } from "@/components/auth/AuthShell";

const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignUpPage() {
  if (!HAS_CLERK_KEY) return <AuthNotConfigured />;
  return <SignUpForm />;
}

function AuthNotConfigured() {
  return (
    <AuthShell
      title="Demo mode"
      subtitle="Authentication isn't configured yet — add your Clerk keys to .env to enable sign-up."
    >
      <Link href="/" className="block">
        <div className="text-center text-[14px] font-bold text-coral">
          Continue to the app →
        </div>
      </Link>
    </AuthShell>
  );
}
