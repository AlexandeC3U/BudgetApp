"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/nextjs";
import { useState } from "react";

import { SheetProvider } from "@/components/sheets/sheet-controller";
import { SheetMount } from "@/components/sheets/SheetMount";

const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const tree = (
    <QueryClientProvider client={queryClient}>
      <SheetProvider>
        {children}
        <SheetMount />
      </SheetProvider>
    </QueryClientProvider>
  );

  // Skip ClerkProvider until the publishable key is set so the UI work is
  // unblocked by Clerk config. ClerkProvider throws synchronously without it.
  if (!HAS_CLERK_KEY) return tree;

  return <ClerkProvider>{tree}</ClerkProvider>;
}
