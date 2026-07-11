/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A1220',
        surface: '#111827',
        'surface-secondary': '#172033',
        'surface-dim': '#0A1220',
        'surface-bright': '#4a3332',
        'surface-container': '#111827',
        'surface-container-low': '#291615',
        'surface-container-high': '#172033',
        'surface-container-highest': '#452f2e',
        'surface-container-lowest': '#05080f',
        primary: '#ffb3ae',
        'primary-container': '#C8102E',
        'on-primary': '#68000c',
        'on-primary-container': '#fff8f7',
        'inverse-primary': '#c0001f',
        secondary: '#ffb3b0',
        'secondary-container': '#a4011e',
        'on-secondary': '#68000f',
        'on-secondary-container': '#ffadaa',
        tertiary: '#86cfff',
        'tertiary-container': '#007aac',
        'on-tertiary': '#00344c',
        'on-tertiary-container': '#f5f9ff',
        outline: '#2A3447',
        'outline-variant': '#2A3447',
        'on-surface': '#fedad7',
        'on-surface-variant': '#e8bcb9',
        'inverse-surface': '#fedad7',
        'inverse-on-surface': '#412b29',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
        muted: '#94A3B8',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '64px',
        gutter: '24px',
        'margin-desktop': '48px',
        'margin-mobile': '16px',
        base: '4px',
        'max-width': '1440px'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
