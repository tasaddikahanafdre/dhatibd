/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F7F7F7',
          100: '#EFEFEF',
          200: '#DFDFDF',
          300: '#CCCCCC',
          400: '#999999',
          500: '#666666',
          600: '#333333',
          700: '#222222',
          800: '#141414',
          900: '#0A0A0A',
          black: '#000000',
          white: '#FFFFFF',
          border: '#E5E5E5',
          muted: '#737373',
          surface: '#F8F9FA'
        }
      },
      fontFamily: {
        sans: [
          'Anek Bangla Bengali',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          '"Anek Bangla"',
        ],
        bangla: [
          '"Anek Bangla"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
