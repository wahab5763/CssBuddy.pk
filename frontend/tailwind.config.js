/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50:  '#EEEEFB',
          100: '#D9D8F8',
          200: '#B8B5F2',
          300: '#9692EC',
          400: '#756FE5',
          500: '#4F46E5',
          600: '#3D35D0',
          700: '#2E28A8',
          800: '#201D80',
          900: '#141259',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark:    '#111827',
        },
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)',
        'gradient-card':   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-warm':   'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-cool':   'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-green':  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'gradient-orange': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.04), 0 4px 12px 0 rgba(0,0,0,0.06)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 25px -3px rgba(0,0,0,0.1)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 25px 50px -5px rgba(0,0,0,0.12)',
        'glow':    '0 0 20px rgba(79,70,229,0.25)',
        'glow-sm': '0 0 12px rgba(79,70,229,0.18)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

