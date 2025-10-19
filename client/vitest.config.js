import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      react: resolve(__dirname, '../node_modules/react'),
      'react-dom': resolve(__dirname, '../node_modules/react-dom'),
      'react-router-dom/node_modules/react': resolve(__dirname, '../node_modules/react'),
      'react-router-dom/node_modules/react-dom': resolve(__dirname, '../node_modules/react-dom'),
      'react-router-dom': resolve(__dirname, 'tests/mocks/react-router-dom.jsx')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setupTests.js'],
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    server: {
      deps: {
        inline: ['react-router-dom', 'react-router']
      }
    }
  }
});
