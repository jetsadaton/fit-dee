// Auth.js v5 edge middleware.
// Authorization rules live in lib/auth.ts → callbacks.authorized; this file
// just hooks NextAuth into Next's middleware pipeline.

export { auth as middleware } from '@/lib/auth';

// Skip middleware on static assets, _next internals, and the auth route itself
// (must stay public so callbacks can land).
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|fonts/|icons/).*)'],
};
