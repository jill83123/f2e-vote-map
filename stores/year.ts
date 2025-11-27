export const useYearStore = defineStore('year', () => {
  const years = ref<number[]>([]);

  const getYears = async () => {
    const res = await $fetch('/api/years');
    years.value = res.years;
  };

  return {
    years,
    getYears,
  };
});
