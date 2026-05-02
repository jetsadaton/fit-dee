import { tool } from 'ai';
import { z } from 'zod';
import { foodResolverService } from '@/lib/services/food-resolver';

export function createSearchFoodTool() {
  return tool({
    description:
      'ค้นหาอาหารจากชื่อภาษาไทยหรืออังกฤษ คืนผลลัพธ์สูงสุด 5 รายการพร้อมค่าสารอาหารต่อ 100g ใช้ก่อน log_food เสมอ',
    inputSchema: z.object({
      query: z.string().describe('ชื่ออาหารหรือ keyword เช่น "ข้าวกะเพรา" หรือ "pad krapao"'),
    }),
    execute: async ({ query }) => {
      const rows = await foodResolverService.search(query);
      return rows.map((f) => ({
        foodId: f.id,
        semanticId: f.semanticId,
        nameTh: f.nameTh,
        nameEn: f.nameEn ?? null,
        kcalPer100g: f.kcalPer100g,
        proteinGPer100g: Number(f.proteinGPer100g),
        carbGPer100g: Number(f.carbGPer100g),
        fatGPer100g: Number(f.fatGPer100g),
        defaultPortionG: f.defaultPortionG ?? null,
      }));
    },
  });
}
