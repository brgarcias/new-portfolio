import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/theme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Only the HeroUI components the site uses. The whole theme would add
    // the styles of every component to the CSS of every page.
    './node_modules/@heroui/theme/dist/components/(button|input|modal|spacer|spinner).js',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui()],
};
export default config;
