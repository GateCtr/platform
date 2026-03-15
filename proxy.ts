import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/waitlist',
  '/api/waitlist',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Check if waitlist is enabled and signups are disabled
  const waitlistEnabled = process.env.ENABLE_WAITLIST === 'true';
  const signupsDisabled = process.env.ENABLE_SIGNUPS === 'false';

  // Redirect to waitlist if enabled and user tries to sign up
  if (waitlistEnabled && signupsDisabled && pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(new URL('/waitlist', req.url));
  }

  // Protect non-public routes
  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
