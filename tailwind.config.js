/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        teal: {
          DEFAULT: '#0A7C6E',
          dark: '#065E53',
          light: '#0D9E8D',
          faint: '#E8F5F3',
        },
        amber: {
          DEFAULT: '#F5A623',
          dark: '#D4891A',
          faint: '#FEF7E8',
        },
      },
    },
  },
  plugins: [],
}
