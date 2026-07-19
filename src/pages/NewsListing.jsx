// src/pages/NewsListing.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

const TYPES = [
  { val: '',             label: 'All' },
  { val: 'news',         label: '📡 News' },
  { val: 'review',       label: '⭐ Reviews' },
  { val: 'comparison',   label: '⚡ Comparisons' },
  { val: 'buying_guide', label: '🛒 Buying Guides' },
  { val: 'analysis',     label: '📊 Analysis' },
];

const TYPE_COLORS = {
  news:         { bg: 'var(--hot-dim)',    color: 'var(--hot)' },
  review:       { bg: 'var(--green-dim)',  color: 'var(--green)' },
  comparison:   { bg: 'var(--blue-dim)',   color: 'var(--blue)' },
  buying_guide: { bg: 'var(--purple-dim)', color: 'var(--purple)' },
  analysis:     { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
};

function typeStyle(t) {
  return TYPE_COLORS[t] || { bg: 'var(--cream2)', color: 'var(--ink3)' };
}

function typeLabel(t) {
  return TYPES.find(x => x.val === t)?.label?.replace(/^[^\w]*/, '') || t;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d    = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600)  return Math.round(diff / 60) + 'm ago';
  if (diff < 86400) return Math.round(diff / 3600) + 'h ago';
  if (diff < 604800)return Math.round(diff / 86400) + 'd ago';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NewsListing() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const type = sp.get('type') || '';
  const PER  = 18;

  useEffect(() => {
    setLoading(true);
    api.articles({ limit: PER, offset: (page - 1) * PER, type, status: 'published' })
      .then(d => {
        setArticles(Array.isArray(d) ? d : (d.articles || []));
        setTotal(d.total || (Array.isArray(d) ? d.length : 0));
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [type, page]);

  function setType(val) {
    const next = new URLSearchParams();
    if (val) next.set('type', val);
    setSp(next); setPage(1);
  }

  const featured  = articles[0];
  const rest      = articles.slice(1);
  const pages     = Math.ceil(total / PER);

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '18px var(--pad)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
            <Link to="/">Home</Link> › News & Reviews
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            News & Reviews
          </h1>
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto' }}>
            {TYPES.map(t => (
              <button key={t.val} onClick={() => setType(t.val)} style={{
                padding: '5px 14px', borderRadius: 99, whiteSpace: 'nowrap',
                border: '1.5px solid var(--cream3)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: type === t.val ? 'var(--ink)' : 'var(--cream)',
                color: type === t.val ? '#fff' : 'var(--ink2)',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '20px var(--pad) 40px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--r-lg)' }} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📰</div>
            <div style={{ fontWeight: 600 }}>No articles yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Check back soon</div>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <div
                onClick={() => navigate('/news/' + featured.slug)}
                style={{
                  background: 'var(--white)', border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-xl)',
                  overflow: 'hidden', cursor: 'pointer', display: 'grid',
                  gridTemplateColumns: featured.cover_image_url ? '1fr 1fr' : '1fr',
                  marginBottom: 18,
                  transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--cream3)'}
              >
                {featured.cover_image_url && (
                  <img src={featured.cover_image_url} alt={featured.title}
                    style={{ width: '100%', height: 240, objectFit: 'cover' }} />
                )}
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'inline-block', marginBottom: 10, ...typeStyle(featured.type), padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', width: 'fit-content' }}>
                    {typeLabel(featured.type)}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, marginBottom: 10 }}>
                      {featured.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    {timeAgo(featured.published_at)}
                    {featured.read_time_minutes ? ` · ${featured.read_time_minutes} min read` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Article grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {rest.map(a => (
                <div
                  key={a.id}
                  onClick={() => navigate('/news/' + a.slug)}
                  style={{
                    background: 'var(--white)', border: '1.5px solid var(--cream3)',
                    borderRadius: 'var(--r-lg)', overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color .15s, transform .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cream3)'; e.currentTarget.style.transform = ''; }}
                >
                  {a.cover_image_url && (
                    <img src={a.cover_image_url} alt={a.title}
                      style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ ...typeStyle(a.type), display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7, width: 'fit-content' }}>
                      {typeLabel(a.type)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, marginBottom: 6, color: 'var(--ink)' }}>
                      {a.title}
                    </div>
                    {a.excerpt && (
                      <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5, marginBottom: 8,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {a.excerpt}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {timeAgo(a.published_at)}
                      {a.read_time_minutes ? ` · ${a.read_time_minutes} min read` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24 }}>
                {page > 1 && <button onClick={() => setPage(p => p - 1)} style={pagStyle(false)}>← Prev</button>}
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={pagStyle(p === page)}>{p}</button>
                ))}
                {page < pages && <button onClick={() => setPage(p => p + 1)} style={pagStyle(false)}>Next →</button>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function pagStyle(active) {
  return {
    padding: '6px 13px', borderRadius: 'var(--r)',
    border: '1.5px solid var(--cream3)', cursor: 'pointer', fontSize: 13,
    background: active ? 'var(--purple)' : 'var(--white)',
    color: active ? '#fff' : 'var(--ink2)', fontWeight: active ? 700 : 400,
  };
}
