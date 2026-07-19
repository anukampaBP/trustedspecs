// src/pages/SearchResults.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import PhoneCard, { PhoneCardSkeleton } from '../components/PhoneCard';

export default function SearchResults({ compareList, onAddCompare }) {
  const [sp] = useSearchParams();
  const q    = sp.get('q') || '';
  const [phones,   setPhones]   = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    Promise.allSettled([
      api.search(q),
      api.articles({ q, limit: 4 }),
    ]).then(([phonesRes, articlesRes]) => {
      const p = phonesRes.status === 'fulfilled' ? phonesRes.value : [];
      const a = articlesRes.status === 'fulfilled' ? articlesRes.value : [];
      setPhones(Array.isArray(p) ? p : (p.phones || []));
      setArticles(Array.isArray(a) ? a : (a.articles || []));
    }).finally(() => setLoading(false));
  }, [q]);

  const total = phones.length + articles.length;

  return (
    <div>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '18px var(--pad)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
            <Link to="/">Home</Link> › Search
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {q ? `Results for "${q}"` : 'Search'}
          </h1>
          {searched && !loading && (
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>
              {total > 0 ? `${total} result${total !== 1 ? 's' : ''} found` : 'No results found'}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '20px var(--pad) 40px' }}>
        {!q && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>Enter a phone name or brand to search</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try "OnePlus 13" or "Samsung" or "best camera"</div>
          </div>
        )}

        {loading && (
          <div className="phone-grid">
            {Array.from({ length: 6 }, (_, i) => <PhoneCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && searched && total === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>😕</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No results for "{q}"</div>
            <div style={{ fontSize: 13, marginBottom: 18 }}>Try a different search term or browse all phones</div>
            <Link to="/phones" className="btn btn-primary">Browse all phones →</Link>
          </div>
        )}

        {/* Phones */}
        {!loading && phones.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              📱 Phones <span style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 400 }}>({phones.length})</span>
            </h2>
            <div className="phone-grid">
              {phones.map(p => (
                <PhoneCard key={p.id || p.slug} phone={p}
                  onAddCompare={onAddCompare}
                  inCompare={compareList.some(c => c.slug === p.slug)} />
              ))}
            </div>
          </div>
        )}

        {/* Articles */}
        {!loading && articles.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              📰 Articles <span style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 400 }}>({articles.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {articles.map(a => (
                <Link key={a.id} to={'/news/' + a.slug} style={{
                  display: 'block', background: 'var(--white)',
                  border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-lg)',
                  padding: '14px 16px', textDecoration: 'none',
                  transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--cream3)'}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--purple)', marginBottom: 5 }}>
                    {a.type?.replace('_', ' ')}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 5 }}>{a.title}</div>
                  {a.excerpt && <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{a.excerpt}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
