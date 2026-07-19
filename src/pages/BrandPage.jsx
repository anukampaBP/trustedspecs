// src/pages/BrandPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import PhoneCard, { PhoneCardSkeleton } from '../components/PhoneCard';

const BRAND_META = {
  Samsung:  { bg: '#1428A0', init: 'Sa', desc: 'South Korean electronics giant. Known for Galaxy S, A and M series.' },
  Xiaomi:   { bg: '#FF6900', init: 'Mi', desc: 'Chinese brand offering flagship specs at mid-range prices.' },
  OnePlus:  { bg: '#F5010C', init: '1+', desc: 'Speed-focused flagship phones with clean OxygenOS.' },
  Realme:   { bg: '#c8a000', init: 'Re', desc: 'Budget-friendly phones for young buyers.' },
  Vivo:     { bg: '#415FFF', init: 'Vi', desc: 'Camera-focused phones with stylish designs.' },
  Apple:    { bg: '#555555', init: '🍎', desc: 'Premium smartphones with the A-series chip and iOS.' },
  Google:   { bg: '#4285F4', init: 'G',  desc: 'Pure Android experience with the best camera algorithms.' },
  Nothing:  { bg: '#0f0e0c', init: 'Nt', desc: 'Transparent design and a clean stock Android experience.' },
  iQOO:     { bg: '#7B2FBE', init: 'iQ', desc: 'Gaming-focused sub-brand of Vivo.' },
  OPPO:     { bg: '#1D8348', init: 'Op', desc: 'Camera innovation and fast charging technology.' },
  Motorola: { bg: '#E1000F', init: 'Mo', desc: 'Reliable phones with near-stock Android experience.' },
};

export default function BrandPage({ compareList, onAddCompare }) {
  const { brand }  = useParams();
  const [phones,   setPhones]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const meta = BRAND_META[brand] || { bg: 'var(--purple)', init: brand?.[0] || 'B', desc: `All ${brand} phones on TrustedSpecs.` };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.phones({ brand, status: 1, sort: 'score', limit: 50 })
      .then(d => setPhones(Array.isArray(d) ? d : (d.phones || [])))
      .catch(() => setPhones([]))
      .finally(() => setLoading(false));
  }, [brand]);

  return (
    <div>
      {/* Brand header */}
      <div style={{ background: meta.bg, padding: '28px var(--pad)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,.5)' }}>Home</Link> › <Link to="/phones" style={{ color: 'rgba(255,255,255,.5)' }}>Phones</Link> › {brand}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {meta.init}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                {brand} Phones
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', maxWidth: 500 }}>
                {meta.desc}
              </p>
            </div>
          </div>
          {!loading && (
            <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
              {phones.length} phones in our database
            </div>
          )}
        </div>
      </div>

      {/* Phones */}
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '20px var(--pad) 40px' }}>
        {phones.length > 1 && (
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
              Top picks from {brand}
            </h2>
          </div>
        )}
        <div className="phone-grid">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <PhoneCardSkeleton key={i} />)
            : phones.length > 0
              ? phones.map(p => (
                  <PhoneCard key={p.id || p.slug} phone={p}
                    onAddCompare={onAddCompare}
                    inCompare={compareList.some(c => c.slug === p.slug)} />
                ))
              : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--ink3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📱</div>
                  <div style={{ fontWeight: 600 }}>No {brand} phones yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Check back soon</div>
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
}
