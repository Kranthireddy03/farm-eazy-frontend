import React, { useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = 
    type === 'success' ? 'bg-green-500' : 
    type === 'warning' ? 'bg-yellow-500' : 
    'bg-red-500';
    
  const icon = 
    type === 'success' ? '✓' : 
    type === 'warning' ? '⏰' : 
    '✕';

  return (
    <div
      className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in z-50`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
}

export default Toast;
