// Augment Auth.js session.user with our internal users.id (uuid).
// Read by `auth()` consumers in Server Components / Server Actions.

import type { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
  }
}
