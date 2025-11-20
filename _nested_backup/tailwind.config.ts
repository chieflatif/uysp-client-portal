import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rebel HQ Oceanic Theme
        'rebel-dark': '#111827',
        'rebel-primary': '#be185d',
        'rebel-secondary': '#4f46e5',
        'rebel-tertiary': '#22d3ee',
      },
    },
  },
  plugins: [],
};

export default config;
