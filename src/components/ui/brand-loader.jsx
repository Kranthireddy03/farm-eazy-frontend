import { motion } from 'framer-motion';

export function BrandLoader({ message = 'Loading FarmEazy…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`} role="status" aria-live="polite">
      <motion.div
        className="relative h-14 w-14"
        initial={{ opacity: 0.6, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 rounded-lg bg-primary/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          FE
        </div>
        <motion.div
          className="absolute -inset-1 rounded-xl border-2 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: 'hsl(var(--primary))' }}
        />
      </motion.div>
      <p className="mt-6 text-sm font-medium text-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">Preparing your workspace</p>
    </div>
  );
}

export default BrandLoader;
