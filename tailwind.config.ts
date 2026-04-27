import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fefcf8',
          100: '#fdf6ec',
          200: '#faecd6',
          300: '#f5ddb3',
          400: '#efc885',
          500: '#e8b05a',
          600: '#d9943a',
          700: '#b57530',
          800: '#915f2e',
          900: '#764f29',
        },
        terracotta: {
          50: '#fdf4f1',
          100: '#fce6df',
          200: '#f9cfc4',
          300: '#f4ad9a',
          400: '#ec7f67',
          500: '#e05d44',
          600: '#c1694f',
          700: '#a3503c',
          800: '#874436',
          900: '#713c32',
        },
        sage: {
          50: '#f3f7f3',
          100: '#e4ede5',
          200: '#c8dbca',
          300: '#a0c0a4',
          400: '#739f78',
          500: '#52825a',
          600: '#3d6845',
          700: '#335439',
          800: '#2b4430',
          900: '#243829',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
