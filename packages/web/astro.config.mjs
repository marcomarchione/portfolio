import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en', 'es', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  output: 'static',
});
