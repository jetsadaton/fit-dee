// Upstash sliding-window rate limiter for the chat endpoint.
//
// Why per-user, per-hour: Coachly's user base is "มือใหม่" — heavy chat
// is normal, but 30 turns/hr is enough for any genuine session and keeps
// Kimi token bills predictable when a single account is compromised.
// Adjust as we learn from real traffic (eval harness can replay log).
//
// PRIVACY: Redis key is a SHA-256 hash of users.id (UUID), never the raw
// id, email, or sub. Even if an Upstash dashboard leaks, the keyspace
// reveals nothing user-identifying.

import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required (see .env.example).');
}

const redis = new Redis({ url, token });

export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  analytics: true,
  prefix: 'coachly:rl:chat',
});

/** SHA-256 of users.id — opaque key safe to use in Redis. */
export function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').slice(0, 32);
}

/**
 * Returns rate-limit decision for the user. Caller maps `success=false`
 * to HTTP 429 and surfaces `reset` (epoch ms) in a Retry-After header.
 */
export async function checkChatLimit(userId: string) {
  const key = hashUserId(userId);
  const result = await chatLimiter.limit(key);
  return result;
}
