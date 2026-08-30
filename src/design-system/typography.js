/** Typography tokens — prefer Tailwind classes from this map */
export const typography = {
  pageTitle: 'text-2xl font-semibold tracking-tight text-foreground',
  sectionTitle: 'text-base font-semibold text-foreground',
  cardTitle: 'text-sm font-medium text-muted-foreground',
  body: 'text-sm text-foreground leading-normal',
  bodyMuted: 'text-sm text-muted-foreground leading-relaxed',
  caption: 'text-xs text-muted-foreground',
  metric: 'text-2xl font-semibold tracking-tight',
  label: 'text-sm font-medium leading-none',
};

export const fontSize = {
  xs: 'var(--font-size-xs)',
  sm: 'var(--font-size-sm)',
  base: 'var(--font-size-base)',
  lg: 'var(--font-size-lg)',
  xl: 'var(--font-size-xl)',
  '2xl': 'var(--font-size-2xl)',
  '3xl': 'var(--font-size-3xl)',
  '4xl': 'var(--font-size-4xl)',
};

export const lineHeight = {
  tight: 'var(--line-height-tight)',
  normal: 'var(--line-height-normal)',
  relaxed: 'var(--line-height-relaxed)',
};
