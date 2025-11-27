import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 5179,
    host: true,
    strictPort: true,
    hmr: {
      port: 5179
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3009',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : []
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@headlessui/react', 'framer-motion', 'lucide-react'],
          'vendor-query': ['@tanstack/react-query', 'axios'],
          'vendor-aws': ['aws-amplify', '@aws-amplify/ui-react'],
          'vendor-utils': ['react-hook-form', 'zustand', 'clsx']
        },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType)) {
            extType = 'img';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          } else if (/css/i.test(extType)) {
            extType = 'css';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    cssCodeSplit: true,
    target: 'esnext',
    modulePreload: {
      polyfill: true
    }
  },
  preview: {
    port: 4173,
    host: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'clsx'
    ],
    exclude: ['@aws-amplify/ui-react']
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setupTests.js'],
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 20000
  }
});
