/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004838",
          hover: "#003b2d",
        },
        secondary: "#073127",
        accent: {
          DEFAULT: "#E2FB6C",
          hover: "#d4f54e",
        },
        neutral: "#333F3C",
        success: "#16a34a",
        warning: "#ca8a04",
        danger: "#dc2626",
        background: "rgb(var(--background) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #004838, #073127)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0,72,56,0.08)',
        'soft': '0 10px 40px -10px rgba(0,72,56,0.12)',
        'floating': '0 20px 50px -20px rgba(0,72,56,0.18)',
        'card': '0 2px 12px rgba(0,72,56,0.06)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
