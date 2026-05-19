import React from 'react';

export default function Skeleton({ width, height, borderRadius, style, className = '' }) {
  const mergedStyle = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: borderRadius || '4px',
    backgroundColor: 'var(--bg-800)',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  return (
    <div className={`skeleton-loader ${className}`} style={mergedStyle}>
      <div className="skeleton-pulse" />
    </div>
  );
}
