import type { ToastMessage } from '@/types/ui';

const defaultToastMessage: ToastMessage = {
  type: 'success',
  text: '',
};

export const useUiStore = defineStore('ui', () => {
  // Loading
  const loadingKeys = ref<string[]>([]);

  const isLoading = computed(() => loadingKeys.value.length > 0);

  const addLoading = (key: string) => {
    if (!loadingKeys.value.includes(key)) {
      loadingKeys.value.push(key);
    }
  };

  const removeLoading = (targetKey: string) => {
    loadingKeys.value = loadingKeys.value.filter((key) => key !== targetKey);
  };

  // Toast
  const toastMessage = ref<ToastMessage>({ ...defaultToastMessage });

  const showToastMessage = ({ type, text }: ToastMessage) => {
    toastMessage.value.type = type;
    toastMessage.value.text = text;
  };

  const clearToastMessage = () => {
    toastMessage.value = { ...defaultToastMessage };
  };

  return {
    loadingKeys,
    isLoading,
    addLoading,
    removeLoading,
    toastMessage,
    showToastMessage,
    clearToastMessage,
  };
});
