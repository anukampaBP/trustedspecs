// src/components/PhoneCard.jsx
import { useNavigate } from 'react-router-dom';
import { ScoreChip } from './ScoreRing';

const TAG_MAP = {
  camera: 'tag-purple', gaming: 'tag-hot', battery: 'tag-green',
  value: 'tag-amber', '5g': 'tag-blue', flagship: 'tag-purple',
  ai: 'tag-purple', design: 'tag-amber',
};

function fmtPrice(p) {
  if (!p) return null;
  return '₹' + parseInt(p).toLocaleString('en-IN');
}

export default function PhoneCard({ phone, onAddCompare, inCompare }) {
  const navigate = useNavigate();
  const score = parseFloat(phone.overall_score) || 0;
  const price = phone.current_price || phone.launch_price_inr || phone.launch_price;
  const tags  = phone.upgrade_tags
    ? phone.upgrade_tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 3)
    : [];
  const img = phone.primary_image_url || phone.primary_image || phone.image || '';

  function goDetail(e) {
    e.stopPropagation();
    navigate('/phones/' + phone.slug);
  }
  function handleCompare(e) {
    e.stopPropagation();
    onAddCompare?.(phone);
  }

  return (
    <div className="phone-card" onClick={goDetail}>
      <div className="phone-card-img">
        {img ? (
          <img
            src={img}
            alt={phone.name}
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className="phone-card-img-placeholder"
          style={{ display: img ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
        >
          📱
        </div>
        {score > 0 && (
          <div className="phone-card-score">
            <ScoreChip score={score} />
          </div>
        )}
      </div>

      <div className="phone-card-body">
        <div className="phone-card-brand">{phone.brand}</div>
        <div className="phone-card-name">{phone.name}</div>
        {price && (
          <div className="phone-card-price">
            {fmtPrice(price)} <span>onwards</span>
          </div>
        )}
        {tags.length > 0 && (
          <div className="phone-card-tags">
            {tags.map(tag => (
              <span key={tag} className={`tag ${TAG_MAP[tag] || 'tag-purple'}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="phone-card-footer">
        <button className="btn-view-detail" onClick={goDetail}>View</button>
        <button
          className={`btn-add-compare ${inCompare ? 'in-compare' : ''}`}
          onClick={handleCompare}
          title={inCompare ? 'Remove from compare' : 'Add to compare'}
        >
          {inCompare ? '✓' : '+'}
        </button>
      </div>
    </div>
  );
}

export function PhoneCardSkeleton() {
  return (
    <div className="phone-card" style={{ cursor: 'default' }}>
      <div className="phone-card-img" style={{ background: 'var(--cream)' }}>
        <div className="skeleton" style={{ width: 80, height: 100, borderRadius: 10 }} />
      </div>
      <div className="phone-card-body">
        <div className="skeleton" style={{ height: 9, width: '40%', marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 18, width: '55%', borderRadius: 99 }} />
      </div>
      <div className="phone-card-footer">
        <div className="skeleton" style={{ flex: 1, height: 28, borderRadius: 99 }} />
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
      </div>
    </div>
  );
}
