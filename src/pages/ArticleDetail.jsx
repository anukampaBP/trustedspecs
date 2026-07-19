// src/pages/ArticleDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TYPE_COLORS = {
  news:         { bg: 'var(--hot-dim)',    color: 'var(--hot)' },
  review:       { bg: 'var(--green-dim)',  color: 'var(--green)' },
  comparison:   { bg: 'var(--blue-dim)',   color: 'var(--blue)' },
  buying_guide: { bg: 'var(--purple-dim)', color: 'var(--purple)' },
  analysis:     { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
};

export default function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article,  setArticle]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [related,  setRelated]  = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.article(slug)
      .then(d => {
        setArticle(d);
        setLoading(false);
        if (d.related_phones?.length) {
          // load related phone cards
        }
      })
      .catch(() => setLoading(false));
  }, [slug]);

  function share(platform) {
    const url = encodeURIComponent(window.location.href);
    const txt = encodeURIComponent(article?.title || '');
    const links = {
      twitter:   `https://twitter.com/intent/tweet?url=${url}&text=${txt}`,
      whatsapp:  `https://wa.me/?text=${txt}%20${url}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  }

  if (loading) return (
    <div style={{ maxWidth: 740, margin: '40px auto', padding: '0 var(--pad)' }}>
      <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 32, width: '85%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 32, width: '65%', marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-xl)', marginBottom: 24 }} />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, marginBottom: 10, width: i % 3 === 2 ? '70%' : '100%' }} />
      ))}
    </div>
  );

  if (!article) return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>😕</div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Article not found</h2>
      <Link to="/news" className="btn btn-primary">Browse all articles</Link>
    </div>
  );

  const ts = TYPE_COLORS[article.type] || { bg: 'var(--cream2)', color: 'var(--ink3)' };

  return (
    <div>
      {/* Article header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '20px var(--pad) 24px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 10 }}>
            <Link to="/">Home</Link> › <Link to="/news">News</Link> › {article.title.slice(0, 40)}…
          </div>

          <div style={{ ...ts, display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, width: 'fit-content' }}>
            {article.type?.replace('_', ' ')}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, lineHeight: 1.25, marginBottom: 12, color: 'var(--ink)' }}>
            {article.title}
          </h1>

          {article.excerpt && (
            <p style={{ fontSize: 15, color: 'var(--ink2)', lineHeight: 1.65, marginBottom: 14 }}>
              {article.excerpt}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
              {timeAgo(article.published_at)}
              {article.read_time_minutes ? ` · ${article.read_time_minutes} min read` : ''}
            </div>
            {/* Share buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'whatsapp', label: '💬 WhatsApp' },
                { id: 'twitter',  label: '𝕏 Share' },
                { id: 'facebook', label: '👍 Share' },
              ].map(s => (
                <button key={s.id} onClick={() => share(s.id)} style={{
                  padding: '5px 12px', borderRadius: 99, border: '1.5px solid var(--cream3)',
                  background: 'var(--cream)', fontSize: 12, fontWeight: 500, color: 'var(--ink2)', cursor: 'pointer',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {article.cover_image_url && (
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '20px var(--pad) 0' }}>
          <img src={article.cover_image_url} alt={article.title}
            style={{ width: '100%', borderRadius: 'var(--r-xl)', maxHeight: 380, objectFit: 'cover' }} />
        </div>
      )}

      {/* Article body */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px var(--pad) 40px' }}>
        <div
          className="article-body"
          style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink2)' }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Share footer */}
        <div style={{
          marginTop: 32, padding: '18px 20px',
          background: 'var(--cream)', borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Found this helpful? Share it 👇</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {[
              { id: 'whatsapp', label: '💬 WhatsApp', bg: '#25D366', color: '#fff' },
              { id: 'twitter',  label: '𝕏 Twitter',   bg: '#000',    color: '#fff' },
            ].map(s => (
              <button key={s.id} onClick={() => share(s.id)} style={{
                padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: s.bg, color: s.color, fontSize: 13, fontWeight: 600,
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Back to news */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/news" className="btn btn-secondary">← Back to all articles</Link>
        </div>
      </div>
    </div>
  );
}
