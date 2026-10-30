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
        // Sophisticated Dark Cybersecurity Theme Tokens
        canvas: '#090D16',           // Main background
        surface: '#101827',          // Secondary background
        card: '#151F30',             // Card background
        'card-elevated': '#1E293B',  // Elevated card
        border: '#263449',           // Default borders
        'border-subtle': '#1E293B',  // Subtle dividers
        
        // Text
        heading: '#F8FAFC',          // Primary text
        body: '#94A3B8',             // Secondary text
        muted: '#64748B',            // Muted text
        
        // Semantic Accents
        accent: '#38BDF8',           // Primary accent (Sky/Cyan)
        primary: '#38BDF8',          // Sky blue
        success: '#22C55E',          // Emerald green
        danger: '#EF4444',           // Crimson red
        warning: '#F59E0B',          // Amber gold
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
