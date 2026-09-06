/**
 * Tactical Reticle Brackets Component
 */
import React from 'react';

interface ReticleCornerProps {
  color?: string;
  size?: number;
  className?: string;
}

export const ReticleCorner: React.FC<ReticleCornerProps> = ({
  color = '#00f0ff',
  size = 6,
  className = ''
}) => {
  return (
    <>
      <span
        style={{
          borderColor: color,
          width: `${size}px`,
          height: `${size}px`
        }}
        className={`absolute top-0 left-0 border-t border-l pointer-events-none ${className}`}
      />
      <span
        style={{
          borderColor: color,
          width: `${size}px`,
          height: `${size}px`
        }}
        className={`absolute top-0 right-0 border-t border-r pointer-events-none ${className}`}
      />
      <span
        style={{
          borderColor: color,
          width: `${size}px`,
          height: `${size}px`
        }}
        className={`absolute bottom-0 left-0 border-b border-l pointer-events-none ${className}`}
      />
      <span
        style={{
          borderColor: color,
          width: `${size}px`,
          height: `${size}px`
        }}
        className={`absolute bottom-0 right-0 border-b border-r pointer-events-none ${className}`}
      />
    </>
  );
};
