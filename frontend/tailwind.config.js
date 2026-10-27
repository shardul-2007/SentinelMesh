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
        graphite: {
          950: '#090d16',
          900: '#0f1523',
          850: '#141c2e',
          800: '#1a253c',
          750: '#212f4c',
          700: '#2a3b5f',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        sentinel: {
          allow: '#10b981',
          'allow-bg': 'rgba(16, 185, 129, 0.1)',
          'allow-border': 'rgba(16, 185, 129, 0.25)',
          approval: '#f59e0b',
          'approval-bg': 'rgba(245, 158, 11, 0.1)',
          'approval-border': 'rgba(245, 158, 11, 0.25)',
          block: '#ef4444',
          'block-bg': 'rgba(239, 68, 68, 0.1)',
          'block-border': 'rgba(239, 68, 68, 0.25)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
