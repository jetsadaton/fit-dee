export type InsightTone = 'warn' | 'good' | 'info';

export type Insight = {
  tone: InsightTone;
  /** Short Thai text; may contain <b>...</b> for emphasis. */
  text: string;
};

export type InsightRange = 'today' | 'week' | 'month';
