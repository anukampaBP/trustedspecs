// src/components/ScoreRing.jsx
import { useEffect, useRef, useState } from 'react';

function scoreColor(s) {
  if (s >= 8.5) return '#15803d';
  if (s >= 7)   return '#65a30d';
  if (s >= 5.5) return '#b45309';
  return '#dc2626';
}

/**
 * ScoreRing — animated SVG ring
 * size: 'sm' (42px card chip) | 'md' (52px searched list) | 'lg' (80px detail) | number
 */
export default function ScoreRing({ score = 0, size = 'md', animated = true, showLabel = false }) {
  const sizes = { sm: 42, md: 52, lg: 80 };
  const sw    = { sm: 4,  md: 5,  lg: 7  };
  const fs    = { sm: 11, md: 13, lg: 20 };

  const px  = typeof size === 'number' ? size : (sizes[size] || 52);
  const str = typeof size === 'number' ? 5 : (sw[size] || 5);
  const fnt = typeof size === 'number' ? Math.round(px * 0.24) : (fs[size] || 13);

  const [displayed, setDisplayed] = useState(animated ? 0 : score);
  const animated_ref = useRef(false);
  const ref = useRef(null);

  const r    = (px - str) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (displayed / 10) * circ;
  const col  = scoreColor(score);

  useEffect(() => {
    if (!animated || animated_ref.current || score === 0) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated_ref.current) {
        animated_ref.current = true;
        let start = null;
        const dur = 800;
        const step = (ts) => {
          if (!start) start = ts;
          const t = Math.min((ts - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setDisplayed(parseFloat((score * ease).toFixed(1)));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [score, animated]);

  return (
    <div ref={ref} className="score-ring-wrap" style={{ width: px, height: px }}>
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
        <circle className="score-ring-bg" cx={px/2} cy={px/2} r={r} strokeWidth={str} />
        <circle
          className="score-ring-fill"
          cx={px/2} cy={px/2} r={r}
          strokeWidth={str}
          stroke={col}
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <div className="score-ring-num" style={{ fontSize: fnt, color: col }}>
        {score > 0 ? displayed.toFixed(1) : '—'}
      </div>
      {showLabel && (
        <div style={{
          position: 'absolute', bottom: -16,
          fontSize: 9, fontWeight: 600, color: 'var(--ink3)',
          textTransform: 'uppercase', letterSpacing: '.06em',
          whiteSpace: 'nowrap', left: '50%', transform: 'translateX(-50%)'
        }}>Score</div>
      )}
    </div>
  );
}

/** Compact chip — white bg pill used on phone cards */
export function ScoreChip({ score }) {
  return (
    <div className="score-chip">
      <ScoreRing score={score} size="sm" animated={false} />
    </div>
  );
}
