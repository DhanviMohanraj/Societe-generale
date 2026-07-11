import React from 'react';

export default function LexoraLogo({ className = 'w-10 h-10', ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Gradients for the L-shape */}
        <linearGradient id="lWallGrad" x1="15" y1="15" x2="30" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="60%" stopColor="#E01020" />
          <stop offset="100%" stopColor="#99000D" />
        </linearGradient>
        <linearGradient id="lBaseGrad" x1="15" y1="75" x2="70" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E01020" />
          <stop offset="30%" stopColor="#B11226" />
          <stop offset="100%" stopColor="#660007" />
        </linearGradient>

        {/* Gradients for the nodes */}
        <radialGradient id="redNodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF453A" />
          <stop offset="80%" stopColor="#D01020" />
          <stop offset="100%" stopColor="#800000" />
        </radialGradient>
        <radialGradient id="silverNodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#B0B5BC" />
          <stop offset="100%" stopColor="#70757D" />
        </radialGradient>
        <radialGradient id="darkNodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6C727A" />
          <stop offset="80%" stopColor="#3A3F45" />
          <stop offset="100%" stopColor="#1E2227" />
        </radialGradient>

        {/* Glow Filters */}
        <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Network Edges (Lines) */}
      <g stroke="#3A4659" strokeWidth="1" opacity="0.8">
        {/* Connections from column 1 (red) */}
        <line x1="45" y1="10" x2="45" y2="30" stroke="#B11226" strokeWidth="1.5" />
        <line x1="45" y1="30" x2="45" y2="55" stroke="#B11226" strokeWidth="1.5" />
        <line x1="45" y1="10" x2="68" y2="20" stroke="#8A2532" strokeWidth="1.2" />
        <line x1="45" y1="30" x2="68" y2="20" stroke="#8A2532" strokeWidth="1.2" />
        <line x1="45" y1="30" x2="68" y2="42" stroke="#8A2532" strokeWidth="1.2" />
        <line x1="45" y1="55" x2="68" y2="42" stroke="#8A2532" strokeWidth="1.2" />
        <line x1="45" y1="55" x2="68" y2="68" />

        {/* Connections from column 2 (silver) */}
        <line x1="68" y1="20" x2="68" y2="42" />
        <line x1="68" y1="42" x2="68" y2="68" />
        <line x1="68" y1="20" x2="90" y2="32" />
        <line x1="68" y1="42" x2="90" y2="32" />
        <line x1="68" y1="42" x2="90" y2="56" />
        <line x1="68" y1="68" x2="90" y2="56" />
        <line x1="68" y1="68" x2="90" y2="78" />

        {/* Connections from column 3 (silver/dark) */}
        <line x1="90" y1="32" x2="90" y2="56" />
        <line x1="90" y1="56" x2="90" y2="78" />
      </g>

      {/* 3D "L" Shapes */}
      {/* L Vertical Wall */}
      <polygon points="15,15 30,10 30,70 15,75" fill="url(#lWallGrad)" />
      
      {/* L Bottom Base */}
      <polygon points="15,75 30,70 70,90 55,95" fill="url(#lBaseGrad)" />

      {/* Network Nodes (Circles) */}
      {/* Column 1 - Red Nodes */}
      <circle cx="45" cy="10" r="3.5" fill="url(#redNodeGrad)" filter="url(#redGlow)" />
      <circle cx="45" cy="30" r="3.5" fill="url(#redNodeGrad)" filter="url(#redGlow)" />
      <circle cx="45" cy="55" r="3.5" fill="url(#redNodeGrad)" filter="url(#redGlow)" />

      {/* Column 2 - Silver Nodes */}
      <circle cx="68" cy="20" r="3.5" fill="url(#silverNodeGrad)" />
      <circle cx="68" cy="42" r="3.5" fill="url(#silverNodeGrad)" />
      <circle cx="68" cy="68" r="3.5" fill="url(#silverNodeGrad)" />

      {/* Column 3 - Silver & Dark Nodes */}
      <circle cx="90" cy="32" r="3.5" fill="url(#silverNodeGrad)" />
      <circle cx="90" cy="56" r="3.5" fill="url(#darkNodeGrad)" />
      <circle cx="90" cy="78" r="3.5" fill="url(#darkNodeGrad)" />
    </svg>
  );
}
