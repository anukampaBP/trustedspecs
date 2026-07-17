import { useState, useEffect, useRef } from 'react'
import * as API from './api.js'

// ── Design tokens ─────────────────────────────────────────────────
// Dark indigo/violet system — see ui-ux-pro-max "Modern Dark (Cinema Mobile)" style + violet color search
const C = {
  bg:'#0F172A', surface:'#192134', surface2:'#131936', border:'rgba(255,255,255,.08)',
  text:'#F8FAFC', muted:'#94A3B8', dim:'#5B6478',
  brand:'#7C3AED', brandSoft:'rgba(124,58,237,.14)', brandBorder:'rgba(124,58,237,.4)', brand2:'#4338CA', brand3:'#6366F1',
  green:'#4ADE80', greenBg:'rgba(74,222,128,.12)', greenBd:'rgba(74,222,128,.3)',
  amber:'#FBBF24', amberBg:'rgba(251,191,36,.12)', amberBd:'rgba(251,191,36,.3)',
  red:'#F87171',   redBg:'rgba(248,113,113,.12)',   redBd:'rgba(248,113,113,.3)',
  blue:'#60A5FA',  blueBg:'rgba(96,165,250,.12)',  blueBd:'rgba(96,165,250,.3)',
  shadow:'0 2px 10px rgba(0,0,0,.35)',
  shadowLg:'0 20px 60px rgba(0,0,0,.5)',
  glow:'0 0 0 1px rgba(124,58,237,.25), 0 8px 30px rgba(124,58,237,.25)',
}

// ── Global CSS ────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', sans-serif; background: ${C.bg}; color: ${C.text}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: #363f57; border-radius: 4px; }
  ::selection { background: ${C.brand}; color: #fff; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes toastIn { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes auroraFloat1 { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(4%,6%,0) scale(1.08)} }
  @keyframes auroraFloat2 { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-5%,-4%,0) scale(1.1)} }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes glowPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes revealUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

  .hover-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1) !important; }
  .hover-lift:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(124,58,237,.3) !important; }

  .tilt-card { transform-style: preserve-3d; will-change: transform; transition: transform .15s cubic-bezier(.16,1,.3,1), box-shadow .25s ease; }

  .reveal { opacity: 0; transform: translateY(28px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
  .reveal.in-view { opacity: 1; transform: translateY(0); }

  input[type=range] { -webkit-appearance:none; height:5px; border-radius:5px; outline:none; cursor:pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:${C.brand}; cursor:pointer; box-shadow:0 2px 12px rgba(124,58,237,.6); border:2px solid #fff; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
    .tilt-card { transform: none !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
  }
`

const mono = { fontFamily: "'JetBrains Mono', monospace" }

// ── Motion primitives ───────────────────────────────────────────────
// 3D tilt-on-hover, driven by mouse position; respects prefers-reduced-motion
function useTilt(strength = 10) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(800px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateZ(6px)`
    }
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)' }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [strength])
  return ref
}

// Scroll-triggered reveal: fades + slides an element up once it enters the viewport
function Reveal({ children, delay = 0, as: Tag = 'div', style, ...rest }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`reveal${inView ? ' in-view' : ''}`}
      style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  )
}

// ── Micro components ──────────────────────────────────────────────
const Tag = ({ c = C.brand, children }) => (
  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:5,
    background:c+'18', color:c, border:`1px solid ${c}28`,
    fontSize:10, fontWeight:700, letterSpacing:.4 }}>{children}</span>
)

const ScorePill = ({ score }) => {
  if (!score) return null
  const s = parseFloat(score)
  const col = s>=8.5?C.green:s>=7.5?C.blue:s>=6?C.amber:C.red
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, ...mono,
    background:col+'18', color:col, border:`1px solid ${col}28`,
    borderRadius:7, padding:'3px 9px', fontSize:12, fontWeight:700 }}>
    <span style={{ width:5,height:5,borderRadius:'50%',background:col,display:'inline-block' }}/>
    {s.toFixed(1)}</span>
}

const QBar = ({ score }) => {
  const s = parseFloat(score) || 0
  const col = s>=8.5?C.green:s>=7?C.blue:s>=5?C.amber:C.red
  return <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div style={{ flex:1, height:5, background:C.surface2, borderRadius:4, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${(s/10)*100}%`, background:col, borderRadius:4,
        transition:'width .7s cubic-bezier(.34,1.56,.64,1)' }} />
    </div>
    <span style={{ ...mono, fontSize:12, fontWeight:600, color:col, minWidth:28 }}>{s.toFixed(1)}</span>
  </div>
}

const Spinner = () => (
  <div style={{ textAlign:'center', padding:60, color:C.muted, fontSize:13 }}>Loading…</div>
)

const ErrMsg = ({ msg }) => (
  <div style={{ textAlign:'center', padding:60, color:C.red, fontSize:13 }}>{msg}</div>
)

// ── Phone card ────────────────────────────────────────────────────
function PhoneCard({ phone, navigate, onCompare, inCompare }) {
  const tiltRef = useTilt(8)
  return (
    <div ref={tiltRef} className="hover-lift tilt-card" onClick={() => navigate('detail', phone)}
      style={{ background:`linear-gradient(160deg, ${C.surface}, ${C.surface2})`,
        border:`1px solid ${C.border}`, borderRadius:14,
        padding:'18px 14px', cursor:'pointer', boxShadow:C.shadow, position:'relative',
        borderTop:`3px solid ${C.brand}` }}>
      <div style={{ textAlign:'center', fontSize:38, margin:'4px 0 10px',
        filter:'drop-shadow(0 6px 14px rgba(124,58,237,.35))' }}>📱</div>
      <div style={{ fontSize:10, color:C.muted, fontWeight:500, marginBottom:2 }}>{phone.brand}</div>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:6 }}>{phone.name}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        {phone.launch_price > 0
          ? <span style={{ ...mono, fontSize:16, fontWeight:800, color:C.brand3 }}>₹{(phone.launch_price/1000).toFixed(0)}K</span>
          : <span style={{ fontSize:12, color:C.dim }}>Price TBA</span>}
        {phone.avg_score && <ScorePill score={phone.avg_score} />}
      </div>
      <button onClick={e=>{ e.stopPropagation(); onCompare(phone) }}
        style={{ width:'100%', padding:'7px', borderRadius:8, fontSize:11, fontWeight:700,
          border:`1px solid ${inCompare?C.green:C.brand}`,
          background:inCompare?C.greenBg:C.brandSoft,
          color:inCompare?C.green:C.brand, cursor:'pointer',
          fontFamily:"'Inter',sans-serif", transition:'all .15s' }}>
        {inCompare ? '✓ In comparison' : '+ Compare'}
      </button>
    </div>
  )
}

// ── Nav ────────────────────────────────────────────────────────────
function Nav({ page, navigate, compareCount }) {
  return (
    <nav style={{ background:'rgba(15,23,42,.72)', backdropFilter:'blur(16px) saturate(160%)',
      WebkitBackdropFilter:'blur(16px) saturate(160%)',
      borderBottom:`1px solid ${C.border}`, padding:'0 24px',
      display:'flex', alignItems:'center', gap:20, height:54, position:'sticky', top:0, zIndex:200,
      boxShadow:'0 1px 20px rgba(0,0,0,.25)' }}>
      <div onClick={()=>navigate('home')} style={{ fontWeight:800, fontSize:17,
        backgroundImage:`linear-gradient(135deg, ${C.brand3}, ${C.brand})`, WebkitBackgroundClip:'text',
        backgroundClip:'text', color:'transparent',
        letterSpacing:-.5, cursor:'pointer' }}>TrustedSpecs</div>
      <div style={{ display:'flex', flex:1, justifyContent:'center', gap:2 }}>
        {[['home','Home'],['budget','Budget Finder'],['games','Games'],['news','News']].map(([p,l])=>(
          <button key={p} onClick={()=>navigate(p)} style={{
            background:'none', border:'none', borderBottom:`2px solid ${page===p?C.brand:'transparent'}`,
            padding:'0 14px', height:54, fontSize:13, fontWeight:500,
            color:page===p?C.brand:C.muted, cursor:'pointer',
            fontFamily:"'Inter',sans-serif", transition:'color .2s ease, border-color .25s cubic-bezier(.16,1,.3,1)' }}>{l}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        {compareCount>0&&(
          <button onClick={()=>navigate('compare')} style={{
            display:'flex', alignItems:'center', gap:6, background:C.brandSoft,
            border:`1px solid ${C.brandBorder}`, borderRadius:8, padding:'6px 14px',
            fontSize:12, fontWeight:700, color:C.brand3, cursor:'pointer',
            fontFamily:"'Inter',sans-serif", transition:'all .2s ease' }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=C.glow}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
            Compare ({compareCount}) →
          </button>
        )}
        <button style={{ background:`linear-gradient(135deg, ${C.brand3}, ${C.brand})`, color:'#fff', border:'none',
          borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700,
          cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'box-shadow .2s ease' }}
          onMouseEnter={e=>e.currentTarget.style.boxShadow=C.glow}
          onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>Alerts</button>
      </div>
    </nav>
  )
}

// ── Footer ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:'#080D1A', padding:'40px 24px 24px', borderTop:`1px solid ${C.border}` }}>
      <div style={{ maxWidth:1060, margin:'0 auto' }}>
        <div style={{ display:'flex', gap:32, justifyContent:'space-between', flexWrap:'wrap', marginBottom:28 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:6 }}>TrustedSpecs</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', maxWidth:220, lineHeight:1.6 }}>
              Real specs. Real quality scores. Honest Indian prices.
            </div>
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:18,
          display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.25)' }}>© 2026 TrustedSpecs</span>
          <div style={{ display:'flex', gap:16 }}>
            {['Privacy','Terms','Affiliate disclosure'].map(l=>(
              <span key={l} style={{ fontSize:11, color:'rgba(255,255,255,.25)', cursor:'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Compare bar ───────────────────────────────────────────────────
function CompareBar({ list, onRemove, onClear, navigate }) {
  if (!list.length) return null
  return (
    <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)',
      background:'rgba(15,20,35,.85)', backdropFilter:'blur(16px) saturate(160%)',
      WebkitBackdropFilter:'blur(16px) saturate(160%)',
      border:`1px solid ${C.border}`, borderRadius:14, padding:'10px 16px',
      display:'flex', alignItems:'center', gap:10, zIndex:500,
      boxShadow:C.shadowLg, maxWidth:'90vw',
      animation:'toastIn .3s cubic-bezier(.34,1.56,.64,1)' }}>
      <span style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:600 }}>Comparing:</span>
      {list.map(p=>(
        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:5,
          background:'rgba(255,255,255,.1)', borderRadius:7, padding:'4px 10px' }}>
          <span style={{ fontSize:11, color:'#fff', fontWeight:600 }}>
            {p.name.split(' ').slice(-2).join(' ')}
          </span>
          <button onClick={()=>onRemove(p.id)} style={{ background:'none', border:'none',
            color:'rgba(255,255,255,.4)', cursor:'pointer', fontSize:13, lineHeight:1, padding:0 }}>×</button>
        </div>
      ))}
      {list.length<3&&<span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>
        +{3-list.length} more</span>}
      <button onClick={()=>navigate('compare')} style={{ background:C.brand, color:'#fff',
        border:'none', borderRadius:7, padding:'7px 16px', fontSize:12, fontWeight:700,
        cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Compare →</button>
      <button onClick={onClear} style={{ background:'none',
        border:'1px solid rgba(255,255,255,.15)', color:'rgba(255,255,255,.4)',
        borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer',
        fontFamily:"'Inter',sans-serif" }}>Clear</button>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone, 2200); return ()=>clearTimeout(t) }, [])
  return (
    <div style={{ position:'fixed', bottom:80, right:20, background:C.surface,
      border:`1px solid ${C.brandBorder}`,
      color:'#fff', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:500,
      boxShadow:C.glow, animation:'toastIn .3s ease', zIndex:600 }}>{msg}</div>
  )
}

// ── PAGE: Home ────────────────────────────────────────────────────
function HomePage({ navigate, addToCompare, compareList }) {
  const [stats, setStats]     = useState(null)
  const [query, setQuery]     = useState('')
  const [sugg, setSugg]       = useState([])
  const [focused, setFocused] = useState(false)
  const [budget, setBudget]   = useState(30000)
  const [budgetPhones, setBudgetPhones] = useState([])
  const ref = useRef()

  useEffect(() => {
    API.getStats().then(setStats).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!query || query.length < 2) { setSugg([]); return }
    const t = setTimeout(() => {
      API.searchPhones(query).then(r => setSugg(r.results || [])).catch(()=>setSugg([]))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    API.getBudget({ max: budget, limit: 4 })
      .then(r => setBudgetPhones(r.phones || []))
      .catch(() => {})
  }, [budget])

  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setFocused(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>
      {/* Ticker */}
      <div style={{ background:C.brand, overflow:'hidden', height:30, display:'flex', alignItems:'center' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,.6)', fontWeight:700,
          letterSpacing:1, padding:'0 14px', flexShrink:0 }}>LIVE</div>
        <div style={{ overflow:'hidden', flex:1 }}>
          <div style={{ display:'flex', gap:32, whiteSpace:'nowrap', animation:'ticker 20s linear infinite' }}>
            {['📦 Xiaomi 15 Ultra India launch confirmed','💰 OnePlus 13 price drop ₹5K',
              '🏆 iQOO 13 still gaming king at 6 months','🔥 Best under ₹25K — July 2026',
              '📦 Xiaomi 15 Ultra India launch confirmed','💰 OnePlus 13 price drop ₹5K',
              '🏆 iQOO 13 still gaming king at 6 months','🔥 Best under ₹25K — July 2026',
            ].map((s,i)=>(
              <span key={i} style={{ fontSize:11, color:'rgba(255,255,255,.85)', padding:'0 16px',
                borderLeft:'1px solid rgba(255,255,255,.2)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section style={{ position:'relative', overflow:'hidden',
        background:`radial-gradient(ellipse 90% 60% at 50% -10%, ${C.brandSoft}, ${C.bg} 70%)`,
        padding:'72px 24px 76px', textAlign:'center' }}>
        {/* Aurora blobs (decorative, ignored under reduced-motion) */}
        <div aria-hidden="true" style={{ position:'absolute', top:-140, left:'6%', width:440, height:440,
          borderRadius:'50%', background:`radial-gradient(circle, ${C.brand}4d, transparent 70%)`,
          filter:'blur(30px)', animation:'auroraFloat1 16s ease-in-out infinite', pointerEvents:'none' }}/>
        <div aria-hidden="true" style={{ position:'absolute', top:-80, right:'4%', width:380, height:380,
          borderRadius:'50%', background:`radial-gradient(circle, ${C.brand3}40, transparent 70%)`,
          filter:'blur(30px)', animation:'auroraFloat2 19s ease-in-out infinite', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
        <h1 style={{ fontSize:'clamp(26px,5vw,50px)', fontWeight:800, color:C.text,
          letterSpacing:-1.5, lineHeight:1.15, marginBottom:14, animation:'revealUp .7s cubic-bezier(.16,1,.3,1) both' }}>
          The phone comparison site<br/>
          <span style={{ backgroundImage:`linear-gradient(135deg, ${C.brand3}, ${C.brand})`,
            WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>that actually tells the truth.</span>
        </h1>
        <p style={{ fontSize:14, color:C.muted, maxWidth:460, margin:'0 auto 32px', lineHeight:1.7,
          animation:'revealUp .7s cubic-bezier(.16,1,.3,1) .1s both' }}>
          We watch 10 YouTube reviews per phone so you don't have to.
          Specs + real-world quality + live Indian prices.
        </p>

        {/* Search */}
        <div ref={ref} style={{ position:'relative', maxWidth:540, margin:'0 auto 20px' }}>
          <div style={{ display:'flex' }}>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder='Search "Galaxy S25", "best gaming under ₹30K"…'
              style={{ flex:1, padding:'14px 18px', fontSize:13, border:`1.5px solid ${C.border}`,
                borderRight:'none', borderRadius:'10px 0 0 10px', outline:'none',
                fontFamily:"'Inter',sans-serif", background:C.surface, color:C.text }}
              onFocus={e=>{ setFocused(true); e.target.style.borderColor=C.brand }}
              onBlur={e=>e.target.style.borderColor=C.border}/>
            <button style={{ background:C.brand, color:'#fff', border:'none',
              borderRadius:'0 10px 10px 0', padding:'0 24px', fontSize:13, fontWeight:700,
              cursor:'pointer' }}>Search</button>
          </div>
          {focused && sugg.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 5px)', left:0, right:0,
              background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
              overflow:'hidden', boxShadow:C.shadowLg, zIndex:300, animation:'slideDown .15s ease' }}>
              {sugg.map(p=>(
                <div key={p.id} onClick={()=>{ navigate('detail', p); setFocused(false); setQuery('') }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.brandSoft}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:18 }}>📱</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{p.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>
                      {p.launch_price > 0 ? `₹${p.launch_price.toLocaleString('en-IN')}` : 'Price TBA'}
                    </div>
                  </div>
                  <button onClick={e=>{ e.stopPropagation(); addToCompare(p) }}
                    style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6,
                      border:`1px solid ${C.brand}`, background:'transparent', color:C.brand,
                      cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>+Compare</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display:'flex', gap:28, justifyContent:'center', marginTop:32, flexWrap:'wrap' }}>
            {[[stats.phones,'Phones reviewed'],[stats.brands,'Brands covered'],['Live','Indian pricing'],['Free','No account needed']].map(([n,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ ...mono, fontSize:20, fontWeight:800, color:C.brand3 }}>{n}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Floating 3D phone showcase */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:60, perspective:1400 }}>
          {[{r:-13,y:10,dur:6,delay:0},{r:0,y:-16,dur:7,delay:.5},{r:13,y:10,dur:6.5,delay:1}].map((p,i)=>(
            <div key={i} style={{
              width:110, height:220, margin:'0 -16px', borderRadius:22,
              background:`linear-gradient(160deg, ${C.surface}, ${C.surface2})`,
              border:`1px solid ${C.border}`, boxShadow: i===1 ? C.glow : C.shadow,
              transform:`rotate(${p.r}deg)`,
              animation:`floatY ${p.dur}s ease-in-out ${p.delay}s infinite`,
              zIndex: i===1 ? 2 : 1, position:'relative',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>📱</div>
          ))}
        </div>
        </div>
      </section>

      {/* Budget Explorer Preview */}
      <section style={{ padding:'56px 24px', background:C.surface, borderBottom:`1px solid ${C.border}` }}>
        <Reveal style={{ maxWidth:1060, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.brand, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Budget Explorer</div>
              <h2 style={{ fontSize:'clamp(20px,3vw,30px)', fontWeight:800, color:C.text, letterSpacing:-.5, marginBottom:12 }}>
                What's the best phone for your money?
              </h2>
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:C.muted }}>Your budget</span>
                  <span style={{ ...mono, fontSize:18, fontWeight:800, color:C.brand }}>
                    ₹{budget >= 100000 ? '1L+' : `${(budget/1000).toFixed(0)}K`}
                  </span>
                </div>
                <input type="range" min="10000" max="120000" step="1000"
                  value={budget} onChange={e=>setBudget(Number(e.target.value))}
                  style={{ width:'100%', background:`linear-gradient(to right,${C.brand} ${((budget-10000)/110000)*100}%,${C.border} ${((budget-10000)/110000)*100}%)` }}/>
              </div>
              <button onClick={()=>navigate('budget')} style={{ background:C.brand, color:'#fff',
                border:'none', borderRadius:10, padding:'11px 26px', fontSize:13, fontWeight:700,
                cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Open Budget Finder →</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {budgetPhones.slice(0,4).map((p,i)=>(
                <div key={p.id} className="hover-lift" onClick={()=>navigate('detail',p)}
                  style={{ background:C.bg, border:`1px solid ${i===0?C.greenBd:C.border}`,
                    borderRadius:12, padding:14, cursor:'pointer', boxShadow:C.shadow,
                    gridColumn:i===0?'1/-1':'auto' }}>
                  {i===0&&<div style={{ fontSize:10, fontWeight:700, color:C.green, marginBottom:4 }}>🏆 BEST PICK</div>}
                  <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:4 }}>{p.name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ ...mono, fontSize:14, fontWeight:800, color:C.brand }}>
                      {p.launch_price > 0 ? `₹${(p.launch_price/1000).toFixed(0)}K` : 'TBA'}
                    </span>
                    {p.avg_score && <ScorePill score={p.avg_score}/>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trending */}
      {stats?.trending?.length > 0 && (
        <section style={{ padding:'56px 24px', background:C.bg }}>
          <div style={{ maxWidth:1060, margin:'0 auto' }}>
            <Reveal style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
              <h2 style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:800, color:C.text }}>Trending phones</h2>
              <button onClick={()=>navigate('budget')} style={{ background:'none', border:`1px solid ${C.border}`,
                borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, color:C.brand3,
                cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>See all →</button>
            </Reveal>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12 }}>
              {stats.trending.map((p,i)=>(
                <Reveal key={p.id} delay={i*40}>
                  <PhoneCard phone={p} navigate={navigate}
                    onCompare={addToCompare} inCompare={!!compareList.find(c=>c.id===p.id)}/>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// ── PAGE: Budget ──────────────────────────────────────────────────
function BudgetPage({ navigate, addToCompare, compareList }) {
  const [budget, setBudget]   = useState(35000)
  const [useCase, setUseCase] = useState('all')
  const [phones, setPhones]   = useState([])
  const [loading, setLoading] = useState(false)
  const CASES = [['all','🔍 All'],['gaming','🎮 Gaming'],['camera','📷 Camera'],['battery','🔋 Battery'],['value','💰 Value']]

  useEffect(() => {
    setLoading(true)
    API.getBudget({ max: budget, usecase: useCase, limit: 20 })
      .then(r => setPhones(r.phones || []))
      .catch(() => setPhones([]))
      .finally(() => setLoading(false))
  }, [budget, useCase])

  return (
    <div style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px', animation:'fadeUp .35s ease' }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,30px)', fontWeight:800, color:C.text, marginBottom:8 }}>Budget Finder</h1>
      <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Best phones sorted by real-world quality, not just specs.</p>
      <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.muted }}>Budget</span>
            <span style={{ ...mono, fontSize:22, fontWeight:800, color:C.brand }}>
              ₹{budget>=100000?'1L+':`${(budget/1000).toFixed(0)}K`}
            </span>
          </div>
          <input type="range" min="10000" max="120000" step="1000" value={budget}
            onChange={e=>setBudget(Number(e.target.value))}
            style={{ width:'100%', background:`linear-gradient(to right,${C.brand} ${((budget-10000)/110000)*100}%,${C.border} ${((budget-10000)/110000)*100}%)` }}/>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {CASES.map(([k,l])=>(
            <button key={k} onClick={()=>setUseCase(k)} style={{
              padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600,
              border:`1px solid ${useCase===k?C.brand:C.border}`,
              background:useCase===k?C.brandSoft:'transparent',
              color:useCase===k?C.brand:C.muted, cursor:'pointer',
              fontFamily:"'Inter',sans-serif", transition:'all .15s' }}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? <Spinner/> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {phones.map((p,i)=>(
            <div key={p.id} style={{ animation:`fadeUp .3s ease ${i*.04}s both` }}>
              <PhoneCard phone={p} navigate={navigate} onCompare={addToCompare}
                inCompare={!!compareList.find(c=>c.id===p.id)}/>
            </div>
          ))}
          {!phones.length && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:C.muted }}>
            No phones found. Try raising the budget.
          </div>}
        </div>
      )}
    </div>
  )
}

// ── PAGE: Compare ──────────────────────────────────────────────────
function ComparePage({ compareList, setCompareList, navigate, addToCompare }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]       = useState('specs')

  useEffect(() => {
    if (!compareList.length) return
    setLoading(true)
    API.getCompare(compareList.map(p=>p.id))
      .then(setData)
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [compareList.map(p=>p.id).join(',')])

  const phones = data?.phones || compareList
  const COL    = phones.length

  if (!compareList.length) return (
    <div style={{ textAlign:'center', padding:80, color:C.muted }}>
      <div style={{ fontSize:36, marginBottom:12 }}>⚖️</div>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>Nothing to compare yet</div>
      <div style={{ fontSize:13, marginBottom:20 }}>Add phones from the search or budget finder.</div>
      <button onClick={()=>navigate('home')} style={{ background:C.brand, color:'#fff', border:'none',
        borderRadius:10, padding:'11px 28px', fontSize:13, fontWeight:700, cursor:'pointer',
        fontFamily:"'Inter',sans-serif" }}>Browse phones →</button>
    </div>
  )

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px', animation:'fadeUp .35s ease' }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:C.text, marginBottom:20 }}>Compare phones</h1>
      {loading && <Spinner/>}

      {/* Phone cards */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${COL},1fr)`, gap:12, marginBottom:20 }}>
        {phones.map(p=>(
          <div key={p.id} style={{ background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:14, padding:'18px 14px', boxShadow:C.shadow, position:'relative',
            borderTop:`3px solid ${C.brand}` }}>
            <button onClick={()=>setCompareList(l=>l.filter(x=>x.id!==p.id))}
              style={{ position:'absolute', top:10, right:10, background:'none',
                border:`1px solid ${C.border}`, color:C.muted, width:22, height:22,
                borderRadius:5, cursor:'pointer', fontSize:12 }}>×</button>
            <div style={{ fontSize:36, textAlign:'center', margin:'4px 0 10px' }}>📱</div>
            <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>{p.brand}</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>{p.name}</div>
            {p.launch_price > 0 && (
              <div style={{ ...mono, fontSize:18, fontWeight:800, color:C.brand, marginBottom:8 }}>
                ₹{(p.launch_price/1000).toFixed(0)}K
              </div>
            )}
            <a href="#" style={{ display:'block', background:C.green, color:'#fff', borderRadius:8,
              padding:'8px', textAlign:'center', fontSize:11, fontWeight:700, textDecoration:'none' }}>Buy →</a>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
        {['specs','quality'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:'none', border:'none', borderBottom:`2px solid ${tab===t?C.brand:'transparent'}`,
            padding:'9px 18px', fontSize:13, fontWeight:tab===t?700:500,
            color:tab===t?C.brand:C.muted, cursor:'pointer',
            fontFamily:"'Inter',sans-serif", textTransform:'capitalize',
            transition:'color .15s' }}>{t==='quality'?'Real-world quality':t}</button>
        ))}
      </div>

      {/* Quality scores */}
      {tab==='quality' && data?.quality && (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${COL},1fr)`, gap:14 }}>
          {phones.map(p=>{
            const q = data.quality[p.id] || {}
            return (
              <div key={p.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>{p.name}</div>
                {Object.entries(q).map(([cat, row])=>(
                  <div key={cat} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{cat}</div>
                    <QBar score={row.cs}/>
                  </div>
                ))}
                {!Object.keys(q).length && <div style={{ color:C.muted, fontSize:12 }}>Not yet rated</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Basic specs */}
      {tab==='specs' && !data && (
        <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:40 }}>
          Spec data loads from API once phones are added to the database.
        </div>
      )}
    </div>
  )
}

// ── PAGE: Phone Detail ─────────────────────────────────────────────
function PhoneDetailPage({ phone: initialPhone, navigate, addToCompare, compareList }) {
  const [data, setData]   = useState(null)
  const [tab, setTab]     = useState('overview')
  const [loading, setLoading] = useState(true)
  const inCompare = !!compareList.find(c=>c.id===initialPhone.id)

  useEffect(() => {
    API.getPhone(initialPhone.slug)
      .then(setData)
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [initialPhone.slug])

  const phone   = data?.phone   || initialPhone
  const specs   = data?.specs   || {}
  const quality = data?.quality || {}
  const prices  = data?.prices  || []
  const QD = [
    {id:'dayCam',l:'Daytime Camera',i:'☀️'},{id:'nightCam',l:'Night Camera',i:'🌙'},
    {id:'video',l:'Video',i:'🎬'},{id:'gaming',l:'Gaming',i:'🎮'},
    {id:'battery',l:'Battery Life',i:'🔋'},{id:'speaker',l:'Speaker',i:'🔊'},
    {id:'call',l:'Call Quality',i:'📞'},{id:'software',l:'Software',i:'💻'},
  ]

  return (
    <div style={{ animation:'fadeUp .35s ease' }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 24px' }}>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'flex', gap:6, fontSize:12, color:C.muted }}>
          <span onClick={()=>navigate('home')} style={{ cursor:'pointer', color:C.brand }}>Home</span>
          <span>/</span>
          <span onClick={()=>navigate('budget')} style={{ cursor:'pointer', color:C.brand }}>Phones</span>
          <span>/</span>
          <span style={{ color:C.text, fontWeight:500 }}>{phone.name}</span>
        </div>
      </div>
      <div style={{ maxWidth:1060, margin:'0 auto', padding:'28px 24px' }}>
        {loading ? <Spinner/> : (
          <>
            {/* Hero */}
            <div style={{ display:'grid', gridTemplateColumns:'180px 1fr 260px', gap:24, marginBottom:24,
              background:C.surface, borderRadius:16, padding:'24px',
              border:`1px solid ${C.border}`, boxShadow:C.shadow, borderTop:`4px solid ${C.brand}` }}>
              <div style={{ textAlign:'center', fontSize:70, display:'flex', alignItems:'center', justifyContent:'center' }}>📱</div>
              <div>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:4 }}>{phone.brand}</div>
                <h1 style={{ fontSize:'clamp(18px,3vw,26px)', fontWeight:800, color:C.text, letterSpacing:-.5, marginBottom:10 }}>{phone.name}</h1>
                {phone.launch_price > 0 && (
                  <div style={{ ...mono, fontSize:26, fontWeight:800, color:C.brand, marginBottom:8 }}>
                    ₹{phone.launch_price.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
              <div style={{ background:C.bg, borderRadius:12, padding:16 }}>
                {prices.length > 0 ? prices.slice(0,2).map(pr=>(
                  <div key={pr.source} style={{ marginBottom:8, padding:'10px 12px',
                    background:C.surface, borderRadius:8, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:2, textTransform:'capitalize' }}>{pr.source}</div>
                    <div style={{ ...mono, fontSize:18, fontWeight:800, color:C.green }}>₹{pr.price.toLocaleString('en-IN')}</div>
                    {pr.affiliate_url && (
                      <a href={pr.affiliate_url} target="_blank" rel="noopener noreferrer"
                        onClick={()=>API.trackClick(phone.id, pr.source, 'detail')}
                        style={{ display:'block', marginTop:6, background:C.green, color:'#fff',
                          borderRadius:6, padding:'6px', textAlign:'center', fontSize:11,
                          fontWeight:700, textDecoration:'none' }}>Buy →</a>
                    )}
                  </div>
                )) : (
                  <div>
                    {phone.affiliate_amazon && (
                      <a href={phone.affiliate_amazon} target="_blank" rel="noopener noreferrer"
                        style={{ display:'block', marginBottom:8, background:C.green, color:'#fff',
                          borderRadius:9, padding:10, textAlign:'center', fontSize:12,
                          fontWeight:700, textDecoration:'none' }}>Buy on Amazon →</a>
                    )}
                    {phone.affiliate_flipkart && (
                      <a href={phone.affiliate_flipkart} target="_blank" rel="noopener noreferrer"
                        style={{ display:'block', background:C.brand, color:'#fff', borderRadius:9,
                          padding:10, textAlign:'center', fontSize:12, fontWeight:700, textDecoration:'none' }}>Flipkart →</a>
                    )}
                  </div>
                )}
                <button onClick={()=>addToCompare(phone)} style={{
                  width:'100%', marginTop:8, background:inCompare?C.greenBg:C.brandSoft,
                  color:inCompare?C.green:C.brand, border:`1px solid ${inCompare?C.greenBd:C.brandBorder}`,
                  borderRadius:9, padding:9, fontSize:12, fontWeight:700, cursor:'pointer',
                  fontFamily:"'Inter',sans-serif" }}>
                  {inCompare?'✓ In comparison':'+ Add to compare'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
              {['overview','quality','specs'].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{
                  background:'none', border:'none', borderBottom:`2px solid ${tab===t?C.brand:'transparent'}`,
                  padding:'10px 18px', fontSize:13, fontWeight:tab===t?700:500,
                  color:tab===t?C.brand:C.muted, cursor:'pointer',
                  fontFamily:"'Inter',sans-serif", textTransform:'capitalize',
                  transition:'color .15s' }}>{t==='quality'?'Real-world quality':t}</button>
              ))}
            </div>

            {/* Overview */}
            {tab==='overview' && (
              <div style={{ animation:'fadeIn .3s ease' }}>
                {Object.keys(quality).length > 0 ? (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>Real-world quality</div>
                    {QD.map(d => quality[d.id] ? (
                      <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:13, width:20 }}>{d.i}</span>
                        <span style={{ fontSize:12, color:C.muted, width:120 }}>{d.l}</span>
                        <div style={{ flex:1 }}><QBar score={quality[d.id].cs}/></div>
                      </div>
                    ) : null)}
                    {Object.entries(quality).map(([cat, row]) => (
                      <div key={cat} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:12, color:C.muted, width:140 }}>{cat}</span>
                        <div style={{ flex:1 }}><QBar score={row.cs}/></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background:C.brandSoft, border:`1px solid ${C.brandBorder}`, borderRadius:12, padding:18, marginBottom:16 }}>
                    <div style={{ fontSize:13, color:C.brand }}>Quality scores not yet added for this phone. Our team reviews 8-12 YouTube reviews before scoring.</div>
                  </div>
                )}
              </div>
            )}

            {/* Quality */}
            {tab==='quality' && (
              <div style={{ animation:'fadeIn .3s ease' }}>
                {Object.entries(quality).map(([cat, row])=>(
                  <div key={cat} style={{ background:C.surface, border:`1px solid ${C.border}`,
                    borderRadius:10, padding:'14px 18px', marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{cat}</div>
                      <ScorePill score={row.cs}/>
                    </div>
                    <QBar score={row.cs}/>
                    {row.reviewer_notes && (
                      <div style={{ fontSize:12, color:C.muted, marginTop:8, lineHeight:1.6 }}>{row.reviewer_notes}</div>
                    )}
                  </div>
                ))}
                {!Object.keys(quality).length && <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:40 }}>Quality scores not yet added.</div>}
              </div>
            )}

            {/* Specs */}
            {tab==='specs' && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', animation:'fadeIn .3s ease' }}>
                {Object.entries(specs).map(([cat, rows])=>(
                  <div key={cat}>
                    <div style={{ padding:'9px 18px', background:C.bg, borderBottom:`1px solid ${C.border}`,
                      fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:'uppercase' }}>{cat}</div>
                    {rows.map(row=>(
                      <div key={row.parameter} style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
                        <div style={{ width:200, padding:'11px 18px', fontSize:12, color:C.muted,
                          fontWeight:500, borderRight:`1px solid ${C.border}`, flexShrink:0 }}>{row.parameter}</div>
                        <div style={{ padding:'11px 16px', fontSize:12, fontWeight:500, color:C.text }}>
                          {row.answer}
                          {row.speculated ? <span style={{ marginLeft:6, fontSize:9, color:C.amber }}>~estimated</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                {!Object.keys(specs).length && <div style={{ padding:40, textAlign:'center', color:C.muted, fontSize:13 }}>Specs not yet entered.</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── PAGE: Games ───────────────────────────────────────────────────
function GamesPage() {
  const [revealed, setRevealed]     = useState(1)
  const [mystery, setMystery]       = useState(null)
  const [guess, setGuess]           = useState('')
  const [priceGuess, setPriceGuess] = useState('')
  const [priceShown, setPriceShown] = useState(false)

  useEffect(()=>{ API.getMystery(0).then(setMystery).catch(()=>{}) }, [])

  const revealMore = () => {
    const next = revealed + 1
    setRevealed(next)
    API.getMystery(next).then(setMystery).catch(()=>{})
  }

  return (
    <div style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px', animation:'fadeUp .35s ease' }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:C.text, marginBottom:8 }}>Phone Games</h1>
      <p style={{ fontSize:13, color:C.muted, marginBottom:32 }}>Learn what specs actually matter — without reading a boring article.</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
        {/* Mystery Phone */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'22px 18px', boxShadow:C.shadow }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.brand, letterSpacing:1, marginBottom:6 }}>DAILY</div>
          <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:8 }}>🕵️ Mystery Phone</div>
          <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>Specs revealed one at a time. Guess the phone.</p>
          {mystery ? (
            <>
              <div style={{ background:C.bg, borderRadius:10, padding:12, marginBottom:12 }}>
                {mystery.clues.map((c,i)=>(
                  <div key={i} style={{ padding:'7px 10px', borderRadius:6, marginBottom:4,
                    background:c.reveal?C.greenBg:C.amberBg,
                    border:`1px solid ${c.reveal?C.greenBd:C.amberBd}`,
                    fontSize:11, color:c.reveal?C.green:C.amber }}>
                    {i+1}. {c.reveal ? `${c.label}: ${c.value}` : `${c.label}: ???`}
                  </div>
                ))}
              </div>
              {mystery.answer ? (
                <div style={{ background:C.greenBg, border:`1px solid ${C.greenBd}`, borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.green }}>It was: {mystery.answer.name}!</div>
                </div>
              ) : revealed < mystery.total_clues ? (
                <button onClick={revealMore} style={{ width:'100%', background:C.brand, color:'#fff', border:'none',
                  borderRadius:9, padding:10, fontSize:12, fontWeight:700, cursor:'pointer',
                  fontFamily:"'Inter',sans-serif" }}>Reveal clue {revealed+1}</button>
              ) : (
                <div style={{ display:'flex', gap:6 }}>
                  <input value={guess} onChange={e=>setGuess(e.target.value)} placeholder="Your guess…"
                    style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 10px',
                      fontSize:12, outline:'none', fontFamily:"'Inter',sans-serif" }}/>
                  <button onClick={revealMore} style={{ background:C.brand, color:'#fff', border:'none',
                    borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                    fontFamily:"'Inter',sans-serif" }}>Go</button>
                </div>
              )}
            </>
          ) : <Spinner/>}
        </div>

        {/* Guess the Price */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'22px 18px', boxShadow:C.shadow }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.amber, letterSpacing:1, marginBottom:6 }}>QUICK PLAY</div>
          <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:8 }}>💰 Guess the Price</div>
          <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>We show specs, you guess the launch price.</p>
          <div style={{ background:C.bg, borderRadius:10, padding:12, marginBottom:12 }}>
            {['6.82" LTPO AMOLED 144Hz','Snapdragon 8 Elite','6150mAh 120W wired','Triple 50MP cameras'].map(s=>(
              <div key={s} style={{ background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:6, padding:'5px 9px', marginBottom:4, fontSize:11, color:C.text }}>{s}</div>
            ))}
          </div>
          {!priceShown ? (
            <div style={{ display:'flex', gap:6 }}>
              <input value={priceGuess} onChange={e=>setPriceGuess(e.target.value)} placeholder="₹ your guess"
                style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 10px',
                  fontSize:12, outline:'none', fontFamily:"'Inter',sans-serif" }}/>
              <button onClick={()=>setPriceShown(true)} style={{ background:C.amber, color:'#fff', border:'none',
                borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                fontFamily:"'Inter',sans-serif" }}>Go</button>
            </div>
          ) : (
            <div style={{ background:C.greenBg, border:`1px solid ${C.greenBd}`, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.green }}>Actual: ₹54,999</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>iQOO 13</div>
              <button onClick={()=>{ setPriceShown(false); setPriceGuess('') }}
                style={{ marginTop:8, background:'none', border:'none', color:C.brand, fontSize:11, fontWeight:600, cursor:'pointer' }}>Next →</button>
            </div>
          )}
        </div>

        {/* Spec or Bluff */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'22px 18px', boxShadow:C.shadow }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.red, letterSpacing:1, marginBottom:6 }}>TRIVIA</div>
          <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:8 }}>🃏 Spec or Bluff</div>
          <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>Three facts about a phone. One is false. Spot it.</p>
          <div style={{ background:C.bg, borderRadius:10, padding:10, marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:8 }}>Samsung Galaxy S25 — which is false?</div>
            {[['50MP f/1.8 main + 12MP ultra + 10MP tele',false],['4500mAh battery with 45W charging',true],['IP68 dust & water resistance',false]].map(([f,bluff],i)=>(
              <button key={i} style={{ width:'100%', display:'block', marginBottom:5, padding:'8px 10px',
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:7,
                fontSize:11, color:C.text, cursor:'pointer', fontFamily:"'Inter',sans-serif", textAlign:'left',
                transition:'all .15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=bluff?C.redBg:C.greenBg; e.currentTarget.style.color=bluff?C.red:C.green }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.surface; e.currentTarget.style.color=C.text }}>
                {String.fromCharCode(65+i)}. {f}
              </button>
            ))}
          </div>
          <div style={{ fontSize:10, color:C.muted, textAlign:'center', fontStyle:'italic' }}>Hover to reveal</div>
        </div>
      </div>
    </div>
  )
}

// ── PAGE: News ─────────────────────────────────────────────────────
function NewsPage({ navigate }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(()=>{
    API.getArticles({ limit:12 })
      .then(r=>setArticles(r.articles || []))
      .catch(()=>setArticles([]))
      .finally(()=>setLoading(false))
  }, [])

  // Fallback static articles when DB has none yet
  const fallback = [
    { type:'📦 Launch', title:'Xiaomi 15 Ultra confirmed for India — 200MP, 5500mAh, SD 8 Elite Gen 2', published_at:'2026-07-04', read_time_mins:3 },
    { type:'💰 Price Drop', title:'OnePlus 13 drops ₹5,000 ahead of OnePlus 14 launch', published_at:'2026-07-04', read_time_mins:2 },
    { type:'🏆 Review', title:'iQOO 13 six-month real-world review: still India\'s gaming king?', published_at:'2026-07-03', read_time_mins:6 },
    { type:'📊 Roundup', title:'Best phones under ₹25,000 — July 2026 ranking with quality scores', published_at:'2026-07-02', read_time_mins:5 },
  ]

  const display = articles.length ? articles : fallback

  return (
    <div style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px', animation:'fadeUp .35s ease' }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:C.text, marginBottom:8 }}>News & Analysis</h1>
      {loading ? <Spinner/> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginTop:20 }}>
          {display.map((a,i)=>(
            <div key={i} className="hover-lift" style={{ background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:14, padding:20, cursor:'pointer', boxShadow:C.shadow,
              borderLeft:`4px solid ${C.brand}`, animation:`fadeUp .35s ease ${i*.06}s both` }}>
              <div style={{ fontSize:10, fontWeight:700, background:C.brandSoft, color:C.brand,
                display:'inline-block', padding:'2px 8px', borderRadius:5, marginBottom:10 }}>{a.type}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, lineHeight:1.45, marginBottom:10 }}>{a.title}</div>
              <div style={{ display:'flex', gap:10, fontSize:11, color:C.muted }}>
                <span>{a.published_at?.slice(0,10)}</span>
                {a.read_time_mins && <><span>·</span><span>{a.read_time_mins} min read</span></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]             = useState('home')
  const [pageData, setPageData]     = useState(null)
  const [compareList, setCompareList] = useState([])
  const [toast, setToast]           = useState(null)

  const navigate = (p, data = null) => {
    setPage(p)
    setPageData(data)
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const addToCompare = (phone) => {
    if (compareList.find(p=>p.id===phone.id)) { setToast(`${phone.name.split(' ').slice(-2).join(' ')} already added`); return }
    if (compareList.length >= 3) { setToast('Max 3 phones'); return }
    setCompareList(l=>[...l, phone])
    setToast(`${phone.name.split(' ').slice(-2).join(' ')} added`)
  }

  const removeFromCompare = (id) => setCompareList(l=>l.filter(p=>p.id!==id))

  return (
    <>
      <style>{css}</style>
      <Nav page={page} navigate={navigate} compareCount={compareList.length}/>
      {page==='home'    && <HomePage navigate={navigate} addToCompare={addToCompare} compareList={compareList}/>}
      {page==='budget'  && <BudgetPage navigate={navigate} addToCompare={addToCompare} compareList={compareList}/>}
      {page==='compare' && <ComparePage compareList={compareList} setCompareList={setCompareList} navigate={navigate} addToCompare={addToCompare}/>}
      {page==='detail'  && pageData && <PhoneDetailPage phone={pageData} navigate={navigate} addToCompare={addToCompare} compareList={compareList}/>}
      {page==='games'   && <GamesPage/>}
      {page==='news'    && <NewsPage navigate={navigate}/>}
      <Footer/>
      <CompareBar list={compareList} onRemove={removeFromCompare} onClear={()=>setCompareList([])} navigate={navigate}/>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  )
}
