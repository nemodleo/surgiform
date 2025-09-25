import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Chat UI specific classes
    'animate-bounce',
    'animate-pulse',
    'bg-gray-900',
    'bg-gray-800',
    'bg-gray-700',
    'bg-gray-600',
    'bg-gray-500',
    'bg-gray-400',
    'bg-gray-200',
    'text-gray-300',
    'text-gray-400',
    'text-gray-500',
    'text-gray-600',
    'border-gray-300',
    'from-purple-400',
    'via-purple-500',
    'to-pink-400',
    'from-blue-500',
    'to-purple-500',
    'from-blue-600',
    'to-purple-600',
    'bg-purple-500/80',
    'hover:bg-gray-500',
    'hover:scale-105',
    'hover:scale-110',
    'hover:shadow-3xl',
    'group-hover:scale-110',
    'group-hover:translate-x-[-12rem]',
    'group-hover:opacity-100',
    'shadow-2xl',
    'shadow-3xl',
    'rounded-2xl',
    'fixed',
    'z-40',
    'z-50',
    'bottom-8',
    'right-8',
    'w-16',
    'h-16',
    'w-9',
    'h-9',
    'w-7',
    'h-7',
    'w-5',
    'h-5',
    'w-4',
    'h-4',
    'w-2',
    'h-2',
    'h-1',
    'animate-spin',
    'scrollbar-thin',
    'scrollbar-thumb-gray-600',
    'scrollbar-track-gray-800',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "none",
            animationTimingFunction: "cubic-bezier(0,0,0.2,1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        bounce: "bounce 1s infinite",
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
export default config;