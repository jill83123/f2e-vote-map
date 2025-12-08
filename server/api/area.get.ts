import { AREA_DEFAULT_CODE } from '@/constants/areas';
import { CITY_ORDER, EXCLUDED_PROVINCE } from '@/server/constants/areas';
import { RESPONSES } from '@/server/constants/responses';
import { prisma } from '@/server/db/client';
import { areaQuerySchema } from '@/server/schemas/area';
import { formatZodError } from '@/server/utils/format';
import type { TAreaCode, TAreaLevel } from '@/types/area';

type TGetLevelDataParams = { level: TAreaLevel } & Omit<TAreaCode, 'villageCode'>;

const getAreaLevel = ({ provinceCode, cityCode, townCode, villageCode }: TAreaCode): TAreaLevel => {
  const isProvince =
    provinceCode === AREA_DEFAULT_CODE.province &&
    cityCode === AREA_DEFAULT_CODE.city &&
    townCode === AREA_DEFAULT_CODE.town &&
    villageCode === AREA_DEFAULT_CODE.village;

  const isCity = townCode === AREA_DEFAULT_CODE.town && villageCode === AREA_DEFAULT_CODE.village;
  const isTown = villageCode === AREA_DEFAULT_CODE.village;

  if (isProvince) return 'province';
  if (isCity) return 'city';
  if (isTown) return 'town';
  return 'village';
};

const getSubAreaWhere = ({ level, provinceCode, cityCode, townCode }: TGetLevelDataParams) => {
  switch (level) {
    case 'province':
      return {
        town_code: AREA_DEFAULT_CODE.town,
      };
    case 'city':
      return {
        province_code: provinceCode,
        city_code: cityCode,
        town_code: { not: AREA_DEFAULT_CODE.town },
        village_code: AREA_DEFAULT_CODE.village,
      };
    case 'town':
      return {
        province_code: provinceCode,
        city_code: cityCode,
        town_code: townCode,
        village_code: { not: AREA_DEFAULT_CODE.village },
      };
    default:
      return null;
  }
};

const getParentAreaWhere = ({ level, provinceCode, cityCode, townCode }: TGetLevelDataParams) => {
  if (level === 'province') return [];

  const codes = [
    {
      province_code: AREA_DEFAULT_CODE.province,
      city_code: AREA_DEFAULT_CODE.city,
      town_code: AREA_DEFAULT_CODE.town,
      village_code: AREA_DEFAULT_CODE.village,
    },
  ];

  if (level === 'town' || level === 'village') {
    codes.push({
      province_code: provinceCode,
      city_code: cityCode,
      town_code: AREA_DEFAULT_CODE.town,
      village_code: AREA_DEFAULT_CODE.village,
    });
  }

  if (level === 'village') {
    codes.push({
      province_code: provinceCode,
      city_code: cityCode,
      town_code: townCode,
      village_code: AREA_DEFAULT_CODE.village,
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

  if (level === 'province') {
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
      provinceCode,
      cityCode,
      townCode,
      villageCode,
      name: area.name,
      validVotes: area.area_vote?.valid_votes ?? 0,
      invalidVotes: area.area_vote?.invalid_votes ?? 0,
      totalVotes: area.area_vote?.total_votes ?? 0,
      voterTurnout: area.area_vote?.voter_turnout ? Number(area.area_vote?.voter_turnout) : 0,
      candidates: area.candidate_vote.map((candidate) => ({
        name: candidate.candidate.name,
        partyName: candidate.candidate.party.name,
        totalVotes: candidate.total_votes ?? 0,
        isElected: candidate.is_elected,
      })),
      history: history.map((item) => ({
        year: item.year,
        partyName: item.candidate.party.name,
        totalVotes: item.total_votes ?? 0,
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
        totalVotes: item.total_votes ?? 0,
        isElected: item.is_elected,
      })),
      totalVotes: subArea.area_vote?.total_votes ?? 0,
      voterTurnout: subArea.area_vote?.voter_turnout ? Number(subArea.area_vote?.voter_turnout) : 0,
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
