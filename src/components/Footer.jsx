// src/components/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">TrustedSpecs</div>
            <div className="footer-tagline">
              Real scores from real reviews.<br />Not just spec sheets.
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/compare">Compare Phones</Link></li>
              <li><Link to="/budget">Budget Finder</Link></li>
            </ul>
          </div>
          <div>
            <h4>Brands</h4>
            <ul className="footer-links">
              <li><Link to="/?brand=Samsung">Samsung</Link></li>
              <li><Link to="/?brand=OnePlus">OnePlus</Link></li>
              <li><Link to="/?brand=Xiaomi">Xiaomi</Link></li>
              <li><Link to="/?brand=Apple">Apple</Link></li>
              <li><Link to="/?brand=Vivo">Vivo</Link></li>
            </ul>
          </div>
          <div>
            <h4>Info</h4>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">How we score</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} TrustedSpecs. Prices are indicative. Always verify before purchase.</p>
          <p style={{ marginTop: '.35rem', fontSize: '.75rem', opacity: .5 }}>
            We may earn commission from affiliate links on this site.
          </p>
        </div>
      </div>
    </footer>
  );
}
