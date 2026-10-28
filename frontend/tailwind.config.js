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
        // High-Contrast Black & White + Cyber Yellow + Crimson Red Palette
        canvas: '#000000',
        surface: '#121212',
        'surface-elevated': '#1C1C1C',
        accent: '#FACC15',
        heading: '#FFFFFF',
        body: '#D4D4D8',
        border: '#27272A',
        'border-subtle': '#1C1C1C',
        warning: '#FACC15',
        danger: '#EF4444',
        info: '#FACC15',
        'text-on-accent': '#000000',

        // Cyber mapped tokens
        cyber: {
          bg: '#000000',
          panel: '#121212',
          elevated: '#1C1C1C',
          border: '#27272A',
          'border-subtle': '#1C1C1C',
          yellow: '#FACC15',
          'yellow-glow': 'rgba(250, 204, 21, 0.2)',
          accent: '#FACC15',
          amber: '#FACC15',
          red: '#EF4444',
          crimson: '#EF4444',
          info: '#FACC15',
          text: '#FFFFFF',
          heading: '#FFFFFF',
          body: '#D4D4D8',
          muted: '#A1A1AA',
          dim: '#71717A',
          gold: '#FACC15',
          orange: '#FACC15',
          emerald: '#FACC15',
          mint: '#FACC15',
        },
        sentinel: {
          allow: '#FACC15',
          'allow-bg': 'rgba(250, 204, 21, 0.12)',
          'allow-border': 'rgba(250, 204, 21, 0.3)',
          approval: '#FACC15',
          'approval-bg': 'rgba(250, 204, 21, 0.12)',
          'approval-border': 'rgba(250, 204, 21, 0.3)',
          block: '#EF4444',
          'block-bg': 'rgba(239, 68, 68, 0.12)',
          'block-border': 'rgba(239, 68, 68, 0.3)',
          info: '#FACC15',
          'info-bg': 'rgba(250, 204, 21, 0.12)',
          'info-border': 'rgba(250, 204, 21, 0.3)',
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
