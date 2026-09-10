"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";

import { AuthShell } from "./AuthShell";
import { AuthField } from "./AuthField";
import { PillButton } from "@/components/ui/PillButton";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";

const GENERIC_NEXT_STEP =
  "This account needs an extra verification step that isn't supported here yet.";

// Statuses other than `complete` mean the sign-in needs another factor before a
// session exists. Keyed loosely so a new Clerk status falls back to the generic
// message rather than rendering `undefined`.
const NEXT_STEP_MESSAGE: Record<string, string> = {
  needs_second_factor:
    "Two-factor authentication is required for this account, which isn't supported here yet.",
  needs_new_password:
    "Your password must be reset before you can sign in. Use “Forgot password” to set a new one.",
  needs_client_trust:
    "This device needs to be verified first. Check your email for a verification request.",
  needs_first_factor: "That email and password didn't match. Please try again.",
  needs_identifier: "Please enter the email address for your account.",
};

export function SignInForm() {
  const { signIn } = useSignIn();
  // `isLoaded` lives on useAuth(), not the signals hooks.
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // `/sign-in` is a public route, so an already-authenticated visitor would
  // otherwise sit here looking at the form — and submitting it fails, since
  // Clerk refuses a new sign-in while a session is active. This also acts as
  // the safety net after `finalize()`: the moment the session goes live,
  // `isSignedIn` flips and we navigate, even if Clerk's `navigate` callback
  // never fires (which is what strands slow mobile connections).
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
      router.refresh();
    }
  }, [isSignedIn, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // `signIn` is undefined until Clerk's JS has loaded.
    if (!isLoaded || submitting) return;
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

      // A session is already active on this client, so Clerk reports it rather
      // than creating a new one — `createdSessionId` stays null and finalize()
      // fails with "Cannot finalize sign-in without a created session". There's
      // nothing to finalize; the user is signed in, so just go to the app.
      if (signIn.existingSession) {
        router.replace("/");
        router.refresh();
        return;
      }

      // Only `complete` yields a session to finalize. Every other status needs a
      // step this form doesn't implement, so say which one instead of throwing.
      if (signIn.status !== "complete") {
        setError(NEXT_STEP_MESSAGE[signIn.status] ?? GENERIC_NEXT_STEP);
        return;
      }

      const { error: finErr } = await signIn.finalize({
        navigate: () => {
          // `replace`, not `push` — going Back to the sign-in form after
          // authenticating just bounces off the redirect above.
          router.replace("/");
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

        <PillButton fullWidth disabled={submitting || !isLoaded}>
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
