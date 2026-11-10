import React from 'react';

/**
 * Official FarmEazy Brand Logo & Icon Component
 * Displays the authentic brand icon (as seen in Google / browser favicon)
 * with graceful fallback and optional typography.
 */
export default function FarmEazyLogo({
  size = 'md', // 'sm' (28px), 'md' (36px), 'lg' (44px), 'xl' (56px)
  showText = true,
  className = '',
  imgClassName = '',
  textClassName = '',
  subtitleClassName = '',
  subtitle = 'Smart farming, made easy',
}) {
  const sizeMap = {
    sm: { img: 'h-7 w-7 rounded-lg', text: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'h-9 w-9 rounded-xl', text: 'text-base', sub: 'text-[10px]' },
    lg: { img: 'h-11 w-11 rounded-xl', text: 'text-lg', sub: 'text-xs' },
    xl: { img: 'h-14 w-14 rounded-2xl', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 shrink-0 group ${className}`}>
      <img
        src="/logo.png"
        alt="FarmEazy"
        className={`${currentSize.img} object-contain shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105 ${imgClassName}`}
        onError={(e) => {
          if (e.target.src.indexOf('favicon') === -1) {
            e.target.src = '/favicon-32x32.png';
          }
        }}
      />
      {showText && (
        <div className={`leading-tight ${textClassName}`}>
          <p className={`font-bold tracking-tight text-foreground group-hover:text-primary transition-colors ${currentSize.text}`}>
            FarmEazy
          </p>
          {subtitle && (
            <p className={`text-muted-foreground hidden sm:block font-medium tracking-wide ${currentSize.sub} ${subtitleClassName}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
