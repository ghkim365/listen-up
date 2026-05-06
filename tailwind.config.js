/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#111317',
        'charcoal-dark': '#111317',
        'charcoal-light': '#1a1c20',
        'scholar-blue': '#adc6ff',
        'scholar-border': 'rgba(255, 255, 255, 0.08)',
        'muted-coral': 'rgba(255, 180, 171, 0.12)',
        'text-coral': '#ffb4ab',
        'on-surface-variant': '#c1c6d7',
        'outline-variant': '#414755',
        'premium-red': '#ff3b30',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
