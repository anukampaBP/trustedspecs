// src/components/ScoreRing.jsx
import { useEffect, useRef, useState } from 'react';

function scoreColor(score) {
  if (score >= 8) return '#16a34a';
  if (score >= 6.5) return '#65a30d';
  if (score >= 5) return '#d97706';
  return '#dc2626';
}

export default function ScoreRing({ score = 0, size = 72, strokeWidth = 6, label = 'Score', animated = true }) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score);
  const hasAnimated = useRef(false);
  const ref = useRef(null);

  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (displayed / 10) * circumference;
  const color       = scoreColor(score);
  const fontSize    = size < 60 ? size * 0.22 : size * 0.24;

  useEffect(() => {
    if (!animated || hasAnimated.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        // Animate from 0 to score
        let start = null;
        const duration = 900;
        const step = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setDisplayed(parseFloat((score * ease).toFixed(1)));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [score, animated]);

  return (
    <div ref={ref} className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg
        className="score-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-text" style={{ fontSize, color }}>
        {score > 0 ? displayed.toFixed(1) : '—'}
      </div>
    </div>
  );
}

// Mini badge version for phone cards
export function ScoreBadge({ score, size = 'md' }) {
  const sizes = { sm: 48, md: 60, lg: 80 };
  const px = sizes[size] || sizes.md;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <ScoreRing score={score} size={px} strokeWidth={5} />
      <div className="score-ring-label">Score</div>
    </div>
  );
}
