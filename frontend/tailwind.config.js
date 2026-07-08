/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        helios: {
          primary: '#0A8478',
          'primary-dark': '#066F66',
          'primary-light': '#1FA89B',
          deep: '#0A4F6B',
          accent: '#3DDC97',
          ink: '#0F2A36',
          mist: '#F4F7F8',
          // Color de marca del logo (Parcial 2). Solo se usa en el logo/wordmark;
          // los botones y enlaces siguen en `primary` (teal).
          logo: '#F34B56',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(10,42,54,0.05), 0 4px 12px rgba(10,42,54,0.06)',
      },
    },
  },
  plugins: [],
}
