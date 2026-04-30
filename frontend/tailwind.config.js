/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        phthalo: {
          50:  '#E8EFE8', 100: '#C7D6C7', 200: '#94B196', 300: '#5F8B62',
          400: '#326639', 500: '#103713', 600: '#0D2E10', 700: '#0A240D',
          800: '#071A09', 900: '#041006', DEFAULT: '#103713',
        },
        maximum: {
          50:  '#F1F5E9', 100: '#DDE8C8', 200: '#BDD296', 300: '#9CBC65',
          400: '#7BA546', 500: '#628B35', 600: '#4F7028', 700: '#3D561F',
          800: '#2A3C16', 900: '#1A270D', DEFAULT: '#628B35',
        },
        bone: {
          50: '#FBF9F5', 100: '#F4F0E8', 200: '#E2DBD0', 300: '#CCC2B3',
          400: '#B5A893', 500: '#9D8E76', DEFAULT: '#E2DBD0',
        },
        milk: '#FFFDF5',
        ink: { 900:'#0F1A12', 700:'#2C3A30', 500:'#5C6B60', 400:'#7E8A82', 300:'#A0AAA3' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 55, 19, 0.04), 0 4px 16px rgba(16, 55, 19, 0.06)',
        ring: '0 0 0 4px rgba(98, 139, 53, 0.18)',
      },
      backgroundImage: {
        'leaf-pattern':
          "radial-gradient(circle at 20% 0%, rgba(98,139,53,0.10) 0, transparent 50%), radial-gradient(circle at 100% 20%, rgba(16,55,19,0.08) 0, transparent 45%)",
      },
    },
  },
  plugins: [],
};
