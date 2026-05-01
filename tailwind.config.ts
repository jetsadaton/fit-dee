import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0E0F12',
          2: '#15171C',
          3: '#1C1F26',
          4: '#262A33',
        },
        border: {
          DEFAULT: '#2A2E38',
          hi: '#3A3F4B',
        },
        ink: {
          DEFAULT: '#F2F3F5',
          dim: '#A8ADB8',
          mute: '#6B7080',
        },
        coral: {
          DEFAULT: '#FF6B47',
          hi: '#FF8666',
          dim: '#3A1A14',
        },
        lime: {
          DEFAULT: '#C6FF4D',
          hi: '#D7FF7A',
          dim: '#2A3414',
        },
        macro: {
          protein: '#FF8585',
          carb: '#FFCB66',
          fat: '#7FB8FF',
        },
        ring: {
          move: '#FF6B47',
          eat: '#C6FF4D',
          burn: '#7FB8FF',
        },
        success: '#5BD68F',
        warn: '#FFB84D',
        danger: '#FF5252',
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        cdBounce: {
          '0%,60%,100%': { transform: 'translateY(0)', opacity: '0.5' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        cdPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(198,255,77,0.6)' },
          '70%': { boxShadow: '0 0 0 8px rgba(198,255,77,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(198,255,77,0)' },
        },
        cdFadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        cdBounce: 'cdBounce 1.2s ease-in-out infinite',
        cdPulse: 'cdPulse 1.4s infinite',
        cdFadeIn: 'cdFadeIn 0.2s ease',
      },
    },
  },
  plugins: [],
};

export default config;
