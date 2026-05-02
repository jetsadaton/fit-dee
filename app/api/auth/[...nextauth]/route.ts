// Auth.js v5 catch-all OAuth route handler.
// All real config lives in lib/auth.ts — this file is just the HTTP surface.
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
