<template>
  <div>
    <VoteFilterBar />

    <aside
      class="fixed h-[calc(100dvh-100px)] w-full max-w-[500px] sm:h-[calc(100dvh-120px)] md:h-[calc(100dvh-66px)]"
    >
      <MapView />
    </aside>
  </div>
</template>

<script lang="ts" setup>
const yearStore = useYearStore();
const areaStore = useAreaStore();

if (!yearStore.years.length) {
  await yearStore.getYears();
}

if (!areaStore.currentYear) {
  const latestYear = String(Math.max(...yearStore.years));
  areaStore.updateYear(latestYear);
}
</script>

<style scoped></style>
