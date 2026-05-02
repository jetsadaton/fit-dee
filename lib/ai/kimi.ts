// Kimi (Moonshot AI) client — OpenAI-compatible.
// Endpoint pinned to the global (.ai) host; .cn is China-only and
// requires an RMB-billable account.

import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.KIMI_API_KEY;
if (!apiKey) {
  // Throw lazily so `next build` (which doesn't connect) keeps working.
  throw new Error('KIMI_API_KEY is required (see .env.example).');
}

const baseURL = process.env.KIMI_BASE_URL ?? 'https://api.moonshot.ai/v1';

export const kimi = createOpenAI({
  apiKey,
  baseURL,
});

/** Default chat model for the coach. K2.6 alias when available; v1-32k for now. */
export const DEFAULT_MODEL = 'moonshot-v1-32k';

/** Used by the vision pipeline (Phase 2 photo flow). */
export const VISION_MODEL = 'moonshot-v1-32k-vision-preview';
