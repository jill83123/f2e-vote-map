import { z } from 'zod';
import { yearField } from './year';

export const areaCodeField = {
  province: z.string().length(2),
  city: z.string().length(3),
  town: z.string().length(3),
  village: z.string().length(4),
};

export const areaQuerySchema = z.object({
  year: yearField,
  // 預設全國等級
  provinceCode: areaCodeField.province.optional().default('00'),
  cityCode: areaCodeField.city.optional().default('000'),
  townCode: areaCodeField.town.optional().default('000'),
  villageCode: areaCodeField.village.optional().default('0000'),
});

export type GetAreaQuery = z.infer<typeof areaQuerySchema>;
