import { createSearchFoodTool } from './search_food';
import { createLogFoodTool } from './log_food';

export { type FoodLogConfirmPayload } from './log_food';

// Factory closes over userId — never include userId in any tool's inputSchema.
export function createCoachTools(userId: string) {
  return {
    search_food: createSearchFoodTool(),
    log_food: createLogFoodTool(userId),
  };
}

export type CoachTools = ReturnType<typeof createCoachTools>;
