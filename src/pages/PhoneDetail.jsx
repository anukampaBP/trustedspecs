// src/pages/PhoneDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ScoreRing from '../components/ScoreRing';
import AdSlot from '../components/AdSlot';

const QUALITY_DIMS = [
  { key: 'camera_day',   label: 'Daytime Camera', icon: '☀️' },
  { key: 'camera_night', label: 'Night Camera',   icon: '🌙' },
  { key: 'video',        label: 'Video',           icon: '🎬' },
  { key: 'gaming',       label: 'Gaming',          icon: '🎮' },
  { key: 'battery',      label: 'Battery Life',    icon: '🔋' },
  { key: 'speaker',      label: 'Speaker',         icon: '🔊' },
  { key: 'call',         label: 'Call Quality',    icon: '📞' },
  { key: 'software',     label: 'Software & UI',   icon: '🤖' },
];

const STORE_COLORS = {
  Amazon: '#FF9900', Flipkart: '#2874f0', Croma: '#9f1d35',
  'Tata Cliq': '#2b60de', 'Reliance Digital': '#11a12b', Manual: '#6d28d9',
};

function scoreColor(s) {
  if (s >= 8.5) return '#15803d';
  if (s >= 7)   return '#65a30d';
  if (s >= 5.5) return '#b45309';
  return '#dc2626';
}

export default function PhoneDetail({ onAddCompare, compareList }) {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const [phone,    setPhone]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [specTab,  setSpecTab] = useState(null);
  const [similar,  setSimilar] = useState([]);
  const [imgErr,   setImgErr]  = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setPhone(null);
    setImgErr(false);

    api.phone(slug)
      .then(data => {
        setPhone(data);
        const cats = Object.keys(data.specs || {});
        if (cats.length) setSpecTab(cats[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    api.similar(slug).then(setSimilar).catch(() => {});
  }, [slug]);

  if (loading) return <DetailSkeleton />;
  if (!phone)  return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '.75rem' }}>Phone not found</h2>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );

  const score  = parseFloat(phone.overall_score) || 0;
  const scores = phone.scores || {};
  const specs  = phone.specs  || {};
  const prices = phone.prices || [];
  const lowest = prices.length
    ? prices.reduce((a, b) => parseFloat(a.price_inr) < parseFloat(b.price_inr) ? a : b)
    : null;
  const inCompare = compareList?.some(p => p.slug === phone.slug);
  const img = phone.primary_image_url || phone.primary_image || '';

  return (
    <>
      {/* ── Phone hero ───────────────────────────────────────────────── */}
      <div className="detail-hero">
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 14 }}>
            <Link to="/">Home</Link> › {phone.brand} › {phone.name}
          </div>

          <div className="detail-grid">
            {/* Image */}
            <div className="detail-img-box">
              {img && !imgErr ? (
                <img src={img} alt={phone.name} onError={() => setImgErr(true)} />
              ) : (
                <div style={{ fontSize: 60, color: 'var(--cream3)' }}>📱</div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="detail-brand">{phone.brand}</div>
              <h1 className="detail-name">{phone.name}</h1>

              {phone.upgrade_tags && (
                <div className="detail-tags">
                  {phone.upgrade_tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="tag tag-purple">{t}</span>
                  ))}
                </div>
              )}

              <div className="detail-score-price">
                {score > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ScoreRing score={score} size="lg" />
                    <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      Overall Score
                    </div>
                  </div>
                )}
                {lowest ? (
                  <div>
                    <div className="detail-price-lbl">Starting from</div>
                    <div className="detail-price-val">
                      ₹{parseInt(lowest.price_inr).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>on {lowest.source}</div>
                  </div>
                ) : (phone.launch_price_inr || phone.launch_price) ? (
                  <div>
                    <div className="detail-price-lbl">Launch price</div>
                    <div className="detail-price-val">
                      ₹{parseInt(phone.launch_price_inr || phone.launch_price).toLocaleString('en-IN')}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="detail-actions">
                <button
                  className={`btn ${inCompare ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => onAddCompare?.(phone)}
                >
                  {inCompare ? '✓ In compare' : '+ Add to compare'}
                </button>
                {prices.length > 0 && (
                  <a href="#prices" className="btn btn-secondary">View prices ↓</a>
                )}
              </div>

              {phone.release_date && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink3)' }}>
                  Released {new Date(phone.release_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  {phone.discontinued || phone.is_discontinued ? ' · Discontinued' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail content ───────────────────────────────────────────── */}
      <div className="detail-content">
        <div className="detail-two-col">

          {/* Left */}
          <div>

            {/* Quality scores */}
            {Object.keys(scores).length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-header">
                  <span style={{ fontWeight: 700 }}>🎯 Quality Scores</span>
                  <span style={{ fontSize: 11, color: 'var(--ink3)' }}>From YouTube review research</span>
                </div>
                <div style={{ padding: '0 16px 8px' }}>
                  {QUALITY_DIMS.map(dim => {
                    const row = scores[dim.key];
                    if (!row) return null;
                    const s = parseFloat(row.specs) || 0;
                    const pct = (s / 10) * 100;
                    const col = scoreColor(s);
                    return (
                      <div key={dim.key} className="quality-row">
                        <div className="quality-label">{dim.icon} {dim.label}</div>
                        <div className="quality-track">
                          <div className="quality-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${col}66, ${col})` }} />
                        </div>
                        <div className="quality-score" style={{ color: col }}>{s.toFixed(1)}</div>
                      </div>
                    );
                  })}
                  {scores.overall?.reviewer_notes && (
                    <div style={{
                      margin: '10px 0 6px',
                      padding: '10px 12px',
                      background: 'var(--purple-pale)',
                      borderRadius: 'var(--r)',
                      borderLeft: '3px solid var(--purple)',
                      fontSize: 13, color: 'var(--ink2)',
                    }}>
                      <strong style={{ color: 'var(--purple)' }}>Notes: </strong>
                      {scores.overall.reviewer_notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            <AdSlot type="in-content" style={{ marginBottom: 14 }} />

            {/* Specs */}
            {Object.keys(specs).length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-header">
                  <span style={{ fontWeight: 700 }}>📋 Full Specifications</span>
                </div>
                <div style={{ padding: '12px 16px 0' }}>
                  <div className="spec-tab-list">
                    {Object.keys(specs).map(cat => (
                      <button
                        key={cat}
                        className={`spec-tab ${specTab === cat ? 'active' : ''}`}
                        onClick={() => setSpecTab(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {specTab && specs[specTab] && (
                  <div style={{ padding: '0 16px 12px' }}>
                    <table className="spec-table">
                      <tbody>
                        {specs[specTab].map((s, i) => (
                          <tr key={i}>
                            <th>{s.parameter}</th>
                            <td>
                              <strong>{s.answer}</strong>
                              {s.speculated ? <span className="spec-est">(est.)</span> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Prices */}
            {prices.length > 0 && (
              <div className="card" id="prices" style={{ marginBottom: 14 }}>
                <div className="card-header">
                  <span style={{ fontWeight: 700 }}>💰 Where to Buy</span>
                  <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Prices updated regularly</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div className="price-strip">
                    {prices.map((p, i) => (
                      <div key={i} className="price-card">
                        <div className="price-source" style={{ color: STORE_COLORS[p.source] || 'var(--ink)' }}>
                          {p.source}
                        </div>
                        <div className="price-amount">
                          ₹{parseInt(p.price_inr).toLocaleString('en-IN')}
                        </div>
                        {p.variant && <div className="price-variant">{p.variant}</div>}
                        <div style={{ marginBottom: 6 }}>
                          {p.in_stock
                            ? <span className="tag tag-green">In stock</span>
                            : <span className="tag" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>Out of stock</span>
                          }
                        </div>
                        <a
                          href={p.affiliate_url || `https://www.${p.source.toLowerCase().replace(/ /g,'')}.com/s?k=${encodeURIComponent(phone.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="price-buy-link"
                        >
                          Buy now ↗
                        </a>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 10 }}>
                    * Prices are indicative. Verify on the store before purchasing.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="detail-sticky">
            {score > 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '18px 16px', marginBottom: 12 }}>
                <ScoreRing score={score} size="lg" showLabel />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 3 }}>
                  {score >= 8.5 ? 'Excellent' : score >= 7 ? 'Very Good' : score >= 5.5 ? 'Good' : 'Average'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Overall Score</div>
                {scores.overall?.review_count > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>
                    Based on {scores.overall.review_count} reviews
                  </div>
                )}
              </div>
            )}

            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--cream3)', fontWeight: 700, fontSize: 13 }}>
                Quick Specs
              </div>
              <div style={{ padding: '8px 14px' }}>
                {phone.quick_specs?.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 8,
                    padding: '5px 0', fontSize: 12,
                    borderBottom: i < phone.quick_specs.length - 1 ? '1px solid var(--cream3)' : 'none',
                  }}>
                    <span style={{ color: 'var(--ink3)' }}>{s.label}</span>
                    <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{s.value}</span>
                  </div>
                ))}
                {!phone.quick_specs && (
                  <div style={{ color: 'var(--ink3)', fontSize: 12, padding: '4px 0' }}>
                    Check full specs below
                  </div>
                )}
              </div>
            </div>

            <AdSlot type="rectangle" />

            <div style={{
              marginTop: 12,
              background: 'var(--purple-pale)',
              border: '1.5px solid var(--purple-border)',
              borderRadius: 'var(--r-lg)',
              padding: '14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
                Compare with another phone
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                onClick={() => { onAddCompare?.(phone); navigate('/compare'); }}
              >
                + Add to Compare
              </button>
            </div>
          </div>

        </div>

        {/* Similar phones */}
        {similar.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">📱</span>
                Similar phones
              </h2>
            </div>
            <div className="phone-grid">
              {similar.slice(0, 4).map(p => (
                <div
                  key={p.id || p.slug}
                  className="phone-card"
                  onClick={() => navigate('/phones/' + p.slug)}
                >
                  <div className="phone-card-img">
                    {(p.primary_image_url || p.primary_image) ? (
                      <img src={p.primary_image_url || p.primary_image} alt={p.name} />
                    ) : (
                      <div className="phone-card-img-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>📱</div>
                    )}
                  </div>
                  <div className="phone-card-body">
                    <div className="phone-card-brand">{p.brand}</div>
                    <div className="phone-card-name">{p.name}</div>
                    {(p.launch_price_inr || p.launch_price) && (
                      <div className="phone-card-price">
                        ₹{parseInt(p.launch_price_inr || p.launch_price).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

function DetailSkeleton() {
  return (
    <div>
      <div className="detail-hero">
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div className="detail-grid">
            <div className="skeleton" style={{ height: 260, borderRadius: 'var(--r-xl)' }} />
            <div>
              <div className="skeleton" style={{ height: 12, width: '30%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 28, width: '70%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 80, width: 80, borderRadius: '50%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 38, width: 180, borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>
      <div className="detail-content">
        <div className="skeleton" style={{ height: 280, borderRadius: 'var(--r-xl)', marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--r-xl)' }} />
      </div>
    </div>
  );
}
