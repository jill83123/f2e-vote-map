<template>
  <div class="relative h-dvh overflow-hidden pt-24">
    <main class="mx-auto max-w-[956px] px-4 text-center">
      <img src="@/assets/images/logo.svg" alt="logo" class="mx-auto mb-[18px] sm:mb-[26px]" />

      <h1 class="mb-6 px-7 sm:px-0">
        <img src="@/assets/images/logotype.svg " alt="" class="mx-auto" />
        <span class="visually-hidden">台灣歷年總統 都幾?</span>
      </h1>

      <h2 class="text-primary mb-6 text-[22px] leading-normal font-bold sm:text-2xl">
        選擇查詢年份
      </h2>

      <ul v-if="years.length" class="-mx-2 flex flex-wrap justify-center gap-y-4">
        <li v-for="year in years" :key="year" class="w-1/2 px-2 sm:w-1/4 md:w-1/5">
          <routerLink :to="`/result/?year=${year}`" class="btn block p-3 font-bold">
            {{ year }}
          </routerLink>
        </li>
      </ul>

      <p v-else>資料載入失敗，請重新整理或稍後再試。</p>
    </main>

    <div class="absolute right-0 -bottom-2 left-0 -z-1 lg:bottom-[-22px]">
      <div class="flex">
        <img src="@/assets/images/3d_person_1.svg" alt="" class="hidden lg:block lg:w-1/6" />
        <img src="@/assets/images/3d_person_2.svg" alt="" class="hidden lg:block lg:w-1/6" />
        <img src="@/assets/images/3d_person_3.svg" alt="" class="w-1/4 lg:w-1/6" />
        <img src="@/assets/images/3d_person_4.svg" alt="" class="w-1/4 lg:w-1/6" />
        <img src="@/assets/images/3d_person_5.svg" alt="" class="w-1/4 lg:w-1/6" />
        <img src="@/assets/images/3d_person_6.svg" alt="" class="w-1/4 lg:w-1/6" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const yearStore = useYearStore();
await yearStore.getYears();
const years = computed(() => (yearStore.years ? [...yearStore.years].reverse() : []));
</script>

<style scoped></style>
