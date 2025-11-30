export type ToastType = 'success' | 'info' | 'warning' | 'error';

export type ToastMessage = {
  type: ToastType;
  text: string;
};
