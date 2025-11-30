import type { AreaCode, GetAreaResponse, SubArea } from '@/types/area';

type UpdateCityParams = Pick<AreaCode, 'provinceCode' | 'cityCode'>;

const defaultCode = getAreaDefaultCode();

export const useAreaStore = defineStore('area', () => {
  const uiStore = useUiStore();

  const currentYear = ref('');
  const currentAreaCode = ref<AreaCode>({
    provinceCode: defaultCode.province,
    cityCode: defaultCode.city,
    townCode: defaultCode.town,
    villageCode: defaultCode.village,
  });
  const currentAreaData = ref<GetAreaResponse | null>(null);

  // 供地區選單使用
  const cities = ref<SubArea[]>([]);
  const towns = ref<SubArea[]>([]);

  const getArea = async () => {
    try {
      uiStore.addLoading('getArea');

      let url = `/api/area?year=${currentYear.value}`;
      const params = [
        { key: 'provinceCode', value: currentAreaCode.value.provinceCode },
        { key: 'cityCode', value: currentAreaCode.value.cityCode },
        { key: 'townCode', value: currentAreaCode.value.townCode },
        { key: 'villageCode', value: currentAreaCode.value.villageCode },
      ];

      params.forEach(({ key, value }) => {
        if (value) url += `&${key}=${value}`;
      });

      const res = await $fetch<GetAreaResponse>(url);
      currentAreaData.value = res;
    } catch {
      uiStore.showToastMessage({ type: 'error', text: '地區資料取得失敗' });
    } finally {
      uiStore.removeLoading('getArea');
    }
  };

  const updateYear = async (newYear: string) => {
    currentYear.value = newYear;

    // 更新縣市選單
    const res = await $fetch<GetAreaResponse>(`/api/area?year=${newYear}`);
    cities.value = res.subAreas;
    currentAreaData.value = res;

    if (currentAreaCode.value.townCode !== defaultCode.town) {
      await getArea();
    }
  };

  const updateCity = async ({ provinceCode, cityCode }: UpdateCityParams) => {
    currentAreaCode.value.provinceCode = provinceCode;
    currentAreaCode.value.cityCode = cityCode;
    currentAreaCode.value.townCode = defaultCode.town;
    currentAreaCode.value.villageCode = defaultCode.village;

    await getArea();
    towns.value = currentAreaData.value?.subAreas || [];
  };

  const updateTown = async (townCode: string) => {
    currentAreaCode.value.townCode = townCode;
    currentAreaCode.value.villageCode = defaultCode.village;
    await getArea();
  };

  return {
    currentYear,
    currentAreaData,
    cities,
    towns,
    updateYear,
    updateCity,
    updateTown,
  };
});
