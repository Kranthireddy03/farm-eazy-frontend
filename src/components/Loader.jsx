import React from 'react';
import UnifiedLoader from './ui/UnifiedLoader';

const Loader = ({ message = 'Loading, please wait...', subtitle = 'Preparing your agricultural workspace' }) => (
  <UnifiedLoader fullScreen size="lg" message={message} subtitle={subtitle} />
);

export default Loader;
