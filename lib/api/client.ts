"use client";

/**
 * Thin fetch wrapper for internal /api routes. Auth is handled by Clerk's
 * session cookie (sent automatically same-origin), so no Bearer plumbing.
 * Throws on non-2xx so it works cleanly inside TanStack Query queryFn.
 */
export async function apiJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { credentials: "same-origin", ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // body wasn't JSON — keep statusText
    }
    throw new Error(`${res.status} ${message}`);
  }
  return (await res.json()) as T;
}
