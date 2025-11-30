export const useYearStore = defineStore('year', () => {
  const uiStore = useUiStore();

  const years = ref<number[]>([]);

  const getYears = async () => {
    try {
      uiStore.addLoading('getYears');

      const res = await $fetch('/api/years');
      years.value = res.years;
    } catch {
      uiStore.showToastMessage({ type: 'error', text: '年份資料取得失敗' });
    } finally {
      uiStore.removeLoading('getYears');
    }
  };

  return {
    years,
    getYears,
  };
});
