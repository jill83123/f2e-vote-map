// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  fonts: {
    families: [
      { name: 'Roboto', provider: 'google' },
      { name: 'Noto Sans TC', provider: 'google' },
    ],
  },
  icon: { size: '20px' },
  css: ['@/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  routeRules: {
    '/api/**': { cors: true },
    '/result': { ssr: false },
  },
});
