// src/pages/NotFound.jsx
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 700, color: 'var(--cream3)', lineHeight: 1, marginBottom: 12 }}>
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.65, marginBottom: 24 }}>
          The page you're looking for doesn't exist or has been moved.
          Try searching for a phone or head back home.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">← Go back</button>
          <Link to="/" className="btn btn-primary">Home</Link>
          <Link to="/phones" className="btn btn-secondary">Browse phones</Link>
        </div>
      </div>
    </div>
  );
}
