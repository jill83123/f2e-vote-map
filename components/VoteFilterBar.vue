<template>
  <nav class="border-semantic-primary sm:border-b">
    <div class="max-w-xxl mx-auto flex items-center px-4 py-2.5 sm:px-6 sm:py-3">
      <div class="flex grow flex-wrap items-center md:flex-nowrap">
        <NuxtLink
          to="/"
          class="relative mr-auto flex shrink-0 items-center gap-1 sm:gap-2 sm:after:absolute sm:after:inset-x-0 sm:after:-inset-y-1 md:mr-6"
        >
          <img src="@/assets/images/logo.svg" alt="logo" class="w-[37px] md:w-[45px] lg:w-[53px]" />
          <p>
            <img
              src="@/assets/images/logotype.svg "
              alt=""
              class="w-[177px] md:w-[214px] lg:w-[251px]"
            />
            <span class="visually-hidden">台灣歷年總統 都幾?</span>
          </p>
        </NuxtLink>

        <div class="flex shrink-0 items-center gap-3 md:mr-4">
          <p class="hidden font-bold xl:block">選擇年份</p>
          <USelect
            v-model="yearSelectValue"
            :items="yearSelectItems"
            :content="{ align: windowWidth < 768 ? 'end' : 'start' }"
            class="w-[76px] pr-3 sm:w-[118px] sm:px-4"
            @update:model-value="handleYearChange"
          />
        </div>

        <div class="flex w-full grow pt-4 md:py-0 lg:w-auto">
          <div
            class="bg-semantic-primary hidden items-center rounded-s-full pl-3 text-gray-800 sm:flex"
          >
            <Icon name="mdi-magnify" />
          </div>
          <USelect
            v-model="citySelectValue"
            :items="citySelectItems"
            :content="{ align: 'start' }"
            :ui="{
              trailing: 'after:absolute after:right-0 after:h-4 after:w-0.5 after:bg-gray-400',
            }"
            class="relative w-full min-w-[120px] rounded-e-none pl-6 sm:rounded-none sm:pl-3 lg:max-w-[194px]"
            @update:model-value="handleCityChange"
          />
          <USelect
            v-model="townSelectValue"
            :items="townSelectItems"
            :content="{ align: windowWidth < 870 ? 'end' : 'start' }"
            :placeholder="
              citySelectValue === `${defaultCode.province}-${defaultCode.city}`
                ? '全部區域'
                : '選擇區域'
            "
            :disabled="citySelectValue === `${defaultCode.province}-${defaultCode.city}`"
            class="w-full min-w-[120px] rounded-s-none lg:max-w-[194px]"
            @update:model-value="handleTownChange"
          />
        </div>
      </div>

      <div class="hidden items-center gap-4 pl-6 lg:flex">
        <p>分享</p>
        <ul class="text-primary flex items-center gap-4">
          <li>
            <a href="#" class="flex"><Icon name="fa7-brands:facebook" /></a>
          </li>
          <li>
            <a href="#" class="flex"><Icon name="fa7-brands:instagram-square" /></a>
          </li>
          <li>
            <a href="#" class="flex"><Icon name="fa7-brands:youtube" /></a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
const yearStore = useYearStore();
const areaStore = useAreaStore();

const { width: windowWidth } = useWindowSize();
const defaultCode = getAreaDefaultCode();

const yearSelectValue = ref(areaStore.currentYear);
const yearSelectItems = computed(() =>
  yearStore.years.map((year: number) => ({ label: String(year), value: String(year) })),
);

const citySelectValue = ref(`${defaultCode.province}-${defaultCode.city}`);
const citySelectItems = computed(() =>
  areaStore.cities.map((city) => ({
    label: city.name,
    value: `${city.provinceCode}-${city.cityCode}`,
  })),
);

const townSelectValue = ref('');
const townSelectItems = computed(() =>
  areaStore.towns.map((town) => ({ label: town.name, value: town.townCode })),
);

const handleYearChange = (value: string) => {
  areaStore.updateYear(value);
};

const handleCityChange = (value: string) => {
  townSelectValue.value = '';
  const [provinceCode = defaultCode.province, cityCode = defaultCode.city] = value.split('-');
  areaStore.updateCity({ provinceCode, cityCode });
};

const handleTownChange = (value: string) => {
  areaStore.updateTown(value);
};
</script>

<style scoped></style>
