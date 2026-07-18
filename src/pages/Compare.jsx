// src/pages/Compare.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const SPEC_SECTIONS = ['Display', 'Back-Camera', 'Battery', 'Performance', 'Storage', 'Connectivity', 'Build'];

const STORE_COLORS = {
  Amazon: '#FF9900', Flipkart: '#2874f0', Croma: '#9f1d35',
};

function scoreColor(s) {
  if (s >= 8) return '#16a34a';
  if (s >= 6.5) return '#65a30d';
  if (s >= 5)  return '#d97706';
  return '#dc2626';
}

export default function Compare({ compareList, onRemoveCompare, onAddCompare }) {
  const [phones,   setPhones]   = useState([]);
  const [search,   setSearch]   = useState(['', '', '']);
  const [results,  setResults]  = useState([[], [], []]);
  const [loading,  setLoading]  = useState(false);
  const [data,     setData]     = useState(null);
  const [activeSpec, setActiveSpec] = useState(SPEC_SECTIONS[0]);
  const navigate = useNavigate();

  // Sync from global compare list
  useEffect(() => {
    setPhones(compareList.slice(0, 3));
  }, [compareList]);

  // Load compare data when phones change
  useEffect(() => {
    const slugs = phones.map(p => p.slug).filter(Boolean);
    if (slugs.length < 2) { setData(null); return; }
    setLoading(true);
    api.compare(slugs)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [phones]);

  async function handleSearch(idx, q) {
    const updated = [...search]; updated[idx] = q;
    setSearch(updated);
    if (q.trim().length < 2) {
      const r = [...results]; r[idx] = []; setResults(r);
      return;
    }
    try {
      const res = await api.search(q);
      const r = [...results];
      r[idx] = Array.isArray(res) ? res : (res.phones || []);
      setResults(r);
    } catch {}
  }

  function selectPhone(idx, phone) {
    const updated = [...phones];
    updated[idx] = phone;
    setPhones(updated.filter(Boolean));
    onAddCompare?.(phone);
    const s = [...search]; s[idx] = '';
    setSearch(s);
    const r = [...results]; r[idx] = [];
    setResults(r);
  }

  function removePhone(idx) {
    const p = phones[idx];
    if (p) onRemoveCompare?.(p);
    const updated = [...phones];
    updated.splice(idx, 1);
    setPhones(updated);
  }

  // Find winner for a numeric value (higher is better)
  function isWinner(vals, idx) {
    const nums = vals.map(v => parseFloat(String(v).replace(/[^\d.]/g, '')) || 0);
    const max  = Math.max(...nums);
    return max > 0 && nums[idx] === max;
  }

  const slots = [0, 1, 2];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream-border)', padding: '2rem 0 1.5rem' }}>
        <div className="container">
          <div className="section-eyebrow">Side-by-side</div>
          <h1 className="section-title">Compare Phones</h1>
          <p className="section-sub">Pick up to 3 phones to compare specs, quality scores and prices.</p>

          {/* Phone selector slots */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            {slots.map(idx => {
              const phone = phones[idx];
              return (
                <div key={idx}>
                  {phone ? (
                    /* Filled slot */
                    <div className="card" style={{ padding: '1.25rem', textAlign: 'center', position: 'relative' }}>
                      <button
                        onClick={() => removePhone(idx)}
                        style={{
                          position: 'absolute', top: '.65rem', right: '.65rem',
                          background: 'var(--cream)', border: 'none', borderRadius: '50%',
                          width: 24, height: 24, cursor: 'pointer',
                          fontSize: '.75rem', color: 'var(--ink-mid)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                      {phone.primary_image_url && (
                        <img
                          src={phone.primary_image_url}
                          alt={phone.name}
                          style={{ height: 80, objectFit: 'contain', margin: '0 auto .75rem' }}
                        />
                      )}
                      <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{phone.name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>{phone.brand}</div>
                      {phone.overall_score > 0 && (
                        <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'center' }}>
                          <ScoreRing score={parseFloat(phone.overall_score)} size={52} strokeWidth={5} animated={false} />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Empty slot */
                    <div style={{ position: 'relative' }}>
                      <div className="card" style={{
                        padding: '1.5rem',
                        border: '2px dashed var(--cream-border)',
                        background: 'var(--cream)',
                        textAlign: 'center',
                        minHeight: 180,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '.75rem',
                      }}>
                        <div style={{ fontSize: '1.5rem' }}>📱</div>
                        <input
                          type="text"
                          placeholder={`Phone ${idx + 1} — search by name`}
                          value={search[idx]}
                          onChange={e => handleSearch(idx, e.target.value)}
                          style={{
                            width: '100%', padding: '.5rem .85rem',
                            borderRadius: 'var(--r-full)',
                            border: '1.5px solid var(--cream-border)',
                            background: 'var(--white)',
                            fontSize: '.85rem',
                          }}
                        />
                      </div>
                      {results[idx].length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'var(--white)',
                          border: '1px solid var(--cream-border)',
                          borderRadius: 'var(--r-lg)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 50, maxHeight: 280, overflowY: 'auto',
                        }}>
                          {results[idx].map(p => (
                            <div
                              key={p.id}
                              onClick={() => selectPhone(idx, p)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '.75rem',
                                padding: '.65rem 1rem', cursor: 'pointer',
                                borderBottom: '1px solid var(--cream-border)',
                                transition: 'background .1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-pale)'}
                              onMouseLeave={e => e.currentTarget.style.background = ''}
                            >
                              {p.image && <img src={p.image} alt={p.name} style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{p.name}</div>
                                <div style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{p.brand}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {phones.length < 2 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '.5rem' }}>
            Add at least 2 phones to start comparing
          </div>
          <div style={{ fontSize: '.875rem', marginBottom: '1.5rem' }}>
            Search for phones above or browse from the home page
          </div>
          <Link to="/" className="btn btn-primary">Browse phones →</Link>
        </div>
      )}

      {phones.length >= 2 && (
        <div className="container" style={{ padding: '2rem 1.25rem' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)' }}>
              Loading comparison…
            </div>
          )}

          {!loading && data && (
            <>
              {/* ── Quality Scores comparison ─────────────────────────────── */}
              <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--purple)', color: '#fff',
                  padding: '.65rem 1.25rem',
                  fontSize: '.78rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  🎯 Quality Scores
                </div>

                {/* Header row with phone names */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `200px repeat(${phones.length}, 1fr)`,
                  borderBottom: '1px solid var(--cream-border)',
                }}>
                  <div style={{ padding: '.75rem 1rem', background: 'var(--cream)' }} />
                  {phones.map((p, i) => (
                    <div key={i} style={{
                      padding: '.75rem 1rem',
                      fontWeight: 700, fontSize: '.875rem',
                      borderLeft: '1px solid var(--cream-border)',
                      textAlign: 'center',
                    }}>
                      {p.name}
                    </div>
                  ))}
                </div>

                {/* Overall row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `200px repeat(${phones.length}, 1fr)`,
                  borderBottom: '2px solid var(--purple)',
                  background: 'var(--purple-pale)',
                }}>
                  <div style={{ padding: '1rem', fontWeight: 700, fontSize: '.875rem' }}>
                    ⭐ Overall Score
                  </div>
                  {phones.map((p, i) => {
                    const score = parseFloat(p.overall_score) || 0;
                    const win = isWinner(phones.map(ph => ph.overall_score || 0), i);
                    return (
                      <div key={i} style={{
                        padding: '1rem',
                        textAlign: 'center',
                        borderLeft: '1px solid var(--cream-border)',
                        background: win ? 'var(--purple-dim)' : '',
                      }}>
                        <ScoreRing score={score} size={52} strokeWidth={5} animated={false} />
                        {win && <div style={{ fontSize: '.65rem', color: 'var(--purple)', fontWeight: 700, marginTop: '.25rem' }}>WINNER</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Dimension rows */}
                {QUALITY_DIMS.map(dim => {
                  const vals = phones.map(p => {
                    const scoreData = data.phones?.find(ph => ph.slug === p.slug)?.scores?.[dim.key];
                    return scoreData ? parseFloat(scoreData.specs) : 0;
                  });
                  return (
                    <div key={dim.key} style={{
                      display: 'grid',
                      gridTemplateColumns: `200px repeat(${phones.length}, 1fr)`,
                      borderBottom: '1px solid var(--cream-border)',
                    }}>
                      <div style={{
                        padding: '.65rem 1rem',
                        fontSize: '.82rem', fontWeight: 600,
                        background: 'var(--cream)',
                        display: 'flex', alignItems: 'center', gap: '.4rem',
                      }}>
                        {dim.icon} {dim.label}
                      </div>
                      {vals.map((v, i) => {
                        const win = isWinner(vals, i);
                        return (
                          <div key={i} style={{
                            padding: '.65rem 1rem',
                            textAlign: 'center',
                            borderLeft: '1px solid var(--cream-border)',
                            background: win ? '#f0fdf4' : '',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: v > 0 ? scoreColor(v) : 'var(--ink-faint)',
                          }}>
                            {v > 0 ? v.toFixed(1) : '—'}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* ── AdSense ───────────────────────────────────────────────── */}
              <AdSlot type="in-content" />

              {/* ── Prices comparison ────────────────────────────────────── */}
              <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--teal)', color: '#fff',
                  padding: '.65rem 1.25rem',
                  fontSize: '.78rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  💰 Prices & Where to Buy
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `200px repeat(${phones.length}, 1fr)`,
                }}>
                  <div style={{ padding: '.75rem 1rem', background: 'var(--cream)' }} />
                  {phones.map((p, i) => {
                    const phoneData = data.phones?.find(ph => ph.slug === p.slug);
                    const prices = phoneData?.prices || [];
                    const lowest = prices.length
                      ? prices.reduce((a, b) => parseFloat(a.price_inr) < parseFloat(b.price_inr) ? a : b)
                      : null;
                    const launchPrice = p.launch_price_inr;
                    return (
                      <div key={i} style={{
                        padding: '1rem',
                        borderLeft: '1px solid var(--cream-border)',
                        borderBottom: '1px solid var(--cream-border)',
                      }}>
                        {lowest ? (
                          <>
                            <div style={{
                              fontFamily: 'var(--font-mono)', fontSize: '1.1rem',
                              fontWeight: 700, color: 'var(--teal)', marginBottom: '.25rem'
                            }}>
                              ₹{parseInt(lowest.price_inr).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginBottom: '.5rem' }}>
                              on {lowest.source}
                            </div>
                            {lowest.affiliate_url ? (
                              <a href={lowest.affiliate_url} target="_blank" rel="noopener noreferrer"
                                 className="btn btn-teal btn-sm" style={{ textDecoration: 'none' }}>
                                Buy ↗
                              </a>
                            ) : (
                              <a
                                href={`https://www.${lowest.source.toLowerCase().replace(/ /g,'')}.com/s?k=${encodeURIComponent(p.name)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                              >
                                Search ↗
                              </a>
                            )}
                          </>
                        ) : launchPrice ? (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--ink-light)' }}>
                            ₹{parseInt(launchPrice).toLocaleString('en-IN')}
                            <div style={{ fontSize: '.7rem', color: 'var(--ink-faint)' }}>launch price</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ink-faint)', fontSize: '.8rem' }}>—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Specs comparison ─────────────────────────────────────── */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--ink)', color: '#fff',
                  padding: '.65rem 1.25rem',
                  fontSize: '.78rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  📋 Full Specifications
                </div>

                {/* Section tabs */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--cream-border)' }}>
                  <div className="pill-tabs" style={{ marginBottom: 0 }}>
                    {SPEC_SECTIONS.map(s => (
                      <button
                        key={s}
                        className={`pill-tab ${activeSpec === s ? 'active' : ''}`}
                        onClick={() => setActiveSpec(s)}
                        style={{ fontSize: '.78rem' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spec rows */}
                {(() => {
                  // Gather all param names in this section across all phones
                  const paramSet = new Set();
                  phones.forEach(phone => {
                    const phoneData = data.phones?.find(ph => ph.slug === phone.slug);
                    const sectionSpecs = phoneData?.specs?.[activeSpec] || [];
                    sectionSpecs.forEach(s => paramSet.add(s.parameter));
                  });
                  const params = Array.from(paramSet);

                  if (!params.length) return (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-light)' }}>
                      No spec data for this section
                    </div>
                  );

                  return params.map(param => (
                    <div key={param} style={{
                      display: 'grid',
                      gridTemplateColumns: `200px repeat(${phones.length}, 1fr)`,
                      borderBottom: '1px solid var(--cream-border)',
                    }}>
                      <div style={{
                        padding: '.6rem 1rem',
                        fontSize: '.75rem', fontWeight: 700,
                        color: 'var(--ink-light)',
                        background: 'var(--cream)',
                        display: 'flex', alignItems: 'center',
                      }}>
                        {param}
                      </div>
                      {phones.map((phone, i) => {
                        const phoneData = data.phones?.find(ph => ph.slug === phone.slug);
                        const spec = (phoneData?.specs?.[activeSpec] || []).find(s => s.parameter === param);
                        return (
                          <div key={i} style={{
                            padding: '.6rem 1rem',
                            fontSize: '.85rem',
                            borderLeft: '1px solid var(--cream-border)',
                            color: spec ? 'var(--ink)' : 'var(--ink-faint)',
                          }}>
                            {spec ? spec.answer : '—'}
                            {spec?.speculated && <span className="spec-estimated">est.</span>}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
