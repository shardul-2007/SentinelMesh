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
        cyber: {
          bg: '#111317',
          panel: '#1A1D24',
          elevated: '#222630',
          border: '#2E3442',
          'border-subtle': '#252932',
          gold: '#FF9900',
          'gold-glow': 'rgba(255, 153, 0, 0.2)',
          orange: '#FB641B',
          'orange-glow': 'rgba(251, 100, 27, 0.2)',
          yellow: '#FFD814',
          emerald: '#10B981',
          'emerald-glow': 'rgba(16, 185, 129, 0.15)',
          amber: '#F59E0B',
          red: '#EF4444',
          text: '#FFFFFF',
          muted: '#9E9EA8',
          dim: '#6B7280',
        },
        sentinel: {
          allow: '#10B981',
          'allow-bg': 'rgba(16, 185, 129, 0.12)',
          'allow-border': 'rgba(16, 185, 129, 0.3)',
          approval: '#F59E0B',
          'approval-bg': 'rgba(245, 158, 11, 0.12)',
          'approval-border': 'rgba(245, 158, 11, 0.3)',
          block: '#EF4444',
          'block-bg': 'rgba(239, 68, 68, 0.12)',
          'block-border': 'rgba(239, 68, 68, 0.3)',
          gold: '#FF9900',
          orange: '#FB641B',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
