import { RESPONSES } from '../constants/responses';
import { prisma } from '../db/client';

export default defineEventHandler(async () => {
  const years = await prisma.candidate.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' },
  });

  if (years.length === 0) {
    throw createError(RESPONSES.NOT_FOUND);
  }

  return {
    years: years.map((item) => item.year),
  };
});
