"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

import { AuthShell } from "./AuthShell";
import { AuthField } from "./AuthField";
import { PillButton } from "@/components/ui/PillButton";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";

export function SignInForm() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Submit the password; on success, finalize() activates the session.
      const { error: pwErr } = await signIn.password({
        identifier: email.trim(),
        password,
      });
      if (pwErr) {
        setError(clerkErrorMessage(pwErr));
        return;
      }
      const { error: finErr } = await signIn.finalize({
        navigate: () => {
          router.push("/");
          router.refresh();
        },
      });
      if (finErr) setError(clerkErrorMessage(finErr));
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Welcome <em className="italic text-coral">back</em>
        </>
      }
      subtitle="Sign in to pick up where you left off."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="text-[13px] font-semibold text-rust">{error}</div>
        )}

        <PillButton fullWidth disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </PillButton>
      </form>

      <p className="text-[13px] text-ink/55 text-center mt-5">
        New here?{" "}
        <Link href="/sign-up" className="font-bold text-coral">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
