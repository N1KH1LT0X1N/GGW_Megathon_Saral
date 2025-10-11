import React, { useEffect, useRef } from 'react';

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

export default function GlowCard({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = true // default to true so existing card classes control sizing
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    // Track pointer relative to the card element so the spotlight maps correctly
    const el = cardRef.current;
    if (!el) return;

    const rect = () => el.getBoundingClientRect();

    const onPointerMove = (e) => {
      const r = rect();
      const x = e.clientX - r.left; // x relative to element
      const y = e.clientY - r.top; // y relative to element
      const xp = r.width > 0 ? (x / r.width) : 0;
      const yp = r.height > 0 ? (y / r.height) : 0;
      el.style.setProperty('--x', `${x.toFixed(2)}`);
      el.style.setProperty('--xp', `${xp.toFixed(3)}`);
      el.style.setProperty('--y', `${y.toFixed(2)}`);
      el.style.setProperty('--yp', `${yp.toFixed(3)}`);
    };

    const onPointerLeave = () => {
      // move spotlight off-center smoothly
      const r = rect();
      el.style.setProperty('--x', `${r.width / 2}`);
      el.style.setProperty('--y', `${r.height / 2}`);
      el.style.setProperty('--xp', '0.5');
      el.style.setProperty('--yp', '0.5');
    };

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    // initialize center
    onPointerLeave();

    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  const { base = 220, spread = 200 } = glowColorMap[glowColor] || glowColorMap.blue;

  const getInlineStyles = () => {
    const baseStyles = {
      // lock base hue near blue and reduce spread so hue doesn't shift into pink/purple
      '--base': 210,
      '--spread': 40,
      '--radius': '14',
      '--border': '3',
      '--backdrop': 'hsl(0 0% 60% / 0.12)',
      '--backup-border': 'var(--backdrop)',
      '--size': '200',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.12)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'cover',
      backgroundPosition: '0 0',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: 'none'
    };
    if (width !== undefined) baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    return baseStyles;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      /* pseudo-element backgrounds should be element-relative, not fixed to viewport */
      background-attachment: scroll;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    [data-glow]::before {
  background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }
    [data-glow] > [data-glow]::before { inset: -10px; border-width: 10px; }
  `;

  const sizeClasses = customSize ? '' : sizeMap[size] || sizeMap.md;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`relative ${sizeClasses} ${className}`}
      >
      <div
        data-glow
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: 'calc(var(--radius) * 1px)',
          backgroundImage: `radial-gradient(circle at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px), rgba(96,165,250,0.08), transparent 40%)`,
          mixBlendMode: 'screen',
          opacity: 'var(--outer, 1)',
          zIndex: 0
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    </>
  );
}

export { GlowCard };
