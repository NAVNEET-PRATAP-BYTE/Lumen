/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b8ccff',
          300: '#85a9ff',
          400: '#527dff',
          500: '#2952ff',
          600: '#1230f0',
          700: '#0e22d4',
          800: '#101dab',
          900: '#121b87',
          950: '#0a0f52',
        },
        surface: {
          DEFAULT: '#0f1117',
          elevated: '#161b27',
          card: '#1c2233',
          border: '#2a3347',
        },
        accent: {
          cyan:   '#22d3ee',
          violet: '#a78bfa',
          emerald:'#34d399',
          amber:  '#fbbf24',
          rose:   '#fb7185',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'data-flow': 'dataFlow 1.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px #2952ff40, 0 0 20px #2952ff20' },
          to:   { boxShadow: '0 0 20px #2952ff80, 0 0 40px #2952ff40' },
        },
        dataFlow: {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-brand': '0 0 24px rgba(41, 82, 255, 0.3)',
        'glow-cyan':  '0 0 24px rgba(34, 211, 238, 0.3)',
        'glow-violet':'0 0 24px rgba(167, 139, 250, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
