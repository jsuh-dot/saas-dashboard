/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#0B0F1A',
          800: '#101726',
          700: '#172033',
          600: '#1F2B43',
          500: '#2C3A59'
        },
        good: '#16a34a',
        bad: '#ef4444'
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
}