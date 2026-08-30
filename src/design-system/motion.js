export const motion = {
  duration: {
    fast: 'duration-fast',
    normal: 'duration-normal',
    slow: 'duration-slow',
  },
  ease: {
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
  transition: {
    colors: 'transition-colors duration-normal ease-out',
    shadow: 'transition-shadow duration-normal ease-out',
    transform: 'transition-transform duration-normal ease-out',
    fade: 'animate-in fade-in duration-normal',
  },
  pageEnter: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

export const motionCss = {
  fast: 'var(--duration-fast)',
  normal: 'var(--duration-normal)',
  slow: 'var(--duration-slow)',
  easeOut: 'var(--ease-out)',
  easeInOut: 'var(--ease-in-out)',
};
