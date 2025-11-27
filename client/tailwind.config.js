/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Netflix Sans', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        mangu: {
          charcoal: '#050505',
          ink: '#0f111a',
          accent: '#ff6b00'
        }
      }
    }
  },
  plugins: []
};

