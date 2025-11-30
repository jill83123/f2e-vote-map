<template>
  <div>
    <VoteFilterBar />
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
