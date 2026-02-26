// AvatarCropper.jsx - Simple avatar cropping tool for profile image
import React, { useRef, useState } from 'react';

export default function AvatarCropper({ src, onCrop }) {
  const canvasRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 128 });

  // Draw cropped image
  React.useEffect(() => {
    if (!src) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      ctx.clearRect(0, 0, 128, 128);
      ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, 128, 128);
    };
  }, [src, crop]);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    onCrop(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={128} height={128} className="border rounded" />
      <button className="btn btn-sm mt-2" onClick={handleCrop}>Crop & Save</button>
    </div>
  );
}
