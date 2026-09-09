// Pull a human-readable message out of a Clerk error (client-safe). The new
// signals API returns a single `ClerkError` ({ message, longMessage, code });
// thrown/network failures may instead carry an `errors` array. Handle both,
// plus a plain Error fallback.
export function clerkErrorMessage(err: unknown): string {
  const generic = "Something went wrong. Please try again.";
  if (err && typeof err === "object") {
    const e = err as {
      longMessage?: string;
      message?: string;
      errors?: Array<{ longMessage?: string; message?: string }>;
    };
    if (Array.isArray(e.errors) && e.errors[0]) {
      return e.errors[0].longMessage || e.errors[0].message || generic;
    }
    if (typeof e.longMessage === "string" && e.longMessage) return e.longMessage;
    if (typeof e.message === "string" && e.message) return e.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return generic;
}
