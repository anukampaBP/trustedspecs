// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import FloatTray from './components/FloatTray';

// Pages
import Home         from './pages/Home';
import BrowsePhones from './pages/BrowsePhones';
import PhoneDetail  from './pages/PhoneDetail';
import Compare      from './pages/Compare';
import BudgetFinder from './pages/BudgetFinder';
import NewsListing  from './pages/NewsListing';
import ArticleDetail from './pages/ArticleDetail';
import SearchResults from './pages/SearchResults';
import BrandPage    from './pages/BrandPage';
import PriceAlerts  from './pages/PriceAlerts';
import HowWeScore   from './pages/HowWeScore';
import NotFound     from './pages/NotFound';

import './index.css';

const MAX = 3;

// ── Toast system ─────────────────────────────────────────────────────────────
let _tid = 0, _addToast = null;
export function toast(msg, type = 'info') { _addToast?.(msg, type); }

function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    _addToast = (msg, type) => {
      const id = ++_tid;
      setItems(t => [...t, { id, msg, type }]);
      setTimeout(() => setItems(t => t.filter(x => x.id !== id)), 3000);
    };
  }, []);
  return (
    <div className="toast-wrap">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ── Scroll to top on route change ────────────────────────────────────────────
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ── Article body styles (injected globally) ───────────────────────────────────
const ARTICLE_STYLES = `
  .article-body h2 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; margin: 28px 0 10px; color: #0f0e0c; }
  .article-body h3 { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; margin: 22px 0 8px; color: #0f0e0c; }
  .article-body p  { margin-bottom: 16px; }
  .article-body ul, .article-body ol { padding-left: 22px; margin-bottom: 16px; }
  .article-body li { margin-bottom: 6px; }
  .article-body a  { color: #6d28d9; text-decoration: underline; }
  .article-body hr.ts-divider { border: none; border-top: 1px solid #dedad2; margin: 28px 0; }
  .article-body strong { color: #0f0e0c; font-weight: 600; }
  .article-body .ts-specs-table { background: #fff; border: 1.5px solid #dedad2; border-radius: 12px; overflow: hidden; margin: 18px 0; }
  .article-body .ts-specs-title { background: #0f0e0c; color: #fff; font-size: 13px; font-weight: 700; padding: 10px 16px; }
  .article-body .ts-specs-table table { width: 100%; border-collapse: collapse; }
  .article-body .ts-specs-table tr { border-bottom: 1px solid #dedad2; }
  .article-body .ts-specs-table tr:last-child { border-bottom: none; }
  .article-body .ts-specs-table th { text-align: left; padding: 8px 16px; font-size: 12px; color: #8a857e; background: #f5f3ee; width: 40%; }
  .article-body .ts-specs-table td { padding: 8px 16px; font-size: 13px; color: #0f0e0c; font-weight: 500; }
  .article-body .ts-pro-con { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
  .article-body .ts-pros { background: #dcfce7; border-radius: 12px; padding: 14px 16px; }
  .article-body .ts-cons { background: #fee2e2; border-radius: 12px; padding: 14px 16px; }
  .article-body .ts-pros h4 { color: #15803d; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .article-body .ts-cons h4 { color: #dc2626; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .article-body .ts-pros ul, .article-body .ts-cons ul { padding-left: 16px; margin: 0; }
  .article-body .ts-pros li, .article-body .ts-cons li { font-size: 13px; margin-bottom: 4px; }
  .article-body .ts-verdict { display: flex; align-items: center; gap: 18px; background: #ede9fb; border-radius: 14px; padding: 18px; margin: 20px 0; border-left: 4px solid #6d28d9; }
  .article-body .ts-verdict-score { font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 700; color: #6d28d9; flex-shrink: 0; line-height: 1; }
  .article-body .ts-verdict-score span { font-size: 18px; color: #8a857e; }
  .article-body .ts-verdict h3 { font-size: 16px; font-weight: 700; margin-bottom: 5px; }
  .article-body .ts-verdict p { font-size: 13px; color: #4a4540; margin: 0; }
  .article-body .ts-buy-box { display: flex; gap: 14px; background: #fff; border: 1.5px solid #dedad2; border-radius: 14px; padding: 16px; margin: 20px 0; align-items: center; }
  .article-body .ts-buy-box img { width: 80px; height: 80px; object-fit: contain; }
  .article-body .ts-buy-info h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .article-body .ts-buy-price { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: #15803d; margin-bottom: 8px; }
  .article-body .ts-buy-links { display: flex; gap: 8px; flex-wrap: wrap; }
  .article-body .ts-buy-amazon, .article-body .ts-buy-flipkart { padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600; text-decoration: none; }
  .article-body .ts-buy-amazon  { background: #FF9900; color: #fff; }
  .article-body .ts-buy-flipkart { background: #2874f0; color: #fff; }
  .article-body .ts-callout { display: flex; gap: 10px; padding: 12px 16px; border-radius: 10px; margin: 16px 0; font-size: 13px; line-height: 1.6; }
  .article-body .ts-callout-tip  { background: #fff0e8; color: #ff5c00; }
  .article-body .ts-callout-warn { background: #fef3c7; color: #b45309; }
  .article-body .ts-callout-info { background: #ede9fb; color: #6d28d9; }
  @media(max-width:600px) {
    .article-body .ts-pro-con { grid-template-columns: 1fr; }
    .article-body .ts-buy-box { flex-direction: column; }
  }
`;

export default function App() {
  const [compareList, setCompare] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ts_cmp') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('ts_cmp', JSON.stringify(compareList));
  }, [compareList]);

  // Inject article body styles once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = ARTICLE_STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  function addToCompare(phone) {
    if (compareList.some(p => p.slug === phone.slug)) {
      setCompare(prev => prev.filter(p => p.slug !== phone.slug));
      return;
    }
    if (compareList.length >= MAX) {
      toast(`Max ${MAX} phones. Remove one first.`, 'error');
      return;
    }
    setCompare(prev => [...prev, phone]);
    toast(`${phone.name} added`, 'success');
  }

  function removeFromCompare(phone) {
    setCompare(prev => prev.filter(p => p.slug !== phone.slug));
  }

  // Shared props
  const listProps = { compareList, onAddCompare: addToCompare };

  return (
    <BrowserRouter>
      <ScrollTop />
      <div className="page-wrap">
        <Nav compareCount={compareList.length} />
        <main>
          <Routes>
            <Route path="/"              element={<Home {...listProps} />} />
            <Route path="/phones"        element={<BrowsePhones {...listProps} />} />
            <Route path="/phones/:slug"  element={<PhoneDetail {...listProps} />} />
            <Route path="/compare"       element={<Compare compareList={compareList} onAddCompare={addToCompare} onRemove={removeFromCompare} />} />
            <Route path="/budget"        element={<BudgetFinder {...listProps} />} />
            <Route path="/news"          element={<NewsListing />} />
            <Route path="/news/:slug"    element={<ArticleDetail />} />
            <Route path="/search"        element={<SearchResults {...listProps} />} />
            <Route path="/brands/:brand" element={<BrandPage {...listProps} />} />
            <Route path="/alerts"        element={<PriceAlerts />} />
            <Route path="/how-we-score"  element={<HowWeScore />} />
            <Route path="*"              element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <FloatTray items={compareList} onRemove={removeFromCompare} onClear={() => setCompare([])} />
        <Toasts />
      </div>
    </BrowserRouter>
  );
}
