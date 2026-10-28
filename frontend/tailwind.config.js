/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mesh: {
          bg: '#10151C',
          sidebar: '#131A23',
          panel: '#19222D',
          elevated: '#202B38',
          border: '#303D4B',
          text: '#E9EFF7',
          muted: '#A2AFBE',
          accent: '#82B5F8',
          success: '#34D399',
          warning: '#FBBF24',
          danger: '#F87171',
        },
        graphite: {
          950: '#10151C',
          900: '#131A23',
          850: '#161F2A',
          800: '#19222D',
          750: '#202B38',
          700: '#283647',
          600: '#303D4B',
          500: '#536477',
          400: '#7F93A8',
          300: '#A2AFBE',
          200: '#CAD4E0',
          100: '#E9EFF7',
          50: '#F5F8FC',
        },
        sentinel: {
          allow: '#34D399',
          'allow-bg': 'rgba(52, 211, 153, 0.1)',
          'allow-border': 'rgba(52, 211, 153, 0.25)',
          approval: '#FBBF24',
          'approval-bg': 'rgba(251, 191, 36, 0.1)',
          'approval-border': 'rgba(251, 191, 36, 0.25)',
          block: '#F87171',
          'block-bg': 'rgba(248, 113, 113, 0.1)',
          'block-border': 'rgba(248, 113, 113, 0.25)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
