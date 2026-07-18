// src/components/PhoneCard.jsx
import { useNavigate } from 'react-router-dom';
import { ScoreBadge } from './ScoreRing';

function formatPrice(price) {
  if (!price) return null;
  return '₹' + parseInt(price).toLocaleString('en-IN');
}

export default function PhoneCard({ phone, onAddCompare, inCompare }) {
  const navigate = useNavigate();

  function go(e) {
    e.stopPropagation();
    navigate('/phones/' + phone.slug);
  }

  function handleCompare(e) {
    e.stopPropagation();
    onAddCompare && onAddCompare(phone);
  }

  const score = parseFloat(phone.overall_score) || 0;
  const price = phone.current_price || phone.launch_price_inr;

  // Tag color map
  const tagColors = {
    gaming: 'badge-purple', camera: 'badge-coral',
    battery: 'badge-yellow', '5g': 'badge-teal',
    flagship: 'badge-purple', budget: 'badge-green',
  };

  const tags = phone.upgrade_tags
    ? phone.upgrade_tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className="phone-card" onClick={go}>
      <div className="phone-card-img-wrap">
        {phone.primary_image_url || phone.image ? (
          <img
            className="phone-card-img"
            src={phone.primary_image_url || phone.image}
            alt={phone.name}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: 80, height: 140,
            background: 'var(--cream-dark)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-faint)', fontSize: '.7rem'
          }}>No image</div>
        )}
        {score > 0 && (
          <div className="phone-card-score-badge">
            <ScoreBadge score={score} size="sm" />
          </div>
        )}
      </div>

      <div className="phone-card-body">
        <div className="phone-card-brand">{phone.brand}</div>
        <div className="phone-card-name">{phone.name}</div>
        {price && (
          <div className="phone-card-price">
            {formatPrice(price)}
            <span className="phone-card-price-sub"> onwards</span>
          </div>
        )}
        {tags.length > 0 && (
          <div className="phone-card-tags">
            {tags.map(tag => (
              <span
                key={tag}
                className={`feature-badge ${tagColors[tag.toLowerCase()] || 'badge-purple'}`}
                style={{ fontSize: '.68rem', padding: '.15rem .5rem' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="phone-card-actions">
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={go}
        >
          View details
        </button>
        <button
          className={`btn btn-sm ${inCompare ? 'btn-coral' : 'btn-secondary'}`}
          onClick={handleCompare}
          title={inCompare ? 'Remove from compare' : 'Add to compare'}
          style={{ padding: '.4rem .6rem' }}
        >
          {inCompare ? '✓' : '+'}
        </button>
      </div>
    </div>
  );
}

// Skeleton version
export function PhoneCardSkeleton() {
  return (
    <div className="phone-card" style={{ cursor: 'default' }}>
      <div className="phone-card-img-wrap">
        <div className="skeleton" style={{ width: 80, height: 140, borderRadius: 12 }} />
      </div>
      <div className="phone-card-body">
        <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 22, width: '60%', borderRadius: 99 }} />
      </div>
      <div className="phone-card-actions" style={{ gap: '.5rem', padding: '0 1.1rem 1.1rem' }}>
        <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 99 }} />
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8 }} />
      </div>
    </div>
  );
}
