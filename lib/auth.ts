// Auth.js v5 — Coachly identity layer.
//
// Strategy:
// - JWT-based sessions (no DB session table). Provider sub goes into our own
//   `users` table via `users` repository; the JWT carries `userId` only.
// - Two providers: LINE Login (primary, mobile-first user base) and Google.
// - signIn callback resolves OAuth subject → existing user, or creates one.
// - middleware.ts protects (app)/* routes; unauthed bounces to /.
//
// Why no Drizzle adapter:
//   Our schema (lib/db/schema.ts) uses domain columns (line_sub, google_sub,
//   consents jsonb, locale, etc.) that don't match @auth/drizzle-adapter's
//   prescribed Account/Session tables. JWT mode lets us own the user shape.

import NextAuth, { type NextAuthConfig } from 'next-auth';
import Line from 'next-auth/providers/line';
import Google from 'next-auth/providers/google';
import { create as createUser, findByGoogleSub, findByLineSub, findById } from '@/lib/db/repositories/users';

const authConfig: NextAuthConfig = {
  // Trust X-Forwarded-* headers from Vercel / reverse proxies.
  trustHost: true,

  session: { strategy: 'jwt' },

  providers: [
    Line({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  pages: {
    // Welcome screen doubles as the sign-in page (LINE + Google buttons live there).
    signIn: '/',
  },

  callbacks: {
    /**
     * Map provider sub → row in our `users` table.
     * - Returning user  → no-op (just allow sign in)
     * - First-time user → insert row with the relevant *_sub column
     */
    async signIn({ account, profile }) {
      if (!account || !profile?.sub) return false;

      if (account.provider === 'line') {
        const existing = await findByLineSub(profile.sub);
        if (!existing) {
          await createUser({
            lineSub: profile.sub,
            email: typeof profile.email === 'string' ? profile.email : null,
            locale: 'th',
          });
        }
        return true;
      }

      if (account.provider === 'google') {
        const existing = await findByGoogleSub(profile.sub);
        if (!existing) {
          await createUser({
            googleSub: profile.sub,
            email: typeof profile.email === 'string' ? profile.email : null,
            locale: 'th',
          });
        }
        return true;
      }

      return false;
    },

    /**
     * Embed our internal users.id (uuid) into the JWT, keyed as `userId`.
     * Subsequent requests read `session.user.id` without another DB hit.
     */
    async jwt({ token, account, profile }) {
      // Only on first sign in: account + profile are populated. After that
      // the token is round-tripped from cookie and we just pass it through.
      if (account && profile?.sub) {
        const sub = profile.sub;
        const user =
          account.provider === 'line'
            ? await findByLineSub(sub)
            : account.provider === 'google'
              ? await findByGoogleSub(sub)
              : undefined;
        if (user) token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && typeof token.userId === 'string') {
        session.user.id = token.userId;
      }
      return session;
    },

    /**
     * Middleware-level gate. Lives here (not middleware.ts) so we get one
     * source of truth for "who can access what".
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ['/chat', '/today', '/plan', '/me', '/onboarding', '/plan-preview', '/workout'];
      const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected) return isLoggedIn;
      return true; // public routes (/, /canvas, /_next/*, etc.) always allowed
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Convenience: services that need the full user row call this instead of
// re-implementing the lookup. Returns null if session missing or user soft-deleted.
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return (await findById(session.user.id)) ?? null;
}
