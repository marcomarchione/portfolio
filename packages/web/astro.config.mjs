import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en', 'es', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  output: 'static',
});
