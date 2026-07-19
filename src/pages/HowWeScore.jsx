// src/pages/HowWeScore.jsx
import { Link } from 'react-router-dom';

const DIMS = [
  {
    icon: '☀️', name: 'Daytime Camera', score_range: '0–10',
    what: 'We evaluate sharpness, colour accuracy, dynamic range, and detail retention in good lighting conditions.',
    how: 'We watch 5–10 YouTube reviews per phone, specifically looking at camera comparison segments and outdoor shooting samples.',
    weight: 'High',
  },
  {
    icon: '🌙', name: 'Night Camera', score_range: '0–10',
    what: 'Low-light performance including noise handling, AI processing, brightness boost, and detail preservation.',
    how: 'Night mode samples, indoor low-light tests, and street photography comparisons from multiple reviewers.',
    weight: 'High',
  },
  {
    icon: '🎬', name: 'Video', score_range: '0–10',
    what: 'Video stabilisation, 4K quality, colour science in video, audio quality, and slow-motion capability.',
    how: 'Walking videos, low-light video, and stabilisation tests from YouTube reviews.',
    weight: 'Medium',
  },
  {
    icon: '🎮', name: 'Gaming', score_range: '0–10',
    what: 'Sustained frame rates in heavy games, heat management over 30 minutes, GPU benchmark performance.',
    how: 'Gaming-specific reviews, throttling tests, and benchmark comparisons across multiple reviewers.',
    weight: 'Medium',
  },
  {
    icon: '🔋', name: 'Battery Life', score_range: '0–10',
    what: 'Real-world screen-on time, battery drain rate, charging speed, and battery health management.',
    how: 'Battery drain tests, charging time measurements, and real-world usage reports from multiple reviewers.',
    weight: 'High',
  },
  {
    icon: '🔊', name: 'Speaker', score_range: '0–10',
    what: 'Maximum volume, clarity at high volumes, bass response, stereo separation, and call speaker quality.',
    how: 'Speaker comparison videos, blind listening tests, and audio analysis from specialist reviewers.',
    weight: 'Low',
  },
  {
    icon: '📞', name: 'Call Quality', score_range: '0–10',
    what: 'Microphone clarity, earpiece quality, noise cancellation during calls, and signal handling.',
    how: 'Call quality segments in reviews, microphone comparison videos.',
    weight: 'Low',
  },
  {
    icon: '🤖', name: 'Software & UI', score_range: '0–10',
    what: 'UI smoothness, amount of bloatware, update policy, animation fluidity, and useful features.',
    how: 'Long-term usage reviews, software update tracking, and UI comparison videos.',
    weight: 'Medium',
  },
];

const SCORE_GUIDE = [
  { range: '9.0 – 10', label: 'Exceptional', color: '#15803d', desc: 'Best in class. Outperforms almost everything else in this dimension.' },
  { range: '8.0 – 8.9', label: 'Excellent', color: '#65a30d', desc: 'Significantly above average. A clear strength of this phone.' },
  { range: '7.0 – 7.9', label: 'Very Good', color: '#65a30d', desc: 'Above average. Performs well with minor shortcomings.' },
  { range: '6.0 – 6.9', label: 'Good', color: '#b45309', desc: 'Meets expectations. No major complaints but nothing exceptional.' },
  { range: '5.0 – 5.9', label: 'Average', color: '#b45309', desc: 'Typical performance for the price range.' },
  { range: 'Below 5',   label: 'Below Average', color: '#dc2626', desc: 'Notable weakness. Consider alternatives if this matters to you.' },
];

export default function HowWeScore() {
  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream3)', padding: '22px var(--pad)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
            <Link to="/">Home</Link> › How We Score
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            How We Score Phones
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink2)', lineHeight: 1.7, maxWidth: 600 }}>
            Every phone on TrustedSpecs gets a real-world score — not from spec sheets,
            but from hours of watching YouTube reviews and analysing actual user experience.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px var(--pad) 48px' }}>

        {/* Philosophy */}
        <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-xl)', padding: '22px 24px', marginBottom: 28, color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
            Our philosophy
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', lineHeight: 1.75, marginBottom: 10 }}>
            Spec sheets tell you the RAM. We tell you whether the phone actually feels fast.
            Spec sheets list the camera megapixels. We tell you whether the photos are actually good.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', lineHeight: 1.75 }}>
            We study 5–15 YouTube reviews per phone from trusted Indian and international tech
            channels, then score each phone on 8 real-world dimensions that actually matter to buyers.
          </p>
        </div>

        {/* Score guide */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
            What each score means
          </h2>
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--cream3)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            {SCORE_GUIDE.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 120px 1fr',
                padding: '12px 16px', alignItems: 'center', gap: 16,
                borderBottom: i < SCORE_GUIDE.length - 1 ? '1px solid var(--cream3)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: s.color }}>
                  {s.range}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 8 dimensions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
            The 8 dimensions we score
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DIMS.map(d => (
              <div key={d.name} style={{
                background: 'var(--white)', border: '1.5px solid var(--cream3)',
                borderRadius: 'var(--r-lg)', padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{d.icon}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{d.name}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: d.weight === 'High' ? 'var(--hot-dim)' : d.weight === 'Medium' ? 'var(--purple-dim)' : 'var(--cream2)',
                    color: d.weight === 'High' ? 'var(--hot)' : d.weight === 'Medium' ? 'var(--purple)' : 'var(--ink3)',
                    textTransform: 'uppercase', letterSpacing: '.05em',
                  }}>
                    {d.weight} weight
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 6, lineHeight: 1.6 }}>
                  <strong>What we measure:</strong> {d.what}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6 }}>
                  <strong>How:</strong> {d.how}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
            Our review process
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { step: '01', title: 'Phone launches', desc: 'We track new launches across brands and add them to our database within days.' },
              { step: '02', title: 'Watch 5–15 reviews', desc: 'We study multiple YouTube reviews from trusted channels — Indian and global.' },
              { step: '03', title: 'Score each dimension', desc: 'We assign a score 0–10 for each of the 8 dimensions based on evidence from reviews.' },
              { step: '04', title: 'Add reviewer notes', desc: 'Key insights, strengths, and weaknesses are summarised for each phone.' },
              { step: '05', title: 'Mark confidence level', desc: 'Scores based on fewer reviews are marked as lower confidence.' },
              { step: '06', title: 'Update after 6 months', desc: 'Scores are revisited after software updates and long-term reviews emerge.' },
            ].map(s => (
              <div key={s.step} style={{
                background: 'var(--white)', border: '1.5px solid var(--cream3)',
                borderRadius: 'var(--r-lg)', padding: '14px 16px',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--purple)', marginBottom: 6 }}>
                  Step {s.step}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 5 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: 'var(--cream2)', borderRadius: 'var(--r-lg)',
          padding: '16px 18px', fontSize: 13, color: 'var(--ink2)', lineHeight: 1.7,
        }}>
          <strong>Important note:</strong> Scores are based on our analysis of publicly available YouTube reviews.
          They represent our best assessment of real-world performance and are inherently subjective.
          We recommend using scores as a guide alongside your own research.
          We do not receive payment from manufacturers to alter scores.
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/phones" className="btn btn-primary">Browse scored phones →</Link>
        </div>
      </div>
    </div>
  );
}
