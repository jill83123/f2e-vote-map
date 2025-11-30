<template>
  <div>
    <NuxtRouteAnnouncer />
    <UApp :toaster="{ position: 'top-right' }">
      <NuxtPage />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import type { ToastType } from '@/types/ui';

const uiStore = useUiStore();
const toast = useToast();

const toastTitleMap: Record<ToastType, string> = {
  success: '成功',
  info: '資訊',
  warning: '警告',
  error: '錯誤',
};

watch(
  () => uiStore.toastMessage,
  (newToastMessage) => {
    const { type, text } = newToastMessage;

    if (text) {
      toast.add({
        title: toastTitleMap[type],
        description: text,
        color: type,
      });

      uiStore.clearToastMessage();
    }
  },
);
</script>
