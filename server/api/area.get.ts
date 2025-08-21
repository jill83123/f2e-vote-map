import type { AreaCode } from '@/types/area';
import { CITY_ORDER, EXCLUDED_PROVINCE } from '../constants/area';
import RESPONSES from '../constants/responses';
import { prisma } from '../db/client';
import { areaQuerySchema } from '../schemas/area';
import { formatZodError } from '../utils/format';

type AreaLevel = 'nation' | 'city' | 'town' | 'village';
type AreaLevelParams = { level: AreaLevel } & Omit<AreaCode, 'villageCode'>;

const getAreaLevel = ({ provinceCode, cityCode, townCode, villageCode }: AreaCode) => {
  let level: AreaLevel | null = null;

  if (provinceCode === '00' && cityCode === '000' && townCode === '000' && villageCode === '0000') {
    level = 'nation';
  } else if (provinceCode && cityCode && townCode === '000' && villageCode === '0000') {
    level = 'city';
  } else if (provinceCode && cityCode && townCode && villageCode === '0000') {
    level = 'town';
  } else if (provinceCode && cityCode && townCode && villageCode) {
    level = 'village';
  }

  return level;
};

const getSubAreaWhere = ({ level, provinceCode, cityCode, townCode }: AreaLevelParams) => {
  switch (level) {
    case 'nation':
      return {
        town_code: '000',
      };
    case 'city':
      return {
        province_code: provinceCode,
        city_code: cityCode,
        town_code: { not: '000' },
        village_code: '0000',
      };
    case 'town':
      return {
        province_code: provinceCode,
        city_code: cityCode,
        town_code: townCode,
        village_code: { not: '0000' },
      };
    default:
      return null;
  }
};

const getParentAreaWhere = ({ level, provinceCode, cityCode, townCode }: AreaLevelParams) => {
  if (level === 'nation') return [];

  const codes = [
    {
      province_code: '00',
      city_code: '000',
      town_code: '000',
      village_code: '0000',
    },
  ];

  if (level === 'town' || level === 'village') {
    codes.push({
      province_code: provinceCode,
      city_code: cityCode,
      town_code: '000',
      village_code: '0000',
    });
  }

  if (level === 'village') {
    codes.push({
      province_code: provinceCode,
      city_code: cityCode,
      town_code: townCode,
      village_code: '0000',
    });
  }

  return codes;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const result = areaQuerySchema.safeParse(query);
  if (!result.success) {
    throw createError({ ...RESPONSES.INVALID_FIELD, data: formatZodError(result.error) });
  }

  const { year, provinceCode, cityCode, townCode, villageCode } = result.data;

  const level = getAreaLevel({ provinceCode, cityCode, townCode, villageCode });
  if (!level) {
    throw createError(RESPONSES.NOT_FOUND);
  }

  const area = await prisma.area.findFirst({
    select: {
      name: true,
      area_vote: {
        select: {
          valid_votes: true,
          invalid_votes: true,
          total_votes: true,
          voter_turnout: true,
        },
      },
      candidate_vote: {
        select: {
          total_votes: true,
          is_elected: true,
          candidate: {
            select: {
              name: true,
              party: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      year,
      province_code: provinceCode,
      city_code: cityCode,
      town_code: townCode,
      village_code: villageCode,
    },
  });

  if (!area) {
    throw createError(RESPONSES.NOT_FOUND);
  }

  const history = await prisma.candidateVote.findMany({
    select: {
      year: true,
      total_votes: true,
      candidate: {
        select: {
          party: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    where: {
      province_code: provinceCode,
      city_code: cityCode,
      town_code: townCode,
      village_code: villageCode,
    },
  });

  const subAreaWhere = getSubAreaWhere({ level, provinceCode, cityCode, townCode });
  const subAreas = subAreaWhere
    ? await prisma.area.findMany({
        select: {
          province_code: true,
          city_code: true,
          town_code: true,
          village_code: true,
          name: true,
          area_vote: {
            select: {
              total_votes: true,
              voter_turnout: true,
            },
          },
          candidate_vote: {
            select: {
              total_votes: true,
              is_elected: true,
              candidate: {
                select: {
                  name: true,
                  party: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: {
          year,
          ...subAreaWhere,
          NOT: EXCLUDED_PROVINCE,
        },
      })
    : [];

  if (level === 'nation') {
    subAreas.sort((a, b) => {
      const aIdx = CITY_ORDER.indexOf(a.name);
      const bIdx = CITY_ORDER.indexOf(b.name);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }

  const parentAreaWhere = getParentAreaWhere({ level, provinceCode, cityCode, townCode });
  const parentAreas = await prisma.area.findMany({
    select: {
      province_code: true,
      city_code: true,
      town_code: true,
      village_code: true,
      name: true,
    },
    where: {
      year,
      OR: parentAreaWhere,
    },
  });

  return {
    year,
    area: {
      name: area.name,
      validVotes: area.area_vote?.valid_votes,
      invalidVotes: area.area_vote?.invalid_votes,
      totalVotes: area.area_vote?.total_votes,
      voterTurnout: area.area_vote?.voter_turnout,
      candidates: area.candidate_vote.map((candidate) => ({
        name: candidate.candidate.name,
        partyName: candidate.candidate.party.name,
        totalVotes: candidate.total_votes,
        isElected: candidate.is_elected,
      })),
      history: history.map((item) => ({
        year: item.year,
        partyName: item.candidate.party.name,
        totalVotes: item.total_votes,
      })),
    },
    subAreas: subAreas.map((subArea) => ({
      provinceCode: subArea.province_code,
      cityCode: subArea.city_code,
      townCode: subArea.town_code,
      villageCode: subArea.village_code,
      name: subArea.name,
      candidates: subArea.candidate_vote.map((item) => ({
        name: item.candidate.name,
        partyName: item.candidate.party.name,
        totalVotes: item.total_votes,
        isElected: item.is_elected,
      })),
      totalVotes: subArea.area_vote?.total_votes,
      voterTurnout: subArea.area_vote?.voter_turnout,
    })),
    parentAreas: parentAreas.map((parent) => ({
      provinceCode: parent.province_code,
      cityCode: parent.city_code,
      townCode: parent.town_code,
      villageCode: parent.village_code,
      name: parent.name,
    })),
  };
});
