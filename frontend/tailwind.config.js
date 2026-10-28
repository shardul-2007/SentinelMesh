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
        console: {
          graphite: '#171A1F',
          slate: '#242A32',
          offwhite: '#F5F4F0',
          white: '#FFFFFF',
          steel: '#737B86',
          border: '#D9DDE2',
          blue: '#315C78',
          'blue-hover': '#26495F',
          'blue-light': '#EBF2F7',
          green: '#287653',
          'green-light': '#EDF6F2',
          'green-border': '#BCE2D1',
          amber: '#98661C',
          'amber-light': '#FDF7ED',
          'amber-border': '#F5DEB3',
          red: '#B53A3A',
          'red-light': '#FDF2F2',
          'red-border': '#F7C4C4',
        },
        // Maintain backwards compatibility aliases mapped to new palette
        mesh: {
          bg: '#F5F4F0',
          sidebar: '#171A1F',
          panel: '#FFFFFF',
          elevated: '#FFFFFF',
          border: '#D9DDE2',
          text: '#171A1F',
          muted: '#737B86',
          accent: '#315C78',
          success: '#287653',
          warning: '#98661C',
          danger: '#B53A3A',
        },
        graphite: {
          950: '#171A1F',
          900: '#1D2228',
          850: '#242A32',
          800: '#2E353F',
          750: '#3D4552',
          700: '#525C6C',
          600: '#737B86',
          500: '#8E96A2',
          400: '#B0B7C1',
          300: '#D9DDE2',
          200: '#E8EBEF',
          100: '#F5F4F0',
          50: '#FFFFFF',
        },
        sentinel: {
          allow: '#287653',
          'allow-bg': '#EDF6F2',
          'allow-border': '#BCE2D1',
          approval: '#98661C',
          'approval-bg': '#FDF7ED',
          'approval-border': '#F5DEB3',
          block: '#B53A3A',
          'block-bg': '#FDF2F2',
          'block-border': '#F7C4C4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
