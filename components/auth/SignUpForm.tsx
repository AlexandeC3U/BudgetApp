"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useSignUp } from "@clerk/nextjs";

import { AuthShell } from "./AuthShell";
import { AuthField } from "./AuthField";
import { CodeInput } from "./CodeInput";
import { PillButton } from "@/components/ui/PillButton";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";

export function SignUpForm() {
  const { signUp } = useSignUp();
  // `isLoaded` lives on useAuth(), not the signals hooks.
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<"details" | "verify">("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // See SignInForm: `/sign-up` is public, so send an already-authenticated
  // visitor home, and catch the post-`finalize()` case where Clerk's own
  // `navigate` callback never fires.
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
      router.refresh();
    }
  }, [isSignedIn, router]);

  const startSignUp = async (e: FormEvent) => {
    e.preventDefault();
    // `signUp` is undefined until Clerk's JS has loaded.
    if (!isLoaded || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Create the sign-up with name + email + password, then send the code.
      const { error: pwErr } = await signUp.password({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        emailAddress: email.trim(),
        password,
      });
      if (pwErr) {
        setError(clerkErrorMessage(pwErr));
        return;
      }
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) {
        setError(clerkErrorMessage(sendErr));
        return;
      }
      setPhase("verify");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async (value: string) => {
    if (!isLoaded || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({
        code: value.trim(),
      });
      if (verifyErr) {
        setError(clerkErrorMessage(verifyErr));
        setCode(""); // clear the boxes so they can retype
        return;
      }
      const { error: finErr } = await signUp.finalize({
        navigate: () => {
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

  const verify = (e: FormEvent) => {
    e.preventDefault();
    submitCode(code);
  };

  if (phase === "verify") {
    return (
      <AuthShell
        title={
          <>
            Check your <em className="italic text-coral">inbox</em>
          </>
        }
        subtitle={`We sent a 6-digit code to ${email}. Enter it below to finish.`}
      >
        <form onSubmit={verify} className="flex flex-col gap-4">
          <CodeInput
            label="Verification code"
            value={code}
            onChange={setCode}
            onComplete={submitCode}
            autoFocus
            disabled={submitting}
          />

          {error && (
            <div className="text-[13px] font-semibold text-rust">{error}</div>
          )}

          <PillButton fullWidth disabled={submitting || !isLoaded || code.length < 6}>
            {submitting ? "Verifying…" : "Verify & continue"}
          </PillButton>
        </form>

        <button
          onClick={() => {
            setPhase("details");
            setCode("");
            setError(null);
          }}
          className="w-full text-[13px] font-semibold text-ink/55 text-center mt-5"
        >
          ← Use a different email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        <>
          Start <em className="italic text-coral">splitting</em>
        </>
      }
      subtitle="Create an account to track and settle shared spending."
    >
      <form onSubmit={startSignUp} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <AuthField
              label="First name"
              type="text"
              autoComplete="given-name"
              placeholder="Alex"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <AuthField
              label="Last name"
              type="text"
              autoComplete="family-name"
              placeholder="Ceule"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="text-[13px] font-semibold text-rust">{error}</div>
        )}

        {/* Clerk Smart CAPTCHA mounts here (bot protection on sign-up). */}
        <div id="clerk-captcha" />

        <PillButton fullWidth disabled={submitting || !isLoaded}>
          {submitting ? "Creating account…" : "Create account"}
        </PillButton>
      </form>

      <p className="text-[13px] text-ink/55 text-center mt-5">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-bold text-coral">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
