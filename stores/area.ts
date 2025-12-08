import { AREA_DEFAULT_CODE } from '@/constants/areas';
import type { TAreaCode, TAreaLevel, TGetAreaResponse, TSubArea } from '@/types/area';

type UpdateCityParams = Pick<TAreaCode, 'provinceCode' | 'cityCode'>;

export const useAreaStore = defineStore('area', () => {
  const uiStore = useUiStore();

  const currentYear = ref('');
  const currentAreaCode = ref<Record<TAreaLevel, string>>({
    province: AREA_DEFAULT_CODE.province,
    city: AREA_DEFAULT_CODE.city,
    town: AREA_DEFAULT_CODE.town,
    village: AREA_DEFAULT_CODE.village,
  });
  const currentAreaData = ref<TGetAreaResponse | null>(null);

  // 供地區選單使用
  const isLoading = ref(false);
  const cities = ref<TSubArea[]>([]);
  const towns = ref<TSubArea[]>([]);

  const getArea = async () => {
    try {
      uiStore.addLoading('getArea');

      let url = `/api/area?year=${currentYear.value}`;
      const params = [
        { key: 'provinceCode', value: currentAreaCode.value.province },
        { key: 'cityCode', value: currentAreaCode.value.city },
        { key: 'townCode', value: currentAreaCode.value.town },
        { key: 'villageCode', value: currentAreaCode.value.village },
      ];

      params.forEach(({ key, value }) => {
        if (value) url += `&${key}=${value}`;
      });

      const res = await $fetch<TGetAreaResponse>(url);
      currentAreaData.value = res;
    } catch {
      uiStore.showToastMessage({ type: 'error', text: '地區資料取得失敗' });
    } finally {
      uiStore.removeLoading('getArea');
    }
  };

  const updateYear = async (newYear: string) => {
    isLoading.value = true;
    currentYear.value = newYear;

    // 更新縣市選單
    const res = await $fetch<TGetAreaResponse>(`/api/area?year=${newYear}`);
    cities.value = res.subAreas;

    if (isProvinceLevel.value) {
      isLoading.value = false;
      return;
    }

    const prevIsTownLevel = isTownLevel.value;
    const prevAreaCode = { ...currentAreaCode.value };

    if (isCityLevel.value || isTownLevel.value) {
      await updateCity({
        provinceCode: currentAreaCode.value.province,
        cityCode: currentAreaCode.value.city,
      });
    }

    if (prevIsTownLevel) {
      await updateTown(prevAreaCode.town);
    }

    isLoading.value = false;
  };

  const updateCity = async ({ provinceCode, cityCode }: UpdateCityParams) => {
    currentAreaCode.value.province = provinceCode;
    currentAreaCode.value.city = cityCode;
    currentAreaCode.value.town = AREA_DEFAULT_CODE.town;
    currentAreaCode.value.village = AREA_DEFAULT_CODE.village;

    await getArea();
    towns.value = currentAreaData.value?.subAreas || [];
  };

  const updateTown = async (townCode: string) => {
    currentAreaCode.value.town = townCode;
    currentAreaCode.value.village = AREA_DEFAULT_CODE.village;
    await getArea();
  };

  const resetAreaCode = () => {
    currentAreaCode.value = {
      province: AREA_DEFAULT_CODE.province,
      city: AREA_DEFAULT_CODE.city,
      town: AREA_DEFAULT_CODE.town,
      village: AREA_DEFAULT_CODE.village,
    };
  };

  const isProvinceLevel = computed(
    () =>
      currentAreaCode.value.province === AREA_DEFAULT_CODE.province &&
      currentAreaCode.value.city === AREA_DEFAULT_CODE.city &&
      currentAreaCode.value.town === AREA_DEFAULT_CODE.town &&
      currentAreaCode.value.village === AREA_DEFAULT_CODE.village,
  );

  const isCityLevel = computed(() => currentAreaCode.value.town === AREA_DEFAULT_CODE.town);

  const isTownLevel = computed(
    () =>
      currentAreaCode.value.town !== AREA_DEFAULT_CODE.town &&
      currentAreaCode.value.village === AREA_DEFAULT_CODE.village,
  );

  return {
    currentYear,
    currentAreaCode,
    currentAreaData,
    isLoading,
    cities,
    towns,
    updateYear,
    updateCity,
    updateTown,
    resetAreaCode,
    isProvinceLevel,
    isCityLevel,
    isTownLevel,
  };
});
