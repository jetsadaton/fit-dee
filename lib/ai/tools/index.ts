import { createSearchFoodTool } from './search_food';
import { createLogFoodTool } from './log_food';
import { createLogWaterTool } from './log_water';
import { createWeighInTool } from './weigh_in';
import { createSetMoodTool } from './set_mood';
import { createLogExerciseTool } from './log_exercise';

export { type FoodLogConfirmPayload } from './log_food';
export { type WaterLogDonePayload } from './log_water';
export { type WeighInDonePayload } from './weigh_in';
export { type MoodLogDonePayload, MOOD_LABEL } from './set_mood';
export { type ExerciseLogDonePayload } from './log_exercise';

// Factory closes over userId — never include userId in any tool's inputSchema.
export function createCoachTools(userId: string) {
  return {
    search_food: createSearchFoodTool(),
    log_food: createLogFoodTool(userId),
    log_water: createLogWaterTool(userId),
    weigh_in: createWeighInTool(userId),
    set_mood: createSetMoodTool(userId),
    log_exercise: createLogExerciseTool(userId),
  };
}

export type CoachTools = ReturnType<typeof createCoachTools>;
