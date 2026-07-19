// src/pages/BudgetFinder.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import PhoneCard, { PhoneCardSkeleton } from '../components/PhoneCard';

const USE_CASES = [
  { val: '',         label: 'Any phone',     icon: '📱' },
  { val: 'camera',   label: 'Best camera',   icon: '📷' },
  { val: 'gaming',   label: 'Gaming beast',  icon: '🎮' },
  { val: 'battery',  label: 'Long battery',  icon: '🔋' },
  { val: '5g',       label: '5G phone',      icon: '📶' },
  { val: 'value',    label: 'Best value',    icon: '💰' },
  { val: 'flagship', label: 'Flagship only', icon: '👑' },
];

const QUICK_BUDGETS = [
  { label: 'Under ₹15,000',  min: 0,     max: 15000 },
  { label: '₹15K – ₹25K',   min: 15000, max: 25000 },
  { label: '₹25K – ₹40K',   min: 25000, max: 40000 },
  { label: '₹40K – ₹60K',   min: 40000, max: 60000 },
  { label: '₹60K – ₹1 Lakh',min: 60000, max: 100000 },
  { label: 'Above ₹1 Lakh', min: 100000,max: 500000 },
];

function fmtPrice(v) {
  if (v >= 100000) return '₹' + (v/100000).toFixed(v % 100000 === 0 ? 0 : 1) + 'L';
  if (v >= 1000)   return '₹' + (v/1000).toFixed(0) + 'K';
  return '₹' + v;
}

export default function BudgetFinder({ compareList, onAddCompare }) {
  const [sp, setSp] = useSearchParams();
  const [minVal, setMin] = useState(parseInt(sp.get('min') || '5000'));
  const [maxVal, setMax] = useState(parseInt(sp.get('max') || '40000'));
  const [useCase, setUseCase] = useState(sp.get('use') || '');
  const [phones,  setPhones]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  function find() {
    setLoading(true);
    setSearched(true);
    const p = { status: 1, price_min: minVal, price_max: maxVal, sort: 'score', limit: 12 };
    if (useCase) p.tag = useCase;
    api.phones(p)
      .then(d => setPhones(Array.isArray(d) ? d : (d.phones || [])))
      .catch(() => setPhones([]))
      .finally(() => setLoading(false));
  }

  // Auto-search if params in URL
  useEffect(() => {
    if (sp.get('min') || sp.get('max')) find();
  }, []);

  function applyQuick(b) {
    setMin(b.min); setMax(b.max);
  }

  const uc = USE_CASES.find(u => u.val === useCase) || USE_CASES[0];

  return (
    <div>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '22px var(--pad)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
            <Link to="/">Home</Link> › Budget Finder
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 5 }}>
            Find the best phone for your budget
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 22 }}>
            Set your budget and use case — we'll show you the best-scored phones in that range.
          </p>

          {/* Quick budget pills */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', marginBottom: 8 }}>Quick select</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {QUICK_BUDGETS.map(b => (
                <button
                  key={b.label}
                  onClick={() => applyQuick(b)}
                  style={{
                    padding: '6px 14px', borderRadius: 99,
                    border: '1.5px solid var(--cream3)',
                    background: minVal === b.min && maxVal === b.max ? 'var(--purple)' : 'var(--cream)',
                    color: minVal === b.min && maxVal === b.max ? '#fff' : 'var(--ink2)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Range slider */}
          <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Min Budget</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--purple)' }}>{fmtPrice(minVal)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Max Budget</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--purple)' }}>{fmtPrice(maxVal)}</div>
              </div>
            </div>
            <div style={{ position: 'relative', height: 6, background: 'var(--cream3)', borderRadius: 99, margin: '0 0 12px' }}>
              <div style={{
                position: 'absolute', height: '100%', borderRadius: 99, background: 'var(--purple)',
                left: `${(minVal / 200000) * 100}%`,
                right: `${100 - (maxVal / 200000) * 100}%`,
              }} />
            </div>
            <input type="range" min={0} max={200000} step={1000} value={minVal}
              onChange={e => setMin(Math.min(parseInt(e.target.value), maxVal - 1000))}
              style={{ width: '100%', accentColor: 'var(--purple)', marginBottom: 8 }} />
            <input type="range" min={0} max={200000} step={1000} value={maxVal}
              onChange={e => setMax(Math.max(parseInt(e.target.value), minVal + 1000))}
              style={{ width: '100%', accentColor: 'var(--purple)' }} />
          </div>

          {/* Use case */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', marginBottom: 8 }}>I want the best phone for…</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {USE_CASES.map(u => (
                <button
                  key={u.val}
                  onClick={() => setUseCase(u.val)}
                  style={{
                    padding: '7px 14px', borderRadius: 99,
                    border: '1.5px solid var(--cream3)',
                    background: useCase === u.val ? 'var(--ink)' : 'var(--white)',
                    color: useCase === u.val ? '#fff' : 'var(--ink2)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {u.icon} {u.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={find}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            🔍 Find phones in this range
          </button>
        </div>
      </div>

      {/* Results */}
      {(loading || searched) && (
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '22px var(--pad) 40px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
              {loading ? 'Finding phones…' : `${phones.length} phones found`}
            </h2>
            {!loading && !phones.length ? null : (
              <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
                {fmtPrice(minVal)} – {fmtPrice(maxVal)} · {uc.icon} {uc.label} · Sorted by score
              </p>
            )}
          </div>

          <div className="phone-grid">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <PhoneCardSkeleton key={i} />)
              : phones.length > 0
                ? phones.map(p => (
                    <PhoneCard key={p.id || p.slug} phone={p}
                      onAddCompare={onAddCompare}
                      inCompare={compareList.some(c => c.slug === p.slug)} />
                  ))
                : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--ink3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>😕</div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>No phones found in this range</div>
                    <div style={{ fontSize: 13 }}>Try widening your budget or changing the use case</div>
                  </div>
                )
            }
          </div>
        </div>
      )}
    </div>
  );
}
