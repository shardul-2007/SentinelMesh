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
        // Enterprise SaaS Light-First Palette (Stripe/Linear/AWS aesthetic)
        canvas: '#F7F8FA',           // Main background
        surface: '#FFFFFF',          // Primary surface / card
        card: '#FFFFFF',             // Card surface
        'card-elevated': '#FFFFFF',  // Elevated surface
        border: '#E5E7EB',           // Subtle borders
        'border-subtle': '#F1F5F9',  // Light dividers
        
        // Professional Typography
        heading: '#172B4D',          // Primary text (Deep slate/navy)
        body: '#64748B',             // Secondary text (Slate 500)
        muted: '#94A3B8',            // Muted slate
        
        // Core Accent Colors
        primary: '#2563EB',          // Primary blue (Blue 600)
        'primary-hover': '#1D4ED8',  // Blue 700
        navy: '#14213D',             // Dark navy accent
        
        // Semantic Indicators
        success: '#15803D',          // Enterprise green (Green 700)
        danger: '#DC2626',           // Enterprise red (Red 600)
        warning: '#D97706',          // Enterprise amber (Amber 600)
        subtle: '#F1F5F9',           // Muted background
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
