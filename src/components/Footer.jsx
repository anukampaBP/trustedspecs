// src/components/Footer.jsx
import { Link } from 'react-router-dom';

const BRANDS = ['Samsung','Xiaomi','OnePlus','Realme','Vivo','Apple','Google','Nothing','iQOO'];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
          <div>
            <div className="footer-logo">TrustedSpecs</div>
            <div className="footer-tagline">Real scores from real reviews. Not just spec sheets.</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 8 }}>
              © {new Date().getFullYear()} TrustedSpecs
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', marginBottom: 10 }}>
              Explore
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { to: '/phones',       label: 'All Phones' },
                { to: '/compare',      label: 'Compare Phones' },
                { to: '/budget',       label: 'Budget Finder' },
                { to: '/news',         label: 'News & Reviews' },
                { to: '/alerts',       label: 'Price Alerts' },
                { to: '/how-we-score', label: 'How We Score' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="footer-links" style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', marginBottom: 10 }}>
              Brands
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {BRANDS.slice(0, 6).map(b => (
                <Link key={b} to={`/brands/${b}`} style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, textDecoration: 'none' }}>
                  {b}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', marginBottom: 10 }}>
              About
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { to: '/how-we-score', label: 'Methodology' },
                { to: '/about',        label: 'About Us' },
                { to: '/privacy',      label: 'Privacy Policy' },
                { to: '/disclaimer',   label: 'Disclaimer' },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          Prices are indicative. Always verify before purchase. ·
          We may earn commission from affiliate links. ·
          Scores are based on our analysis of YouTube reviews.
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer .footer-inner > div:first-child { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </footer>
  );
}
