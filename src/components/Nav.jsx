// src/components/Nav.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';

export default function Nav({ compareCount = 0 }) {
  const [q,       setQ]       = useState('');
  const [results, setRes]     = useState([]);
  const [open,    setOpen]    = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [menuOpen,setMenu]    = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const ref       = useRef(null);
  const timer     = useRef(null);

  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenu(false); }, [location.pathname]);

  function handleInput(e) {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setRes([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const data = await api.search(val);
        setRes(Array.isArray(data) ? data.slice(0, 7) : (data.phones || []).slice(0, 7));
        setOpen(true);
      } catch { setRes([]); }
      finally { setBusy(false); }
    }, 280);
  }

  function pick(phone) {
    setOpen(false); setQ('');
    navigate('/phones/' + phone.slug);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && q.trim()) {
      setOpen(false);
      navigate('/search?q=' + encodeURIComponent(q.trim()));
    }
    if (e.key === 'Escape') { setOpen(false); setQ(''); }
  }

  const active = path => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-mark">TS</div>
          TrustedSpecs
        </Link>

        <div className="nav-search" ref={ref}>
          <span className="nav-search-icon" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input
            className="nav-search-input"
            type="search"
            placeholder="Search phones…"
            value={q}
            onChange={handleInput}
            onKeyDown={onKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            aria-label="Search phones"
          />
          {open && (
            <div className="search-dropdown">
              {busy && <div className="search-empty">Searching…</div>}
              {!busy && results.length === 0 && <div className="search-empty">No results for "{q}"</div>}
              {!busy && results.map(p => (
                <div key={p.id || p.slug} className="search-item" onClick={() => pick(p)}>
                  {(p.primary_image_url || p.primary_image || p.image) && (
                    <img
                      src={p.primary_image_url || p.primary_image || p.image}
                      alt={p.name}
                      className="search-item-img"
                    />
                  )}
                  <div>
                    <div className="search-item-name">{p.name}</div>
                    <div className="search-item-brand">{p.brand}</div>
                  </div>
                  {p.overall_score > 0 && (
                    <div className="search-item-score">{parseFloat(p.overall_score).toFixed(1)}</div>
                  )}
                </div>
              ))}
              {q.trim().length >= 2 && (
                <div
                  onClick={() => { setOpen(false); navigate('/search?q=' + encodeURIComponent(q.trim())); }}
                  style={{ padding: '9px 13px', fontSize: 12, color: 'var(--purple)', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid var(--cream3)' }}
                >
                  See all results for "{q}" →
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-links">
          <Link to="/"       className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/phones" className={`nav-link ${active('/phones') ? 'active' : ''}`}>Phones</Link>
          <Link to="/compare"className={`nav-link ${active('/compare') ? 'active' : ''}`}>Compare</Link>
          <Link to="/budget" className={`nav-link ${active('/budget') ? 'active' : ''}`}>Budget</Link>
          <Link to="/news"   className={`nav-link ${active('/news') ? 'active' : ''}`}>News</Link>
          <Link to="/alerts" className={`nav-link ${active('/alerts') ? 'active' : ''}`}>🔔 Alerts</Link>
        </div>

        {compareCount > 0 && (
          <Link to="/compare" className="nav-compare-btn">
            Compare
            <span className="nav-compare-count">{compareCount}</span>
          </Link>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setMenu(!menuOpen)}
          style={{ display: 'none', padding: 6, borderRadius: 8, color: 'var(--ink2)', fontSize: 20 }}
          className="nav-menu-btn"
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 150 }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 240,
            background: 'var(--white)', zIndex: 151,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 20px rgba(0,0,0,.1)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--cream3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--purple)' }}>Menu</div>
              <button onClick={() => setMenu(false)} style={{ fontSize: 18, color: 'var(--ink3)' }}>✕</button>
            </div>
            <nav style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
              {[
                { to: '/',             label: '🏠 Home' },
                { to: '/phones',       label: '📱 All Phones' },
                { to: '/compare',      label: '⚡ Compare' },
                { to: '/budget',       label: '💰 Budget Finder' },
                { to: '/news',         label: '📰 News & Reviews' },
                { to: '/alerts',       label: '🔔 Price Alerts' },
                { to: '/how-we-score', label: '⭐ How We Score' },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{
                  display: 'block', padding: '11px 20px',
                  fontSize: 14, fontWeight: 500, color: 'var(--ink2)',
                  borderBottom: '1px solid var(--cream3)',
                  textDecoration: 'none',
                  background: location.pathname === l.to ? 'var(--purple-pale)' : 'transparent',
                  color: location.pathname === l.to ? 'var(--purple)' : 'var(--ink2)',
                }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 700px) {
          .nav-links { display: none !important; }
          .nav-compare-btn { display: none !important; }
          .nav-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
