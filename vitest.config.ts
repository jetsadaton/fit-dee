import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    reporters: 'default',
  },
  resolve: {
    alias: {
      // Mirror tsconfig "@/*" so service tests can import @/lib/...
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
