import { z } from 'zod';

export const yearField = z.string().length(4).transform(Number);
