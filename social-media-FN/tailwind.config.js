/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}", // <- important for React files
  ],
  theme: {
    extend: {
      animation: {
        shake: 'shake 0.5s ease-in-out 2', // 2 times shake when triggered
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '50%': { transform: 'translateX(2px)' },
          '75%': { transform: 'translateX(-2px)' },
        },
      },
    },
  },
  plugins: [],
};
