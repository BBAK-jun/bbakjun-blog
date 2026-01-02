import type { Config } from 'tailwindcss';

import lineClamp from '@tailwindcss/line-clamp';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
    './mdx-components.tsx',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontSize: {
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.03em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.04em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.06em' }],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            fontSize: '1.0625rem',
            lineHeight: '1.75',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
              fontWeight: '400',
            },
            '[class~="lead"]': {
              color: 'inherit',
              fontSize: '1.25rem',
              lineHeight: '1.6',
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
            'ol > li::before': {
              color: 'inherit',
            },
            'ul > li::before': {
              backgroundColor: 'currentColor',
            },
            hr: {
              borderColor: 'currentColor',
              opacity: '0.15',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: 'currentColor',
              borderLeftWidth: '1px',
              paddingLeft: '1rem',
              fontStyle: 'normal',
            },
            'blockquote p': {
              marginTop: '0',
              marginBottom: '0',
            },
            h1: {
              color: 'inherit',
              fontSize: '2.25rem',
              fontWeight: '700',
              lineHeight: '1.2',
              letterSpacing: '-0.04em',
              marginTop: '0',
              marginBottom: '1rem',
            },
            h2: {
              color: 'inherit',
              fontSize: '1.875rem',
              fontWeight: '700',
              lineHeight: '1.3',
              letterSpacing: '-0.03em',
              marginTop: '2rem',
              marginBottom: '0.75rem',
            },
            h3: {
              color: 'inherit',
              fontSize: '1.5rem',
              fontWeight: '600',
              lineHeight: '1.4',
              letterSpacing: '-0.02em',
              marginTop: '1.5rem',
              marginBottom: '0.5rem',
            },
            h4: {
              color: 'inherit',
              fontSize: '1.25rem',
              fontWeight: '600',
              lineHeight: '1.5',
              marginTop: '1rem',
              marginBottom: '0.5rem',
            },
            'figure figcaption': {
              color: 'inherit',
              fontSize: '0.875rem',
              opacity: '0.7',
            },
            p: {
              marginTop: '0',
              marginBottom: '1.25rem',
            },
            code: {
              color: 'inherit',
              fontSize: '0.9em',
              fontWeight: '400',
            },
            'a code': {
              color: 'inherit',
            },
            pre: {
              color: 'inherit',
              backgroundColor: 'transparent',
              borderRadius: '0',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            thead: {
              color: 'inherit',
              borderBottomColor: 'currentColor',
              borderBottomWidth: '1px',
            },
            'tbody tr': {
              borderBottomColor: 'currentColor',
              borderBottomWidth: '1px',
            },
          },
        },
      },
    },
  },
  plugins: [lineClamp, typography],
};

export default config;
