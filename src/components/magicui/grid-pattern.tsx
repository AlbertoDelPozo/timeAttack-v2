import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface GridPatternProps {
  width?: number;
  height?: number;
  squares?: [number, number][];
  className?: string;
}

export function GridPattern({
  width = 40,
  height = 40,
  squares = [],
  className = '',
}: GridPatternProps) {
  const id = useId();
  const patternId = `grid-${id}`;
  const maskId = `mask-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse">
          <path
            d={`M${width} 0V${height}H0`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.12}
          />
        </pattern>
        <radialGradient id={maskId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternId})`}
        mask={`url(#${maskId})`}
      />
      {squares.map(([col, row]) => (
        <motion.rect
          key={`${col}-${row}`}
          x={col * width + 1}
          y={row * height + 1}
          width={width - 2}
          height={height - 2}
          fill="currentColor"
          fillOpacity={0}
          animate={{ fillOpacity: [0, 0.5, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            delay: (col + row) * 0.15,
          }}
        />
      ))}
    </svg>
  );
}
