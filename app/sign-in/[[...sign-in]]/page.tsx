import Link from "next/link";

import { SignInForm } from "@/components/auth/SignInForm";
import { AuthShell } from "@/components/auth/AuthShell";

const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  if (!HAS_CLERK_KEY) return <AuthNotConfigured />;
  return <SignInForm />;
}

function AuthNotConfigured() {
  return (
    <AuthShell
      title="Demo mode"
      subtitle="Authentication isn't configured yet — add your Clerk keys to .env to enable sign-in."
    >
      <Link href="/" className="block">
        <div className="text-center text-[14px] font-bold text-coral">
          Continue to the app →
        </div>
      </Link>
    </AuthShell>
  );
}
