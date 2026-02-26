import React from 'react';

const spinnerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(255,255,255,0.7)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
};

const Loader = ({ message = 'Loading, please wait...' }) => (
  <div style={spinnerStyle}>
    <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500 mb-6"></div>
    <div className="text-xl font-semibold text-blue-700 animate-pulse">{message}</div>
  </div>
);

export default Loader;
