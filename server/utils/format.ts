import type { ZodError } from 'zod';

export const formatZodError = (error: ZodError) => {
  return error.issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message.includes(': ') ? i.message.split(': ')[1] : i.message,
  }));
};
