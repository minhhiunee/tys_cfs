'use client';

import { useEffect, useState } from 'react';

interface Flake {
  id: number;
  style: React.CSSProperties;
}

export function Snowfall() {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [flakes, setFlakes] = useState<Flake[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    // Generate snowflakes only on client to avoid hydration mismatch
    // 50 flakes is a good balance for performance and visuals
    const generatedFlakes = Array.from({ length: 50 }).map((_, i) => {
      // Create depth layers
      const isForeground = i < 5; // 10% foreground (large, slightly blurred)
      const isMidground = i >= 5 && i < 20; // 30% mid (medium)
      // The rest are background (small, slow)

      // Randomize properties
      const size = isForeground ? Math.random() * 5 + 5 : isMidground ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
      const opacity = isForeground ? Math.random() * 0.3 + 0.4 : isMidground ? Math.random() * 0.4 + 0.2 : Math.random() * 0.3 + 0.1;
      const fallDuration = isForeground ? Math.random() * 10 + 10 : isMidground ? Math.random() * 12 + 12 : Math.random() * 15 + 15;
      const driftDuration = Math.random() * 3 + 2;
      const left = Math.random() * 100;
      
      // Negative delay so some flakes are already falling when page loads
      const fallDelay = Math.random() * -20; 
      const driftDelay = Math.random() * -5;

      const filter = isForeground ? 'blur(1px)' : 'none';

      return {
        id: i,
        style: {
          '--fall-duration': `${fallDuration}s`,
          '--fall-delay': `${fallDelay}s`,
          '--drift-duration': `${driftDuration}s`,
          '--drift-delay': `${driftDelay}s`,
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          opacity,
          filter,
          boxShadow: isForeground ? '0 0 8px rgba(255, 255, 255, 0.8)' : 'none',
        } as React.CSSProperties
      };
    });

    setFlakes(generatedFlakes);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!mounted) return null;

  if (prefersReducedMotion) {
    return (
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px), radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '100px 100px, 150px 150px',
          backgroundPosition: '0 0, 50px 50px'
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {flakes.map(flake => (
        <div key={flake.id} className="snowflake" style={flake.style} />
      ))}
    </div>
  );
}
