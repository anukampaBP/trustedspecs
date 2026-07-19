// src/pages/BrowsePhones.jsx — paginated phone listing with filters + sort
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import PhoneCard, { PhoneCardSkeleton } from '../components/PhoneCard';

const SORT_OPTIONS = [
  { val: 'score',   label: '⭐ Best score' },
  { val: 'newest',  label: '🆕 Newest first' },
  { val: 'price_asc',  label: '₹ Price: low to high' },
  { val: 'price_desc', label: '₹ Price: high to low' },
  { val: 'popular', label: '🔥 Most popular' },
];

const BRANDS = [
  'Samsung','Xiaomi','OnePlus','Realme','Vivo','OPPO',
  'iQOO','Apple','Google','Nothing','Motorola','Nokia',
];

const BUDGET_OPTS = [
  { label: 'All',       val: '' },
  { label: 'Under ₹15K', val: '0-15000' },
  { label: '₹15K–25K',  val: '15000-25000' },
  { label: '₹25K–40K',  val: '25000-40000' },
  { label: '₹40K–60K',  val: '40000-60000' },
  { label: 'Above ₹60K', val: '60000-999999' },
];

const CAT_OPTS = [
  { label: 'All',         val: '' },
  { label: '📷 Camera',   val: 'camera' },
  { label: '🎮 Gaming',   val: 'gaming' },
  { label: '🔋 Battery',  val: 'battery' },
  { label: '📶 5G',       val: '5g' },
  { label: '👑 Flagship', val: 'flagship' },
  { label: '💰 Value',    val: 'value' },
];

const PER_PAGE = 24;

export default function BrowsePhones({ compareList, onAddCompare }) {
  const [params, setParams] = useSearchParams();
  const [phones,  setPhones]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);

  const brand  = params.get('brand') || '';
  const budget = params.get('budget') || '';
  const cat    = params.get('cat') || '';
  const sort   = params.get('sort') || 'score';

  function setParam(key, val) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setParams(next);
    setPage(1);
  }

  useEffect(() => {
    setLoading(true);
    const p = { status: 1, limit: PER_PAGE, offset: (page - 1) * PER_PAGE, sort };
    if (brand)  p.brand  = brand;
    if (budget) { const [min, max] = budget.split('-'); p.price_min = min; p.price_max = max; }
    if (cat)    p.tag    = cat;

    api.phones(p)
      .then(d => {
        const list = Array.isArray(d) ? d : (d.phones || []);
        const tot  = d.total || list.length;
        setPhones(list);
        setTotal(tot);
      })
      .catch(() => setPhones([]))
      .finally(() => setLoading(false));
  }, [brand, budget, cat, sort, page]);

  const pages = Math.ceil(total / PER_PAGE);
  const hasFilters = brand || budget || cat;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '18px var(--pad)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>
            <Link to="/">Home</Link> › All Phones
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                {brand ? `${brand} Phones` : 'All Phones'}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
                {loading ? '…' : `${total} phones`}
                {hasFilters && ' matching your filters'}
              </div>
            </div>
            <select
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
              style={{
                padding: '7px 32px 7px 12px', borderRadius: 'var(--r)',
                border: '1.5px solid var(--cream3)', background: 'var(--cream)',
                fontSize: 13, color: 'var(--ink)', cursor: 'pointer', outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '18px var(--pad) 40px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Sidebar filters */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 12px)' }}>
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>

            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--cream3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Filters</span>
              {hasFilters && (
                <button onClick={() => setParams(new URLSearchParams({ sort }))} style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600 }}>
                  Clear all
                </button>
              )}
            </div>

            {/* Budget */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--cream3)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', marginBottom: 8 }}>Budget</div>
              {BUDGET_OPTS.map(o => (
                <div
                  key={o.val}
                  onClick={() => setParam('budget', o.val)}
                  style={{
                    padding: '5px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                    fontWeight: budget === o.val ? 600 : 400,
                    background: budget === o.val ? 'var(--purple-dim)' : 'transparent',
                    color: budget === o.val ? 'var(--purple)' : 'var(--ink2)',
                    marginBottom: 2,
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>

            {/* Category */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--cream3)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', marginBottom: 8 }}>Best for</div>
              {CAT_OPTS.map(o => (
                <div
                  key={o.val}
                  onClick={() => setParam('cat', o.val)}
                  style={{
                    padding: '5px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                    fontWeight: cat === o.val ? 600 : 400,
                    background: cat === o.val ? 'var(--purple-dim)' : 'transparent',
                    color: cat === o.val ? 'var(--purple)' : 'var(--ink2)',
                    marginBottom: 2,
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>

            {/* Brand */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink3)', marginBottom: 8 }}>Brand</div>
              {BRANDS.map(b => (
                <div
                  key={b}
                  onClick={() => setParam('brand', brand === b ? '' : b)}
                  style={{
                    padding: '5px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                    fontWeight: brand === b ? 600 : 400,
                    background: brand === b ? 'var(--purple-dim)' : 'transparent',
                    color: brand === b ? 'var(--purple)' : 'var(--ink2)',
                    marginBottom: 2,
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phone grid */}
        <div>
          {hasFilters && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {brand && <FilterTag label={brand} onRemove={() => setParam('brand', '')} />}
              {budget && <FilterTag label={BUDGET_OPTS.find(b => b.val === budget)?.label} onRemove={() => setParam('budget', '')} />}
              {cat && <FilterTag label={CAT_OPTS.find(c => c.val === cat)?.label} onRemove={() => setParam('cat', '')} />}
            </div>
          )}

          <div className="phone-grid">
            {loading
              ? Array.from({ length: 12 }, (_, i) => <PhoneCardSkeleton key={i} />)
              : phones.length > 0
                ? phones.map(p => (
                    <PhoneCard key={p.id || p.slug} phone={p}
                      onAddCompare={onAddCompare}
                      inCompare={compareList.some(c => c.slug === p.slug)} />
                  ))
                : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--ink3)' }}>
                    No phones match these filters.
                    <br /><button onClick={() => setParams(new URLSearchParams())} style={{ color: 'var(--purple)', fontWeight: 600, marginTop: 8 }}>Clear all filters</button>
                  </div>
            }
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              {page > 1 && <PagBtn label="← Prev" onClick={() => setPage(p => p - 1)} />}
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const p = pages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i);
                if (p < 1 || p > pages) return null;
                return <PagBtn key={p} label={p} active={p === page} onClick={() => setPage(p)} />;
              })}
              {page < pages && <PagBtn label="Next →" onClick={() => setPage(p => p + 1)} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'var(--purple-dim)', color: 'var(--purple)', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
      {label}
      <span onClick={onRemove} style={{ cursor: 'pointer', fontSize: 11, opacity: .6 }}>✕</span>
    </span>
  );
}

function PagBtn({ label, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 'var(--r)', border: '1.5px solid var(--cream3)',
      background: active ? 'var(--purple)' : 'var(--white)',
      color: active ? '#fff' : 'var(--ink2)',
      fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer',
    }}>{label}</button>
  );
}
