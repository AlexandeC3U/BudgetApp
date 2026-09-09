"use client";

import { useClerk } from "@clerk/nextjs";

/**
 * Sign-out row for the profile screen. Only mount this when Clerk is
 * configured — `useClerk` requires `<ClerkProvider>`, which the app skips in
 * demo (no-key) mode.
 */
export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="w-full bg-paper rounded-[22px] px-4 py-4 flex items-center gap-3.5 text-left"
      style={{ border: "0.5px solid rgba(26,23,20,0.06)" }}
    >
      <div
        className="flex items-center justify-center text-[20px] bg-bone"
        style={{ width: 40, height: 40, borderRadius: 12 }}
      >
        👋
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-rust">Sign out</div>
      </div>
    </button>
  );
}
