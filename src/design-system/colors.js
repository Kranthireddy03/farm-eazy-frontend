/** Semantic and brand colors — map to CSS variables in tokens.css / index.css */
export const colors = {
  brand: {
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    accent: 'hsl(var(--fe-accent))',
    fe: 'hsl(var(--fe-brand))',
  },
  semantic: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border))',
    destructive: 'hsl(var(--destructive))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    info: 'hsl(var(--info))',
  },
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
};
