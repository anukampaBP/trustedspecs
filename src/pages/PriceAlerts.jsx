// src/pages/PriceAlerts.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function PriceAlerts() {
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [target,  setTarget]  = useState('');
  const [wa,      setWa]      = useState('');
  const [tier,    setTier]    = useState('free');
  const [step,    setStep]    = useState(1); // 1=search, 2=set alert, 3=done
  const [results, setResults] = useState([]);
  const [selected,setSelected]= useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function searchPhone(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const data = await api.search(phone);
      setResults(Array.isArray(data) ? data : (data.phones || []));
    } catch { setError('Search failed. Try again.'); }
    finally { setLoading(false); }
  }

  async function submitAlert(e) {
    e.preventDefault();
    if (!selected || !target) return;
    setLoading(true);
    setError('');
    try {
      await fetch('https://api.trustedspecs.com/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_id:     selected.id,
          phone_slug:   selected.slug,
          email,
          whatsapp:     wa,
          target_price: parseInt(target),
          tier,
        }),
      });
      setStep(3);
    } catch { setError('Failed to set alert. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '20px var(--pad)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
            <Link to="/">Home</Link> › Price Alerts
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 5 }}>
            📉 Price Drop Alerts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink2)' }}>
            Set your target price and we'll notify you the moment a phone drops to that price.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px var(--pad) 40px' }}>

        {/* Tier info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { name: 'Free', val: 'free', price: 'Free', features: ['Email alert', 'Daily check', '3 alerts max'], icon: '📧' },
            { name: 'Pro',  val: 'pro',  price: '₹99/mo', features: ['Instant WhatsApp', 'Hourly check', 'Unlimited alerts'], icon: '⚡', hot: true },
          ].map(t => (
            <div
              key={t.val}
              onClick={() => setTier(t.val)}
              style={{
                padding: '16px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
                border: `2px solid ${tier === t.val ? 'var(--purple)' : 'var(--cream3)'}`,
                background: tier === t.val ? 'var(--purple-pale)' : 'var(--white)',
                transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{t.name}</div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
                  color: t.hot ? 'var(--purple)' : 'var(--ink3)',
                }}>{t.price}</div>
              </div>
              <ul style={{ listStyle: 'none', fontSize: 12, color: 'var(--ink2)' }}>
                {t.features.map(f => <li key={f} style={{ marginBottom: 3 }}>✓ {f}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Step 1: Search phone */}
        {step === 1 && (
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-xl)', padding: 20, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>1. Which phone do you want to track?</div>
            <form onSubmit={searchPhone} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                type="text" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="e.g. OnePlus 13, Samsung S25…"
                style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r)', border: '1.5px solid var(--cream3)', fontSize: 13, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--cream3)'}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? '…' : 'Search'}
              </button>
            </form>
            {results.length > 0 && (
              <div style={{ border: '1px solid var(--cream3)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                {results.slice(0, 5).map(p => (
                  <div
                    key={p.id} onClick={() => { setSelected(p); setStep(2); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderBottom: '1px solid var(--cream3)', cursor: 'pointer',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-pale)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    {(p.primary_image_url || p.image) && (
                      <img src={p.primary_image_url || p.image} alt={p.name}
                        style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{p.brand}</div>
                    </div>
                    {p.launch_price_inr && (
                      <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                        ₹{parseInt(p.launch_price_inr).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Set alert */}
        {step === 2 && selected && (
          <form onSubmit={submitAlert} style={{ background: 'var(--white)', border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-xl)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--purple-pale)', borderRadius: 'var(--r-lg)', marginBottom: 18 }}>
              {(selected.primary_image_url || selected.image) && (
                <img src={selected.primary_image_url || selected.image} alt={selected.name}
                  style={{ width: 40, height: 40, objectFit: 'contain' }} />
              )}
              <div>
                <div style={{ fontWeight: 700 }}>{selected.name}</div>
                <button type="button" onClick={() => { setStep(1); setSelected(null); setResults([]); }}
                  style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600 }}>Change phone</button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', display: 'block', marginBottom: 6 }}>
                Alert me when price drops to
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>₹</span>
                <input
                  type="number" value={target} onChange={e => setTarget(e.target.value)}
                  placeholder="e.g. 50000" required
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 'var(--r)', border: '1.5px solid var(--cream3)', fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                  onBlur={e => e.target.style.borderColor = 'var(--cream3)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', display: 'block', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com" required
                style={{ width: '100%', padding: '9px 13px', borderRadius: 'var(--r)', border: '1.5px solid var(--cream3)', fontSize: 13, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--cream3)'}
              />
            </div>

            {tier === 'pro' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', display: 'block', marginBottom: 6 }}>
                  WhatsApp number (for instant alerts)
                </label>
                <input
                  type="tel" value={wa} onChange={e => setWa(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '9px 13px', borderRadius: 'var(--r)', border: '1.5px solid var(--cream3)', fontSize: 13, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                  onBlur={e => e.target.style.borderColor = 'var(--cream3)'}
                />
              </div>
            )}

            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Setting alert…' : `🔔 Set ${tier === 'pro' ? 'Pro' : 'Free'} Alert`}
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--white)', border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-xl)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Alert set!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink2)', marginBottom: 20 }}>
              We'll notify you when <strong>{selected?.name}</strong> drops to <strong>₹{parseInt(target).toLocaleString('en-IN')}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setStep(1); setSelected(null); setResults([]); setEmail(''); setTarget(''); setWa(''); }}
                className="btn btn-secondary">Set another alert</button>
              <Link to="/" className="btn btn-primary">Back to home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
