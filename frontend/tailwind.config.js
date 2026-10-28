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
        // Official Cybersecurity Theme Tokens
        canvas: '#1A1D20',
        surface: '#2D3238',
        'surface-elevated': '#353B42',
        accent: '#00FA9A',
        heading: '#FFFFFF',
        body: '#A0A5AD',
        border: '#414850',
        'border-subtle': '#353B42',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#38BDF8',
        'text-on-accent': '#1A1D20',

        // Legacy / Cyber mapped tokens to official palette
        cyber: {
          bg: '#1A1D20',
          panel: '#2D3238',
          elevated: '#353B42',
          border: '#414850',
          'border-subtle': '#353B42',
          mint: '#00FA9A',
          'mint-glow': 'rgba(0, 250, 154, 0.2)',
          accent: '#00FA9A',
          amber: '#F59E0B',
          red: '#EF4444',
          info: '#38BDF8',
          text: '#FFFFFF',
          heading: '#FFFFFF',
          body: '#A0A5AD',
          muted: '#A0A5AD',
          dim: '#6B7280',
          gold: '#00FA9A',
          orange: '#38BDF8',
          yellow: '#F59E0B',
          emerald: '#00FA9A',
        },
        sentinel: {
          allow: '#00FA9A',
          'allow-bg': 'rgba(0, 250, 154, 0.12)',
          'allow-border': 'rgba(0, 250, 154, 0.3)',
          approval: '#F59E0B',
          'approval-bg': 'rgba(245, 158, 11, 0.12)',
          'approval-border': 'rgba(245, 158, 11, 0.3)',
          block: '#EF4444',
          'block-bg': 'rgba(239, 68, 68, 0.12)',
          'block-border': 'rgba(239, 68, 68, 0.3)',
          info: '#38BDF8',
          'info-bg': 'rgba(56, 189, 248, 0.12)',
          'info-border': 'rgba(56, 189, 248, 0.3)',
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
