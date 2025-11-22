// Binectics Design Tokens - Blinkist-inspired
// Used across web (Tailwind) and mobile (React Native)

export const colors = {
  // Primary - Blinkist Bright Lime-Teal Green
  primary: {
    50: '#E6FFF5',
    100: '#B3FFDF',
    200: '#80FFC9',
    300: '#4DFFB3',
    400: '#1AFF9D',
    500: '#00D991', // Main Blinkist green (bright!)
    600: '#00B877',
    700: '#008A5A',
    800: '#005C3D',
    900: '#002E1F',
  },
  // Accent colors - Blinkist uses multiple vibrant colors
  accent: {
    blue: {
      50: '#E6F2FF',
      100: '#BAE0FF',
      500: '#3B9EFF', // Blinkist blue
      600: '#2B7FDB',
      700: '#1D5FAF',
    },
    yellow: {
      50: '#FFF9E6',
      100: '#FFECB3',
      500: '#FFD93D', // Blinkist yellow
      600: '#E6C235',
      700: '#BFA02A',
    },
    purple: {
      50: '#F3E6FF',
      100: '#E0B3FF',
      500: '#A855F7', // Blinkist purple
      600: '#9333EA',
      700: '#7E22CE',
    },
    orange: {
      50: '#FFF4E6',
      100: '#FFE0B3',
      500: '#FF9F43', // Blinkist orange
      600: '#E68A3A',
      700: '#BF7230',
    },
  },
  // Secondary - Blinkist Dark Charcoal
  secondary: {
    50: '#F5F6F7',
    100: '#E8EAED',
    200: '#D1D5DA',
    300: '#A3ACB6',
    400: '#7C8693',
    500: '#5A6472',
    600: '#434D5B',
    700: '#353E4A',
    800: '#2D3339',
    900: '#23292E',
  },
  // Neutral - Blinkist warm grays and creams
  neutral: {
    50: '#FDFCFB',
    100: '#F7F4EF',    // Light cream background
    200: '#EEEBE6',    // Cream sections
    300: '#E5E1DA',
    400: '#C9C4BA',
    500: '#A39E94',
    600: '#7D7870',
    700: '#5C5851',
    800: '#3E3B36',
    900: '#28251F',
  },
  // Semantic colors (Blinkist style)
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#047857',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#B91C1C',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },
  // Background - Blinkist uses light cream/beige with white sections
  background: {
    primary: '#F7F4EF',        // Light cream base
    secondary: '#FFFFFF',      // White sections
    tertiary: '#EEEBE6',       // Darker cream (footer)
  },
  // Text - Blinkist uses almost black with warm gray tones
  text: {
    primary: '#23292E',        // Almost black
    secondary: '#6B7684',      // Medium gray
    tertiary: '#8B95A1',       // Light gray
    inverse: '#FFFFFF',        // White text
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Cera Pro', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Cera Pro', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.16' }],
    '6xl': ['3.75rem', { lineHeight: '1.1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.5rem',
  md: '0.625rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  card: '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 16px -4px rgb(0 0 0 / 0.08)',
  button: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
