// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import PhoneCard, { PhoneCardSkeleton } from '../components/PhoneCard';
import ScoreRing from '../components/ScoreRing';
import AdSlot from '../components/AdSlot';

const CATEGORIES = [
  { key: 'all',     label: 'All Phones',    icon: '📱' },
  { key: 'gaming',  label: 'Gaming',         icon: '🎮' },
  { key: 'camera',  label: 'Camera',         icon: '📷' },
  { key: 'battery', label: 'Battery',        icon: '🔋' },
  { key: '5g',      label: '5G',             icon: '📶' },
  { key: 'budget',  label: 'Under ₹20K',    icon: '💰' },
  { key: 'flagship',label: 'Flagship',       icon: '👑' },
];

const BUDGET_RANGES = [
  { label: 'Under ₹15,000',  max: 15000 },
  { label: '₹15K – ₹25K',   min: 15000, max: 25000 },
  { label: '₹25K – ₹40K',   min: 25000, max: 40000 },
  { label: '₹40K – ₹60K',   min: 40000, max: 60000 },
  { label: 'Above ₹60K',    min: 60000 },
];

export default function Home({ compareList, onAddCompare }) {
  const [phones,   setPhones]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setTab]     = useState('all');
  const [stats,    setStats]    = useState({ phones: 227, brands: 28, reviews: 450 });
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = { limit: 12, status: 1 };
        if (activeTab !== 'all') params.tag = activeTab;
        const data = await api.phones(params);
        setPhones(Array.isArray(data) ? data : (data.phones || []));
      } catch {
        setPhones([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTab]);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-eyebrow">
            ✦ Real scores from real YouTube reviews
          </div>
          <h1 className="hero-title">
            Find your perfect phone.<br />
            <span>Not just specs.</span>
          </h1>
          <p className="hero-sub">
            We watch hours of YouTube reviews so you don't have to.
            Every phone gets a real-world score across 8 dimensions — camera,
            battery, gaming, speaker, and more.
          </p>
          <div className="hero-actions">
            <Link to="/compare" className="btn btn-coral btn-lg">
              Compare Phones
            </Link>
            <Link to="/budget" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,.15)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,.3)',
            }}>
              Find by Budget
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {[
              { value: stats.phones || 227, label: 'Phones reviewed' },
              { value: stats.brands || 28,  label: 'Brands covered' },
              { value: '8',                  label: 'Score dimensions' },
            ].map(s => (
              <div key={s.label}>
                <div className="hero-stat-value">{s.value}+</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AdSense leaderboard ───────────────────────────────────────────────── */}
      <div className="container" style={{ marginTop: '1.5rem' }}>
        <AdSlot type="leaderboard" />
      </div>

      {/* ── How we score ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0 3rem', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Our Method</div>
            <h2 className="section-title" style={{ marginBottom: '.5rem' }}>
              How TrustedSpecs scores phones
            </h2>
            <p className="section-sub" style={{ margin: '0 auto', maxWidth: 520 }}>
              We study multiple YouTube reviews per phone and score 8 real-world dimensions, not marketing specs.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { dim: 'Daytime Camera', icon: '☀️', desc: 'Sharpness, colour accuracy, dynamic range' },
              { dim: 'Night Camera',   icon: '🌙', desc: 'Low-light detail, noise handling, AI processing' },
              { dim: 'Gaming',         icon: '🎮', desc: 'Frame rates, heat management, GPU performance' },
              { dim: 'Battery Life',   icon: '🔋', desc: 'Screen-on time, charge speed, efficiency' },
              { dim: 'Speaker',        icon: '🔊', desc: 'Volume, clarity, stereo separation' },
              { dim: 'Video',          icon: '🎬', desc: 'Stabilisation, 4K quality, slo-mo' },
              { dim: 'Call Quality',   icon: '📞', desc: 'Mic clarity, earpiece, signal handling' },
              { dim: 'Software',       icon: '🤖', desc: 'Bloatware, updates, UI smoothness' },
            ].map(d => (
              <div key={d.dim} className="card" style={{ padding: '1.1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>{d.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.3rem' }}>{d.dim}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--ink-light)' }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Phone listings ────────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <div className="section-eyebrow">Browse</div>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Top Phones</h2>
            </div>
            <Link to="/phones" className="btn btn-secondary btn-sm">View all phones →</Link>
          </div>

          {/* Category tabs */}
          <div className="pill-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`pill-tab ${activeTab === cat.key ? 'active' : ''}`}
                onClick={() => setTab(cat.key)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Phone grid */}
          <div className="phone-grid">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <PhoneCardSkeleton key={i} />)
              : phones.length > 0
                ? phones.map(phone => (
                    <PhoneCard
                      key={phone.id || phone.slug}
                      phone={phone}
                      onAddCompare={onAddCompare}
                      inCompare={compareList.some(p => p.slug === phone.slug)}
                    />
                  ))
                : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--ink-light)' }}>
                    No phones found in this category yet.
                  </div>
                )
            }
          </div>
        </div>
      </section>

      {/* ── Budget quick filter ───────────────────────────────────────────────── */}
      <section style={{ padding: '2rem 0 3.5rem', background: 'var(--white)' }}>
        <div className="container">
          <div className="section-eyebrow">Find by budget</div>
          <h2 className="section-title">What's your budget?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
            {BUDGET_RANGES.map(r => (
              <button
                key={r.label}
                className="btn btn-secondary"
                onClick={() => navigate('/budget?' + new URLSearchParams({
                  ...(r.min ? { min: r.min } : {}),
                  ...(r.max ? { max: r.max } : {}),
                }).toString())}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── In-content ad ────────────────────────────────────────────────────── */}
      <div className="container">
        <AdSlot type="in-content" />
      </div>

      {/* ── Compare CTA ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: '3.5rem 0',
        background: 'linear-gradient(135deg, var(--purple) 0%, #4c1d95 100%)',
        color: '#fff',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>⚡</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.75rem',
            fontWeight: 800, marginBottom: '.75rem'
          }}>
            Can't decide between two phones?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.75)', marginBottom: '1.5rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
            Compare up to 3 phones side-by-side — specs, quality scores, and prices.
          </p>
          <Link to="/compare" className="btn btn-coral btn-lg">
            Start Comparing →
          </Link>
        </div>
      </section>
    </>
  );
}
