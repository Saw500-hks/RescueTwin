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
        // Core palette
        navy: {
          950: '#0B0F19',
          900: '#0D1117',
          800: '#161B22',
          700: '#1F2937',
        },
        // Emergency orange (primary brand)
        orange: {
          brand: '#FF6B00',
          light: '#F5A623',
          dark: '#E55A00',
          muted: '#FF8A3D',
        },
        // Tactical cyan (secondary)
        cyan: {
          brand: '#00E5FF',
          dark: '#00B0FF',
          muted: '#38BDF8',
        },
        // Damage severity
        damage: {
          none: '#22C55E',
          minor: '#EAB308',
          major: '#F97316',
          destroyed: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255, 107, 0, 0.3), 0 0 40px rgba(255, 107, 0, 0.1)',
        'cyan-glow': '0 0 20px rgba(0, 229, 255, 0.3), 0 0 40px rgba(0, 229, 255, 0.1)',
        'red-glow': '0 0 14px rgba(239, 68, 68, 0.6)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 229, 255, 0.08)',
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF6B00 0%, #E55A00 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)',
        'gradient-radial-orange': 'radial-gradient(ellipse at center, rgba(255,107,0,0.15) 0%, transparent 70%)',
        'gradient-radial-cyan': 'radial-gradient(ellipse at center, rgba(0,229,255,0.12) 0%, transparent 70%)',
        'hero-overlay': 'linear-gradient(to bottom, rgba(11,15,25,0.3) 0%, rgba(11,15,25,0.7) 60%, rgba(11,15,25,1) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'scan': 'scanline 4s linear infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'xl': '10px',
        '2xl': '14px',
      },
    },
  },
  plugins: [],
}
