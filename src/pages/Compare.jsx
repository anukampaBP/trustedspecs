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

function scoreColor(s) {
  if (s >= 8.5) return '#15803d';
  if (s >= 7)   return '#65a30d';
  if (s >= 5.5) return '#b45309';
  return '#dc2626';
}

function isWinner(vals, idx) {
  const nums = vals.map(v => parseFloat(String(v).replace(/[^\d.]/g, '')) || 0);
  const max  = Math.max(...nums);
  return max > 0 && nums[idx] === max;
}

export default function Compare({ compareList, onAddCompare, onRemove }) {
  const [phones,   setPhones]   = useState(compareList.slice(0, 3));
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [searches, setSearches] = useState(['', '', '']);
  const [results,  setResults]  = useState([[], [], []]);
  const [specSec,  setSpecSec]  = useState(SPEC_SECTIONS[0]);
  const navigate = useNavigate();

  // Sync from compare list
  useEffect(() => { setPhones(compareList.slice(0, 3)); }, [compareList]);

  // Fetch compare data
  useEffect(() => {
    const slugs = phones.map(p => p.slug).filter(Boolean);
    if (slugs.length < 2) { setData(null); return; }
    setLoading(true);
    api.compare(slugs)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [phones]);

  async function handleSearch(idx, q) {
    const upd = [...searches]; upd[idx] = q; setSearches(upd);
    if (q.trim().length < 2) {
      const r = [...results]; r[idx] = []; setResults(r); return;
    }
    try {
      const res = await api.search(q);
      const r = [...results];
      r[idx] = Array.isArray(res) ? res : (res.phones || []);
      setResults(r);
    } catch {}
  }

  function selectPhone(idx, phone) {
    onAddCompare?.(phone);
    const s = [...searches]; s[idx] = ''; setSearches(s);
    const r = [...results];  r[idx] = []; setResults(r);
  }

  function removeSlot(idx) {
    const p = phones[idx];
    if (p) onRemove?.(p);
  }

  const colCount = Math.max(phones.length, 1);

  return (
    <div>
      {/* ── Slot header ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '18px var(--pad)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 3 }}>
              Compare Phones
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink3)' }}>
              Add up to 3 phones to compare specs, scores, and prices side by side.
            </div>
          </div>

          <div className="compare-slot-grid">
            {[0, 1, 2].map(idx => {
              const phone = phones[idx];
              return phone ? (
                <div key={idx} className="compare-slot-filled">
                  <button className="compare-remove" onClick={() => removeSlot(idx)}>✕</button>
                  {(phone.primary_image_url || phone.primary_image) && (
                    <img
                      src={phone.primary_image_url || phone.primary_image}
                      alt={phone.name}
                      style={{ height: 70, objectFit: 'contain', margin: '0 auto 8px' }}
                    />
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{phone.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>{phone.brand}</div>
                  {phone.overall_score > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ScoreRing score={parseFloat(phone.overall_score)} size="md" animated={false} />
                    </div>
                  )}
                </div>
              ) : (
                <div key={idx} className="compare-slot-empty" style={{ position: 'relative' }}>
                  <div style={{ fontSize: 28, color: 'var(--cream3)' }}>📱</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Phone {idx + 1}</div>
                  <input
                    type="text"
                    placeholder="Search to add…"
                    value={searches[idx]}
                    onChange={e => handleSearch(idx, e.target.value)}
                  />
                  {results[idx].length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--white)', border: '1px solid var(--cream3)',
                      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)',
                      zIndex: 50, maxHeight: 260, overflowY: 'auto',
                    }}>
                      {results[idx].map(p => (
                        <div
                          key={p.id}
                          onClick={() => selectPhone(idx, p)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', cursor: 'pointer',
                            borderBottom: '1px solid var(--cream3)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-pale)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {(p.primary_image_url || p.image) && (
                            <img src={p.primary_image_url || p.image} alt={p.name}
                              style={{ width: 32, height: 32, objectFit: 'contain' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{p.brand}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {phones.length < 2 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            Add at least 2 phones to start comparing
          </div>
          <div style={{ fontSize: 13, marginBottom: 18 }}>
            Search in the boxes above, or browse phones from the home page
          </div>
          <Link to="/" className="btn btn-primary">Browse phones →</Link>
        </div>
      )}

      {/* Comparison tables */}
      {phones.length >= 2 && (
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '20px var(--pad) 40px' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink3)' }}>
              Loading comparison data…
            </div>
          )}

          {!loading && data && (
            <>
              {/* Quality scores */}
              <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                <div className="compare-section-header">🎯 Quality Scores</div>

                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: `160px repeat(${colCount}, 1fr)`, borderBottom: '1px solid var(--cream3)' }}>
                  <div className="compare-label-cell" style={{ borderBottom: 'none' }} />
                  {phones.map((p, i) => (
                    <div key={i} style={{
                      padding: '10px 13px', fontWeight: 700, fontSize: 13,
                      borderLeft: '1px solid var(--cream3)', textAlign: 'center',
                    }}>
                      {p.name}
                    </div>
                  ))}
                </div>

                {/* Overall */}
                <div style={{
                  display: 'grid', gridTemplateColumns: `160px repeat(${colCount}, 1fr)`,
                  background: 'var(--purple-pale)', borderBottom: '2px solid var(--purple-border)',
                }}>
                  <div className="compare-label-cell" style={{ borderBottom: 'none', display: 'flex', alignItems: 'center' }}>
                    ⭐ Overall
                  </div>
                  {phones.map((p, i) => {
                    const s = parseFloat(p.overall_score) || 0;
                    const win = isWinner(phones.map(ph => ph.overall_score || 0), i);
                    return (
                      <div key={i} style={{
                        padding: '10px', textAlign: 'center',
                        borderLeft: '1px solid var(--cream3)',
                        background: win ? 'rgba(109,40,217,.06)' : '',
                      }}>
                        <ScoreRing score={s} size="md" animated={false} />
                        {win && <div style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 700, marginTop: 3 }}>WINNER</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Dimension rows */}
                {QUALITY_DIMS.map(dim => {
                  const vals = phones.map(p => {
                    const pd = data.phones?.find(ph => ph.slug === p.slug);
                    return pd?.scores?.[dim.key] ? parseFloat(pd.scores[dim.key].specs) : 0;
                  });
                  return (
                    <div key={dim.key} style={{ display: 'grid', gridTemplateColumns: `160px repeat(${colCount}, 1fr)`, borderBottom: '1px solid var(--cream3)' }}>
                      <div className="compare-label-cell" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {dim.icon} {dim.label}
                      </div>
                      {vals.map((v, i) => {
                        const win = isWinner(vals, i);
                        return (
                          <div key={i} className={`compare-value-cell ${win ? 'compare-winner' : ''}`}
                            style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: v > 0 ? scoreColor(v) : 'var(--ink3)' }}>
                            {v > 0 ? v.toFixed(1) : '—'}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <AdSlot type="in-content" style={{ marginBottom: 16 }} />

              {/* Prices */}
              <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                <div className="compare-section-header" style={{ background: 'var(--green)' }}>💰 Prices & Where to Buy</div>
                <div style={{ display: 'grid', gridTemplateColumns: `160px repeat(${colCount}, 1fr)` }}>
                  <div className="compare-label-cell">Source</div>
                  {phones.map((p, i) => {
                    const pd  = data.phones?.find(ph => ph.slug === p.slug);
                    const prs = pd?.prices || [];
                    const lw  = prs.length ? prs.reduce((a,b) => parseFloat(a.price_inr) < parseFloat(b.price_inr) ? a : b) : null;
                    const lp  = p.launch_price_inr || p.launch_price;
                    return (
                      <div key={i} className="compare-value-cell" style={{ verticalAlign: 'top', borderBottom: 'none' }}>
                        {lw ? (
                          <>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
                              ₹{parseInt(lw.price_inr).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>on {lw.source}</div>
                            <a
                              href={lw.affiliate_url || '#'}
                              target="_blank" rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              Buy ↗
                            </a>
                          </>
                        ) : lp ? (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink3)' }}>
                            ₹{parseInt(lp).toLocaleString('en-IN')}
                            <div style={{ fontSize: 10 }}>launch price</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ink3)', fontSize: 12 }}>—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specs */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="compare-section-header" style={{ background: '#2a2825' }}>📋 Specifications</div>
                <div style={{ padding: '10px 13px', borderBottom: '1px solid var(--cream3)' }}>
                  <div className="spec-tab-list">
                    {SPEC_SECTIONS.map(s => (
                      <button
                        key={s}
                        className={`spec-tab ${specSec === s ? 'active' : ''}`}
                        onClick={() => setSpecSec(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {(() => {
                  const paramSet = new Set();
                  phones.forEach(p => {
                    const pd = data.phones?.find(ph => ph.slug === p.slug);
                    (pd?.specs?.[specSec] || []).forEach(s => paramSet.add(s.parameter));
                  });
                  const params = Array.from(paramSet);
                  if (!params.length) return (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                      No spec data for this section yet.
                    </div>
                  );
                  return params.map(param => (
                    <div key={param} style={{ display: 'grid', gridTemplateColumns: `160px repeat(${colCount}, 1fr)`, borderBottom: '1px solid var(--cream3)' }}>
                      <div className="compare-label-cell">{param}</div>
                      {phones.map((p, i) => {
                        const pd   = data.phones?.find(ph => ph.slug === p.slug);
                        const spec = (pd?.specs?.[specSec] || []).find(s => s.parameter === param);
                        return (
                          <div key={i} className="compare-value-cell" style={{ color: spec ? 'var(--ink)' : 'var(--ink3)' }}>
                            {spec ? spec.answer : '—'}
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
