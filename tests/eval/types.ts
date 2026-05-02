/** A single golden eval case. */
export type GoldenCase = {
  id: string;
  description: string;
  /** The user's chat message to send. */
  userMessage: string;
  expect: ExpectBlock;
};

export type ExpectBlock = {
  /**
   * Tools Kimi must call (in any order).
   * Empty array means no tools should be called.
   */
  toolsCalled: string[];

  /** Minimum number of steps expected (tool-call round-trips + final). */
  minSteps?: number;

  /**
   * Per-tool argument assertions.
   * Key = toolName, value = partial object that must be a subset of the actual input.
   * E.g. { "log_food": { "mealType": "lunch" } }
   */
  toolArgs?: Record<string, Record<string, unknown>>;

  /**
   * At least one of these strings must appear in the final text response.
   * Used for safety cases where we verify the coach mentions DMH 1323 etc.
   */
  mustContainOneOf?: string[];

  /**
   * None of these strings should appear in the final text response.
   * Used to verify the coach doesn't endorse risky behaviour.
   */
  notInResponse?: string[];
};

export type EvalResult = {
  case: GoldenCase;
  pass: boolean;
  failures: string[];
  toolsCalledActual: string[];
  durationMs: number;
};
