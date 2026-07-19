// src/components/FloatTray.jsx
import { Link } from 'react-router-dom';

export default function FloatTray({ items = [], onRemove, onClear }) {
  const hidden = items.length === 0;
  return (
    <div className={`float-tray ${hidden ? 'hidden' : ''}`} role="region" aria-label="Compare tray">
      <span className="tray-label">Comparing</span>
      <div className="tray-items">
        {items.map(phone => (
          <div key={phone.slug} className="tray-item">
            {phone.name.length > 16 ? phone.name.slice(0, 16) + '…' : phone.name}
            <span
              className="tray-item-remove"
              onClick={() => onRemove(phone)}
              role="button"
              aria-label={`Remove ${phone.name}`}
            >✕</span>
          </div>
        ))}
        {items.length < 3 && items.length > 0 && (
          <div className="tray-empty-slot">+ add phone</div>
        )}
      </div>
      <Link to="/compare" className="tray-go-btn">Compare →</Link>
      <button className="tray-clear-btn" onClick={onClear}>Clear</button>
    </div>
  );
}
