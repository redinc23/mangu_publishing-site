import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setupTests.js'],
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)']
  }
});
