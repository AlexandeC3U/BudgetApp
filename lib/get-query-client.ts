import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * One QueryClient per request, cached via React's `cache()`. Use this for SSR
 * prefetching: populate it via `qc.setQueryData(...)`, then dehydrate into a
 * `<HydrationBoundary>` so the client hydrates with the same data.
 *
 * Match the staleTime defaults from `app/providers.tsx` so prefetched data
 * doesn't immediately re-fetch on the client.
 */
export const getServerQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
        },
      },
    })
);
