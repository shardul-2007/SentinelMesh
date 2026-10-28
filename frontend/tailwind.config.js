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
          bg: '#0B0F17',
          panel: '#131A24',
          elevated: '#1A2332',
          border: '#263244',
          'border-subtle': '#1B2433',
          emerald: '#10B981',
          'emerald-glow': 'rgba(16, 185, 129, 0.15)',
          blue: '#38BDF8',
          'blue-glow': 'rgba(56, 189, 248, 0.15)',
          amber: '#F59E0B',
          red: '#EF4444',
          text: '#F8FAFC',
          muted: '#94A3B8',
          dim: '#64748B',
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
