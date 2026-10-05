/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#09090B',
          surface: '#111113',
          secondary: '#18181B',
          elevated: '#1E1E22',
        },
        border: {
          DEFAULT: '#27272A',
          strong: '#3F3F46',
        },
        accent: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          subtle: 'rgba(56, 189, 248, 0.1)',
        },
        status: {
          healthy: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          unknown: '#71717A',
        },
        text: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
