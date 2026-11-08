/**
 * SeatMap — interactive SVG arena layout with 4 bookable zones.
 *
 * Each zone responds to hover (glow + scale) and click (selection).
 * The whole map has a subtle 3D perspective that tracks the cursor
 * for a premium feel.
 */

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onZoneSelect: (zone: string) => void;
  selectedZone: string | null;
  stockByZone?: Record<string, number>;
}

const ZONES = [
  {
    id: 'vip-floor',
    label: 'VIP Floor',
    price: '₹9,999',
    color: '#F59E0B',
    hoverColor: '#FBBF24',
    // Center ellipse
    d: 'M200,200 Q200,160 260,150 Q320,140 380,150 Q440,160 440,200 Q440,240 380,250 Q320,260 260,250 Q200,240 200,200Z',
  },
  {
    id: 'tier-1',
    label: 'Tier 1',
    price: '₹4,999',
    color: '#3B82F6',
    hoverColor: '#60A5FA',
    // Inner arc
    d: 'M130,280 Q130,150 200,110 Q270,70 320,68 Q370,70 440,110 Q510,150 510,280 Q460,240 320,230 Q180,240 130,280Z',
  },
  {
    id: 'tier-2',
    label: 'Tier 2',
    price: '₹2,499',
    color: '#8B5CF6',
    hoverColor: '#A78BFA',
    // Outer arc
    d: 'M60,340 Q60,170 140,100 Q220,30 320,25 Q420,30 500,100 Q580,170 580,340 Q530,280 320,260 Q110,280 60,340Z',
  },
  {
    id: 'lounge',
    label: 'Lounge',
    price: '₹7,499',
    color: '#10B981',
    hoverColor: '#34D399',
    // Two side sections
    d: 'M30,200 Q30,300 60,340 L60,200 Q60,140 80,100 L30,130Z M610,200 Q610,300 580,340 L580,200 Q580,140 560,100 L610,130Z',
  },
];

export function SeatMap({ onZoneSelect, selectedZone, stockByZone }: Props) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -6;
    setTilt({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          perspective: 800,
        }}
        animate={{
          rotateY: tilt.x,
          rotateX: tilt.y,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      >
        <svg
          viewBox="0 0 640 400"
          className="w-full h-auto drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 4px 24px rgba(59,130,246,0.15))' }}
        >
          {/* Background */}
          <defs>
            <radialGradient id="arena-bg" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="640" height="400" rx="16" fill="url(#arena-bg)" stroke="#334155" strokeWidth="1" />

          {/* Stage */}
          <rect x="220" y="60" width="200" height="50" rx="25" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
          <text x="320" y="90" textAnchor="middle" fill="#94A3B8" fontSize="14" fontWeight="700" letterSpacing="4" fontFamily="monospace">
            STAGE
          </text>

          {/* Zones — rendered back-to-front */}
          {[...ZONES].reverse().map((zone) => {
            const isSelected = selectedZone === zone.id;
            const isHovered = hoveredZone === zone.id;
            const stock = stockByZone?.[zone.id] ?? 100;
            const opacity = Math.max(0.3, stock / 100);

            return (
              <g key={zone.id}>
                <motion.path
                  d={zone.d}
                  fill={isSelected ? zone.hoverColor : zone.color}
                  fillOpacity={isSelected ? 0.6 : isHovered ? 0.5 : opacity * 0.35}
                  stroke={isSelected ? zone.hoverColor : isHovered ? zone.hoverColor : zone.color}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  style={{ cursor: 'pointer' }}
                  filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={() => onZoneSelect(zone.id)}
                />
              </g>
            );
          })}

          {/* Zone labels */}
          {ZONES.map((zone) => {
            const isSelected = selectedZone === zone.id;
            // Approximate label positions
            const positions: Record<string, { x: number; y: number }> = {
              'vip-floor': { x: 320, y: 205 },
              'tier-1': { x: 320, y: 170 },
              'tier-2': { x: 320, y: 130 },
              'lounge': { x: 45, y: 230 },
            };
            const pos = positions[zone.id] || { x: 320, y: 200 };
            if (zone.id === 'lounge') return null; // Skip label for split zones

            return (
              <text
                key={`label-${zone.id}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fill={isSelected ? '#fff' : '#94A3B8'}
                fontSize={zone.id === 'vip-floor' ? '11' : '10'}
                fontWeight="600"
                fontFamily="system-ui"
                style={{ pointerEvents: 'none' }}
              >
                {zone.label}
              </text>
            );
          })}

          {/* Audience rows hint — tiny dots */}
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 8 + row * 3 }).map((_, col, arr) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={320 - ((arr.length - 1) * 12) / 2 + col * 12}
                cy={290 + row * 16}
                r="2"
                fill="#334155"
                opacity={0.4}
              />
            ))
          )}
        </svg>
      </motion.div>

      {/* Zone legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => onZoneSelect(zone.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              selectedZone === zone.id
                ? 'border-white/30 bg-white/10 text-white scale-105 shadow-lg'
                : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: zone.color }}
            />
            {zone.label}
            <span className="block text-[10px] opacity-60 mt-0.5">{zone.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SeatMap;
