/**
 * Design system constants for JS (mirrors tokens.css).
 */
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
};

export const typography = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  pageTitle: 'text-2xl font-semibold tracking-tight',
  sectionTitle: 'text-base font-semibold',
  muted: 'text-sm text-muted-foreground',
};

export const motion = {
  fade: 'transition-opacity duration-[var(--duration-normal)] ease-[var(--ease-out)]',
  lift: 'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] hover:shadow-md',
};

export const iconSize = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};
