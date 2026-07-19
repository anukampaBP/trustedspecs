// src/pages/Home.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import PhoneCard, { PhoneCardSkeleton } from '../components/PhoneCard';
import ScoreRing from '../components/ScoreRing';
import AdSlot from '../components/AdSlot';

/* ── Static data (replaced with API when available) ─────────────────────── */
const BRANDS = [
  { name: 'Samsung',  count: 38, bg: '#1428A0', init: 'Sa' },
  { name: 'Xiaomi',   count: 31, bg: '#FF6900', init: 'Mi' },
  { name: 'OnePlus',  count: 22, bg: '#F5010C', init: '1+' },
  { name: 'Realme',   count: 24, bg: '#c8a000', fg: '#000', init: 'Re' },
  { name: 'Vivo',     count: 19, bg: '#415FFF', init: 'Vi' },
  { name: 'OPPO',     count: 16, bg: '#1D8348', init: 'Op' },
  { name: 'iQOO',     count: 11, bg: '#7B2FBE', init: 'iQ' },
  { name: 'Apple',    count: 9,  bg: '#555555', init: '🍎' },
  { name: 'Google',   count: 7,  bg: '#4285F4', init: 'G' },
  { name: 'Nothing',  count: 5,  bg: '#0f0e0c', init: 'Nt' },
  { name: 'Motorola', count: 8,  bg: '#E1000F', init: 'Mo' },
  { name: 'Nokia',    count: 4,  bg: '#005AFF', init: 'Nk' },
];

const BUDGET_OPTS = [
  { label: 'All prices', val: 'all' },
  { label: 'Under ₹15K', val: '15' },
  { label: '₹15K–25K',  val: '15-25' },
  { label: '₹25K–40K',  val: '25-40' },
  { label: '₹40K–60K',  val: '40-60' },
  { label: 'Above ₹60K', val: '60+' },
];

const CAT_OPTS = [
  { label: 'All',      val: 'all' },
  { label: '📷 Camera', val: 'camera' },
  { label: '🎮 Gaming', val: 'gaming' },
  { label: '🔋 Battery', val: 'battery' },
  { label: '📶 5G',     val: '5g' },
  { label: '👑 Flagship', val: 'flagship' },
  { label: '💰 Value',  val: 'value' },
];

const MOCK_UPCOMING = [
  { badge: 'Jul 2025', brand: 'Samsung', name: 'Galaxy Z Flip 7',  detail: 'Foldable · ~₹1,09,999' },
  { badge: 'Aug 2025', brand: 'OnePlus', name: 'OnePlus 13T',      detail: 'Flagship · ~₹64,999' },
  { badge: 'Aug 2025', brand: 'Google',  name: 'Pixel 9a',         detail: 'Mid-range · ~₹49,999' },
  { badge: 'Sep 2025', brand: 'Apple',   name: 'iPhone 17 Pro',    detail: 'Flagship · ~₹1,34,999' },
  { badge: 'Sep 2025', brand: 'Xiaomi',  name: 'Xiaomi 15 Ultra',  detail: 'Flagship · ~₹89,999' },
  { badge: 'Oct 2025', brand: 'Nothing', name: 'Nothing Phone 3 Ultra', detail: 'Premium · ~₹54,999' },
];

const MOCK_CMP = [
  { a: 'OnePlus 13',       b: 'Galaxy S25+',    count: '2.4K' },
  { a: 'Redmi Note 14 Pro+', b: 'Poco X7 Pro', count: '1.8K' },
  { a: 'iQOO Neo 10',     b: 'Realme GT 7 Pro', count: '1.1K' },
  { a: 'Pixel 9 Pro',     b: 'iPhone 16 Pro',   count: '980' },
  { a: 'Nothing 3a Pro',  b: 'OnePlus Nord 4',  count: '720' },
];

const DIMS = [
  { icon: '☀️', name: 'Daytime camera',  desc: 'Colour, sharpness, dynamic range' },
  { icon: '🌙', name: 'Night camera',    desc: 'Low-light, noise, AI processing' },
  { icon: '🎬', name: 'Video',           desc: 'Stabilisation, 4K quality' },
  { icon: '🎮', name: 'Gaming',          desc: 'Frame rate, heat, GPU speed' },
  { icon: '🔋', name: 'Battery life',    desc: 'Screen-on time, charge speed' },
  { icon: '🔊', name: 'Speaker',         desc: 'Volume, clarity, stereo' },
  { icon: '📞', name: 'Call quality',    desc: 'Mic, earpiece, signal handling' },
  { icon: '🤖', name: 'Software',        desc: 'UI speed, bloatware, updates' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function inBudget(phone, budget) {
  if (budget === 'all') return true;
  const p = parseInt(phone.launch_price_inr || phone.launch_price || 0);
  if (!p) return budget === 'all';
  if (budget === '15')    return p < 15000;
  if (budget === '15-25') return p >= 15000 && p <= 25000;
  if (budget === '25-40') return p > 25000  && p <= 40000;
  if (budget === '40-60') return p > 40000  && p <= 60000;
  if (budget === '60+')   return p > 60000;
  return true;
}
function inCat(phone, cat) {
  if (cat === 'all') return true;
  const tags = (phone.upgrade_tags || '').toLowerCase();
  return tags.includes(cat);
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function Home({ compareList, onAddCompare }) {
  const [phones,     setPhones]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [stats,      setStats]     = useState({ phones: 227, brands: 28 });
  const [searched,   setSearched]  = useState([]);
  const [upcoming,   setUpcoming]  = useState(MOCK_UPCOMING);
  const [comparisons,setCmps]      = useState(MOCK_CMP);
  const [articles,   setArticles]  = useState([]);
  const [budget,     setBudget]    = useState('all');
  const [cat,        setCat]       = useState('all');
  const [activeBrand,setBrand]     = useState('');
  const navigate = useNavigate();

  // Load phones
  useEffect(() => {
    setLoading(true);
    api.phones({ limit: 24, status: 1 })
      .then(d => setPhones(Array.isArray(d) ? d : (d.phones || [])))
      .catch(() => setPhones([]))
      .finally(() => setLoading(false));
  }, []);

  // Load supporting data
  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.topSearched().then(d => setSearched(Array.isArray(d) ? d.slice(0, 5) : [])).catch(() => {});
    api.topComparisons().then(d => Array.isArray(d) && d.length && setCmps(d)).catch(() => {});
    api.upcoming().then(d => Array.isArray(d) && d.length && setUpcoming(d)).catch(() => {});
    api.articles({ limit: 4 }).then(d => setArticles(Array.isArray(d) ? d : (d.articles || []))).catch(() => {});
  }, []);

  // Filter phones
  const filtered = phones.filter(p => {
    const bOk = inBudget(p, budget);
    const cOk = inCat(p, cat);
    const brOk = !activeBrand || p.brand === activeBrand;
    return bOk && cOk && brOk;
  });

  const hasFilter = budget !== 'all' || cat !== 'all' || activeBrand !== '';
  function clearFilters() { setBudget('all'); setCat('all'); setBrand(''); }

  function filterLabel() {
    const parts = [];
    if (activeBrand) parts.push(activeBrand);
    if (budget !== 'all') parts.push(BUDGET_OPTS.find(b => b.val === budget)?.label);
    if (cat !== 'all') parts.push(CAT_OPTS.find(c => c.val === cat)?.label);
    return 'Showing: ' + parts.join(' · ');
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-eyebrow">✓ Real scores from real YouTube reviews</div>
        <h1 className="hero-title">
          Find your perfect phone.<br />
          <em>We did the homework.</em>
        </h1>
        <p className="hero-sub">
          Every phone gets scored across 8 real-world dimensions — camera, battery,
          gaming, speaker, and more. Based on hours of YouTube research.
        </p>
        <div className="hero-stats">
          <div>
            <div className="hero-stat-val">{stats.phones || 227}</div>
            <div className="hero-stat-lbl">phones scored</div>
          </div>
          <div>
            <div className="hero-stat-val">{stats.brands || 28}</div>
            <div className="hero-stat-lbl">brands</div>
          </div>
          <div>
            <div className="hero-stat-val">8</div>
            <div className="hero-stat-lbl">score dimensions</div>
          </div>
        </div>
      </div>

      {/* ── Brand strip ───────────────────────────────────────────────── */}
      <div className="brand-strip">
        <div className="brand-strip-label">Browse by brand</div>
        <div className="brand-row">
          {BRANDS.map(b => (
            <div
              key={b.name}
              className={`brand-chip ${activeBrand === b.name ? 'active' : ''}`}
              onClick={() => setBrand(activeBrand === b.name ? '' : b.name)}
            >
              <div className="brand-logo" style={{ background: b.bg, color: b.fg || '#fff' }}>
                {b.init}
              </div>
              <span className="brand-chip-name">{b.name}</span>
              <span className="brand-chip-count">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Combined filter bar ────────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="filter-inner">
          <div className="filter-group">
            <span className="filter-group-label">Budget</span>
            {BUDGET_OPTS.map(o => (
              <button
                key={o.val}
                className={`fpill ${budget === o.val ? 'active-budget' : ''}`}
                onClick={() => setBudget(o.val)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Best for</span>
            {CAT_OPTS.map(o => (
              <button
                key={o.val}
                className={`fpill ${cat === o.val ? 'active-cat' : ''}`}
                onClick={() => setCat(o.val)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active filter summary */}
      {hasFilter && (
        <div className="filter-summary">
          <span>🔍</span>
          <span>{filterLabel()}</span>
          <button className="filter-summary-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div className="page-content">

        {/* Top phones */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">🔥</span>
              Top phones right now
            </h2>
            <Link to="/phones" className="section-link">View all →</Link>
          </div>
          <div className="phone-grid">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <PhoneCardSkeleton key={i} />)
              : filtered.length > 0
                ? filtered.slice(0, 12).map(p => (
                    <PhoneCard
                      key={p.id || p.slug}
                      phone={p}
                      onAddCompare={onAddCompare}
                      inCompare={compareList.some(c => c.slug === p.slug)}
                    />
                  ))
                : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2.5rem', color: 'var(--ink3)' }}>
                    No phones match this filter combination yet.
                  </div>
                )
            }
          </div>
        </div>

        {/* Top searched */}
        {searched.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">📈</span>
                Most searched this week
              </h2>
              <Link to="/phones" className="section-link">See all →</Link>
            </div>
            <div className="searched-list">
              {searched.map((p, i) => (
                <div
                  key={p.id || p.slug}
                  className="searched-item"
                  onClick={() => navigate('/phones/' + p.slug)}
                >
                  <span className={`searched-rank ${i < 3 ? 'top' : ''}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="searched-info">
                    <div className="searched-name">{p.name}</div>
                    <div className="searched-brand">{p.brand}</div>
                  </div>
                  <ScoreRing score={parseFloat(p.overall_score) || 0} size="md" animated={false} />
                  <span className="searched-price">
                    {p.launch_price_inr ? '₹' + parseInt(p.launch_price_inr).toLocaleString('en-IN') : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top comparisons */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">📺</span>
              Top comparisons this week
            </h2>
            <Link to="/compare" className="section-link">All comparisons →</Link>
          </div>
          <div className="h-scroll">
            {comparisons.map((c, i) => (
              <div key={i} className="cmp-card" onClick={() => navigate('/compare')}>
                <div className="cmp-phones">
                  <span className="cmp-phone-name">{c.a}</span>
                  <span className="cmp-vs">VS</span>
                  <span className="cmp-phone-name">{c.b}</span>
                </div>
                <div className="cmp-count">
                  <strong>{c.count || c.comparison_count || '—'}</strong> comparisons this week
                </div>
                <button className="cmp-yt-btn">
                  ▶ Watch comparison video
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ad slot */}
        <AdSlot type="leaderboard" />

        {/* Upcoming launches */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">📅</span>
              Upcoming launches
            </h2>
            <button className="section-link">All upcoming →</button>
          </div>
          <div className="h-scroll">
            {upcoming.map((u, i) => (
              <div key={i} className="upcoming-card">
                <div className="upcoming-badge">{u.expected_date || u.badge}</div>
                <div className="upcoming-img">📱</div>
                <div className="upcoming-brand">{u.brand}</div>
                <div className="upcoming-name">{u.name}</div>
                <div className="upcoming-detail">{u.detail || u.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How we score */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">⭐</span>
              How we score phones
            </h2>
          </div>
          <div className="dims-grid">
            {DIMS.map(d => (
              <div key={d.name} className="dim-card">
                <span className="dim-card-icon">{d.icon}</span>
                <div className="dim-card-name">{d.name}</div>
                <div className="dim-card-desc">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest news */}
        {articles.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">📰</span>
                Latest news
              </h2>
              <Link to="/news" className="section-link">All news →</Link>
            </div>
            <div className="h-scroll">
              {articles.map(a => (
                <div key={a.id} className="news-card" onClick={() => navigate('/news/' + a.slug)}>
                  <div className={`news-type news-type-${a.type || 'guide'}`}>
                    {a.type || 'Article'}
                  </div>
                  <div className="news-title">{a.title}</div>
                  <div className="news-ago">
                    {a.published_at ? new Date(a.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA banner */}
        <div className="cta-banner">
          <div>
            <h3>Can't decide between two phones?</h3>
            <p>Compare specs, scores, and prices side by side. Takes 10 seconds.</p>
          </div>
          <Link to="/compare" className="btn btn-hot btn-lg">Compare now →</Link>
        </div>

      </div>
    </>
  );
}
