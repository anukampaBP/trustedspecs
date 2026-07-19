// src/components/AdSlot.jsx
import { useEffect, useRef } from 'react';

const PUBLISHER = 'ca-pub-XXXXXXXXXXXXXXXX'; // replace with yours
const SLOTS = {
  leaderboard:  'XXXXXXXXXX',
  rectangle:    'XXXXXXXXXX',
  'in-content': 'XXXXXXXXXX',
};

export default function AdSlot({ type = 'rectangle', style = {} }) {
  const ref  = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || PUBLISHER.includes('XXXX')) return;
    try {
      if (typeof window.adsbygoogle !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        done.current = true;
      }
    } catch {}
  }, []);

  const heights = { leaderboard: 90, rectangle: 250, 'in-content': 280 };
  const h = heights[type] || 90;

  if (PUBLISHER.includes('XXXX')) {
    return (
      <div className="ad-slot" style={{ minHeight: h, ...style }}>
        Advertisement
      </div>
    );
  }

  return (
    <div ref={ref} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: h }}
        data-ad-client={PUBLISHER}
        data-ad-slot={SLOTS[type]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
