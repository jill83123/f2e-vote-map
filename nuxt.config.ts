// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/icon', '@nuxt/image', '@nuxt/ui', '@pinia/nuxt'],
  fonts: {
    families: [
      { name: 'Roboto', provider: 'google' },
      { name: 'Noto Sans TC', provider: 'google' },
    ],
  },
  css: ['@/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
});
