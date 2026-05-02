// Kimi (Moonshot AI) client — OpenAI-compatible.
// Endpoint pinned to the global (.ai) host; .cn is China-only and
// requires an RMB-billable account.
//
// Uses @ai-sdk/openai-compatible (not @ai-sdk/openai) because Kimi only
// implements /v1/chat/completions. The @ai-sdk/openai package v3+ defaults
// to the newer OpenAI Responses API (/v1/responses) which Kimi does not support.

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const apiKey = process.env.KIMI_API_KEY;
if (!apiKey) {
  // Throw lazily so `next build` (which doesn't connect) keeps working.
  throw new Error('KIMI_API_KEY is required (see .env.example).');
}

const baseURL = process.env.KIMI_BASE_URL ?? 'https://api.moonshot.ai/v1';

export const kimi = createOpenAICompatible({
  name: 'kimi',
  apiKey,
  baseURL,
});

/** Default chat model for the coach. K2.6 is multimodal + supports tools + thinking. */
export const DEFAULT_MODEL = 'kimi-k2.6';

/** Used by the vision pipeline (Phase 2 photo flow). K2.5 = multimodal variant. */
export const VISION_MODEL = 'kimi-k2.5';
