// src/components/Nav.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';

export default function Nav({ compareList = [], onClearCompare }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const searchRef  = useRef(null);
  const timer      = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); setShowDrop(false); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.search(q);
        setResults(data.phones || data || []);
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function goToPhone(slug) {
    setShowDrop(false);
    setQuery('');
    navigate('/phones/' + slug);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim()) {
      setShowDrop(false);
      navigate('/search?q=' + encodeURIComponent(query.trim()));
    }
    if (e.key === 'Escape') { setShowDrop(false); setQuery(''); }
  }

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="nav">
      <div className="nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="nav-logo-mark">TS</div>
          TrustedSpecs
        </Link>

        {/* Search */}
        <div className="nav-search" ref={searchRef}>
          <svg className="nav-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="5"/><path d="m15 15-3-3"/>
          </svg>
          <input
            className="nav-search-input"
            type="search"
            placeholder="Search phones…"
            value={query}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowDrop(true)}
          />
          {showDrop && (
            <div className="search-results-dropdown">
              {searching && (
                <div className="search-no-results">Searching…</div>
              )}
              {!searching && results.length === 0 && (
                <div className="search-no-results">No phones found for "{query}"</div>
              )}
              {!searching && results.map(phone => (
                <div
                  key={phone.id || phone.slug}
                  className="search-result-item"
                  onClick={() => goToPhone(phone.slug)}
                >
                  {phone.image && (
                    <img src={phone.image} alt={phone.name} className="search-result-img" />
                  )}
                  <div>
                    <div className="search-result-name">{phone.name}</div>
                    <div className="search-result-sub">{phone.brand}</div>
                  </div>
                  {phone.overall_score > 0 && (
                    <div className="search-result-score">{phone.overall_score}/10</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav links */}
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/compare" className={isActive('/compare')}>Compare</Link>
          <Link to="/budget" className={isActive('/budget')}>Budget</Link>
        </div>

        {/* Compare CTA */}
        {compareList.length > 0 && (
          <Link to="/compare" className="nav-compare-btn">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 10h14M10 3v14"/>
            </svg>
            Compare
            <span className="nav-compare-count">{compareList.length}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
