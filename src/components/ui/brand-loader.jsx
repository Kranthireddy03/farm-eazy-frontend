import React from 'react';
import UnifiedLoader from './UnifiedLoader';

export function BrandLoader({ message = 'Loading FarmEazy…', subtitle = 'Preparing your workspace', size = 'md', className = '' }) {
  return (
    <UnifiedLoader 
      size={size} 
      message={message} 
      subtitle={subtitle} 
      className={className} 
    />
  );
}

export default BrandLoader;
