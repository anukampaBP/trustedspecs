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
  Amazon:            '#FF9900',
  Flipkart:          '#2874f0',
  Croma:             '#9f1d35',
  'Tata Cliq':       '#2b60de',
  'Reliance Digital':'#11a12b',
  Manual:            '#6d28d9',
};

const SPEC_CATEGORIES = [
  'Display', 'Back-Camera', 'Front-Camera', 'Battery',
  'Performance', 'Storage', 'Connectivity', 'Build', 'Software', 'Audio',
];

function scoreColor(s) {
  if (s >= 8) return '#16a34a';
  if (s >= 6.5) return '#65a30d';
  if (s >= 5)  return '#d97706';
  return '#dc2626';
}

function ScoreBar({ score }) {
  const pct  = (score / 10) * 100;
  const color = scoreColor(score);
  return (
    <div className="quality-bar-track">
      <div
        className="quality-bar-fill"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
      />
    </div>
  );
}

export default function PhoneDetail({ onAddCompare, compareList }) {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const [phone,    setPhone]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [specTab,  setSpecTab]  = useState(null);
  const [similar,  setSimilar]  = useState([]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setPhone(null);
    setImgError(false);
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
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
      <h2>Phone not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to home</Link>
    </div>
  );

  const overallScore = parseFloat(phone.overall_score) || 0;
  const scores = phone.scores || {};
  const specs  = phone.specs  || {};
  const prices = phone.prices || [];
  const lowestPrice = prices.length
    ? prices.reduce((a, b) => parseFloat(a.price_inr) < parseFloat(b.price_inr) ? a : b)
    : null;

  const inCompare = compareList?.some(p => p.slug === phone.slug);

  return (
    <>
      {/* ── Phone hero ───────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream-border)' }}>
        <div className="container" style={{ padding: '2rem 1.25rem' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginBottom: '1.5rem' }}>
            <Link to="/">Home</Link> › <Link to="/?brand={phone.brand}">{phone.brand}</Link> › {phone.name}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: '2.5rem',
            alignItems: 'start',
          }}>
            {/* Image */}
            <div style={{
              background: 'var(--cream)',
              borderRadius: 'var(--r-xl)',
              padding: '2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 280,
            }}>
              {phone.primary_image_url && !imgError ? (
                <img
                  src={phone.primary_image_url}
                  alt={phone.name}
                  style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>📱</div>
                  <div style={{ fontSize: '.8rem' }}>No image</div>
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div style={{
                fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em',
                textTransform: 'uppercase', color: 'var(--purple)', marginBottom: '.4rem'
              }}>
                {phone.brand}
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '2rem',
                fontWeight: 800, lineHeight: 1.2, marginBottom: '.75rem'
              }}>
                {phone.name}
              </h1>

              {/* Tags */}
              {phone.upgrade_tags && (
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {phone.upgrade_tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="feature-badge badge-purple">{tag}</span>
                  ))}
                </div>
              )}

              {/* Score + price row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ScoreRing score={overallScore} size={88} strokeWidth={7} />
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.35rem', fontWeight: 600 }}>
                    Overall Score
                  </div>
                </div>
                {lowestPrice && (
                  <div>
                    <div style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginBottom: '.2rem' }}>Starting from</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '1.75rem',
                      fontWeight: 700, color: 'var(--teal)'
                    }}>
                      ₹{parseInt(lowestPrice.price_inr).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                      on {lowestPrice.source}
                    </div>
                  </div>
                )}
                {!lowestPrice && phone.launch_price_inr && (
                  <div>
                    <div style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginBottom: '.2rem' }}>Launch price</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '1.75rem',
                      fontWeight: 700, color: 'var(--teal)'
                    }}>
                      ₹{parseInt(phone.launch_price_inr).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${inCompare ? 'btn-coral' : 'btn-primary'}`}
                  onClick={() => onAddCompare?.(phone)}
                >
                  {inCompare ? '✓ In Compare List' : '+ Add to Compare'}
                </button>
                {prices.length > 0 && (
                  <a href="#prices" className="btn btn-secondary">View Prices ↓</a>
                )}
              </div>

              {/* Release info */}
              {phone.release_date && (
                <div style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--ink-light)' }}>
                  Released {new Date(phone.release_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  {phone.discontinued ? ' · Discontinued' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left — main content */}
          <div>

            {/* ── Quality Scores ─────────────────────────────────────────────── */}
            {Object.keys(scores).length > 0 && (
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header">
                  <h2>🎯 Quality Scores</h2>
                  <span style={{ fontSize: '.78rem', color: 'var(--ink-light)' }}>
                    Based on YouTube review analysis
                  </span>
                </div>
                <div className="card-body">
                  {QUALITY_DIMS.map(dim => {
                    const row = scores[dim.key];
                    if (!row) return null;
                    const s = parseFloat(row.specs) || 0;
                    return (
                      <div key={dim.key} className="quality-bar-row">
                        <div className="quality-bar-label">{dim.icon} {dim.label}</div>
                        <ScoreBar score={s} />
                        <div className="quality-score-val" style={{ color: scoreColor(s) }}>
                          {s.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                  {scores.overall?.reviewer_notes && (
                    <div style={{
                      marginTop: '1rem', padding: '1rem',
                      background: 'var(--purple-pale)',
                      borderRadius: 'var(--r-md)',
                      fontSize: '.875rem', color: 'var(--ink-mid)',
                      borderLeft: '3px solid var(--purple)',
                    }}>
                      <strong style={{ color: 'var(--purple)' }}>Reviewer notes: </strong>
                      {scores.overall.reviewer_notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── AdSense in-content ──────────────────────────────────────────── */}
            <AdSlot type="in-content" />

            {/* ── Specs ─────────────────────────────────────────────────────── */}
            {Object.keys(specs).length > 0 && (
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header"><h2>📋 Full Specifications</h2></div>
                <div className="card-body" style={{ paddingTop: 0 }}>
                  {/* Spec category tabs */}
                  <div className="pill-tabs" style={{ paddingTop: '1.25rem', marginBottom: '1rem' }}>
                    {Object.keys(specs).map(cat => (
                      <button
                        key={cat}
                        className={`pill-tab ${specTab === cat ? 'active' : ''}`}
                        onClick={() => setSpecTab(cat)}
                        style={{ fontSize: '.78rem', padding: '.3rem .75rem' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {specTab && specs[specTab] && (
                    <table className="spec-table">
                      <tbody>
                        {specs[specTab].map((s, i) => (
                          <tr key={i}>
                            <th>{s.parameter}</th>
                            <td>
                              <strong>{s.answer}</strong>
                              {s.speculated ? <span className="spec-estimated">(est.)</span> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── Prices ────────────────────────────────────────────────────── */}
            {prices.length > 0 && (
              <div className="card" id="prices" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header">
                  <h2>💰 Where to Buy</h2>
                  <span style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                    Prices updated regularly
                  </span>
                </div>
                <div className="card-body">
                  <div className="price-strip">
                    {prices.map((p, i) => (
                      <div key={i} className="price-source-card">
                        <div className="price-source-name" style={{ color: STORE_COLORS[p.source] || 'var(--ink)' }}>
                          {p.source}
                        </div>
                        <div className="price-source-amount">
                          ₹{parseInt(p.price_inr).toLocaleString('en-IN')}
                        </div>
                        {p.variant && (
                          <div style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{p.variant}</div>
                        )}
                        <div>
                          {p.in_stock
                            ? <span className="feature-badge badge-green" style={{ fontSize: '.68rem' }}>In stock</span>
                            : <span className="feature-badge badge-red" style={{ fontSize: '.68rem' }}>Out of stock</span>
                          }
                        </div>
                        {/* Direct link — no affiliate tracking needed for now */}
                        {p.affiliate_url ? (
                          <a
                            href={p.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="price-source-link"
                          >
                            Buy now ↗
                          </a>
                        ) : (
                          <a
                            href={`https://www.${p.source.toLowerCase().replace(' ', '')}.com/s?k=${encodeURIComponent(phone.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="price-source-link"
                          >
                            Search on {p.source} ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '.72rem', color: 'var(--ink-faint)', marginTop: '1rem' }}>
                    * Prices are indicative. Click to verify current price on the store's website.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar */}
          <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 1rem)' }}>
            {/* Score summary card */}
            {overallScore > 0 && (
              <div className="card" style={{ marginBottom: '1rem', textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ marginBottom: '.75rem' }}>
                  <ScoreRing score={overallScore} size={96} strokeWidth={8} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>
                  Overall Score
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>
                  {overallScore >= 8 ? 'Excellent' : overallScore >= 6.5 ? 'Very Good' : overallScore >= 5 ? 'Good' : 'Average'}
                </div>
                {scores.overall?.review_count > 0 && (
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-faint)', marginTop: '.5rem' }}>
                    Based on {scores.overall.review_count} reviews
                  </div>
                )}
              </div>
            )}

            {/* Quick specs */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header"><h2 style={{ fontSize: '.9rem' }}>Quick Specs</h2></div>
              <div style={{ padding: '1rem' }}>
                {phone.quick_specs && phone.quick_specs.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', gap: '.5rem',
                    padding: '.45rem 0',
                    borderBottom: i < phone.quick_specs.length - 1 ? '1px solid var(--cream-border)' : 'none',
                    fontSize: '.82rem',
                  }}>
                    <span style={{ color: 'var(--ink-light)' }}>{s.label}</span>
                    <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar ad */}
            <AdSlot type="rectangle" />

            {/* Compare nudge */}
            <div style={{
              marginTop: '1rem',
              background: 'var(--purple-pale)',
              border: '1.5px solid var(--purple-border, #c4b5fd)',
              borderRadius: 'var(--r-lg)',
              padding: '1.25rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.5rem' }}>
                Compare with another phone
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  onAddCompare?.(phone);
                  navigate('/compare');
                }}
              >
                + Add to Compare
              </button>
            </div>
          </div>

        </div>

        {/* ── Similar phones ───────────────────────────────────────────────── */}
        {similar.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div className="section-eyebrow">You might also like</div>
            <h2 className="section-title">Similar Phones</h2>
            <div className="phone-grid">
              {similar.slice(0, 4).map(p => (
                <div
                  key={p.id || p.slug}
                  className="phone-card"
                  onClick={() => navigate('/phones/' + p.slug)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="phone-card-img-wrap" style={{ minHeight: 140 }}>
                    {p.primary_image_url ? (
                      <img src={p.primary_image_url} alt={p.name} className="phone-card-img" />
                    ) : (
                      <div style={{ color: 'var(--ink-faint)', fontSize: '.75rem' }}>No image</div>
                    )}
                    {p.overall_score > 0 && (
                      <div className="phone-card-score-badge">
                        <ScoreRing score={parseFloat(p.overall_score)} size={44} strokeWidth={4} animated={false} />
                      </div>
                    )}
                  </div>
                  <div className="phone-card-body">
                    <div className="phone-card-brand">{p.brand}</div>
                    <div className="phone-card-name">{p.name}</div>
                    {p.launch_price_inr && (
                      <div className="phone-card-price">₹{parseInt(p.launch_price_inr).toLocaleString('en-IN')}</div>
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

function DetailSkeleton() {
  return (
    <div>
      <div style={{ background: 'var(--white)', padding: '2rem 0', borderBottom: '1px solid var(--cream-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem' }}>
            <div className="skeleton" style={{ height: 280, borderRadius: 'var(--r-xl)' }} />
            <div>
              <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 32, width: '70%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 80, width: 80, borderRadius: '50%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 44, width: 200, borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: '2rem 1.25rem' }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-xl)', marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--r-xl)' }} />
      </div>
    </div>
  );
}
