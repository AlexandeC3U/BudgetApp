import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Auth pages are always reachable. API routes self-guard (getRequestUser
// returns a JSON 401), so we don't redirect them at the edge — only page
// routes get the redirect-to-sign-in treatment.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const protectedClerkMiddleware = clerkMiddleware(async (auth, req) => {
  const isApi = req.nextUrl.pathname.startsWith("/api");
  if (!isPublicRoute(req) && !isApi) {
    await auth.protect();
  }
});

// Use Clerk middleware once the publishable key is set; otherwise pass through
// so dev work isn't blocked on Clerk configuration.
export default HAS_CLERK_KEY
  ? protectedClerkMiddleware
  : (_req: NextRequest) => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and static assets, run on everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API/trpc routes
    "/(api|trpc)(.*)",
  ],
};
