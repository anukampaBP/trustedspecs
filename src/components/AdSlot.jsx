// src/components/AdSlot.jsx
import { useEffect, useRef } from 'react';

// Replace these with your actual AdSense slot IDs once approved
const AD_SLOTS = {
  leaderboard:  'XXXXXXXXXX', // 728x90
  rectangle:    'XXXXXXXXXX', // 300x250
  'in-content': 'XXXXXXXXXX', // responsive in-article
};

const AD_PUBLISHER = 'ca-pub-XXXXXXXXXXXXXXXX'; // replace with your publisher ID

export default function AdSlot({ type = 'rectangle', className = '' }) {
  const ref  = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !ref.current) return;
    // Only push when AdSense script is loaded
    if (typeof window.adsbygoogle !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        done.current = true;
      } catch (e) {}
    }
  }, []);

  const heights = { leaderboard: 90, rectangle: 250, 'in-content': 280 };
  const h = heights[type] || 250;

  // Show placeholder when publisher ID is not set
  const isPlaceholder = AD_PUBLISHER.includes('XXXX');

  if (isPlaceholder) {
    return (
      <div className={`ad-slot ad-slot-${type} ${className}`} style={{ minHeight: h }}>
        Advertisement
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: h }}
        data-ad-client={AD_PUBLISHER}
        data-ad-slot={AD_SLOTS[type]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
