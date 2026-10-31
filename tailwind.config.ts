import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/theme';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Only the HeroUI components the site uses: the fields of the feedback
    // form and the dialog. The whole theme would add the styles of every
    // component to the CSS of every page.
    './node_modules/@heroui/theme/dist/components/(input|modal).js',
  ],
  darkMode: 'class',
  plugins: [heroui()],
};
export default config;
