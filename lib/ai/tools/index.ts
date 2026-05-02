import { createSearchFoodTool } from './search_food';
import { createLogFoodTool } from './log_food';
import { createLogWaterTool } from './log_water';
import { createWeighInTool } from './weigh_in';
import { createSetMoodTool } from './set_mood';
import { createLogExerciseTool } from './log_exercise';
import { createUpdateProfileTool } from './update_profile';

// Re-export shared types + constants from the client-safe module.
// Server code may import from here; client code must import from './shared-types' directly.
export type {
  FoodLogConfirmPayload,
  WaterLogDonePayload,
  WeighInDonePayload,
  MoodLogDonePayload,
  ExerciseLogDonePayload,
  UpdateProfileConfirmPayload,
} from './shared-types';
export { MOOD_LABEL, GOAL_LABEL, ACTIVITY_LABEL, EQUIPMENT_LABEL } from './shared-types';

// Factory closes over userId — never include userId in any tool's inputSchema.
export function createCoachTools(userId: string) {
  return {
    search_food: createSearchFoodTool(),
    log_food: createLogFoodTool(userId),
    log_water: createLogWaterTool(userId),
    weigh_in: createWeighInTool(userId),
    set_mood: createSetMoodTool(userId),
    log_exercise: createLogExerciseTool(userId),
    update_profile: createUpdateProfileTool(userId),
  };
}

export type CoachTools = ReturnType<typeof createCoachTools>;
