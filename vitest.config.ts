import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/cleanupTmp.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', '.github/framework/**'],
    coverage: {
      provider: 'v8',
      exclude: [
        'src/components/ui/**',
        'src/app/**/layout.tsx',
        'src/app/about/**',
        'src/app/contact/components/**',
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
