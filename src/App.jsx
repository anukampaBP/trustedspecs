// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import PhoneDetail from './pages/PhoneDetail';
import Compare from './pages/Compare';
import './index.css';

const MAX_COMPARE = 3;

// Toast notification system
let addToastFn = null;
export function toast(msg, type = 'info') {
  addToastFn?.(msg, type);
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    addToastFn = (msg, type) => {
      const id = Date.now();
      setToasts(t => [...t, { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
    };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [compareList, setCompareList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ts_compare') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('ts_compare', JSON.stringify(compareList));
  }, [compareList]);

  function addToCompare(phone) {
    if (compareList.some(p => p.slug === phone.slug)) {
      removeFromCompare(phone);
      return;
    }
    if (compareList.length >= MAX_COMPARE) {
      toast(`Max ${MAX_COMPARE} phones in compare. Remove one first.`, 'error');
      return;
    }
    setCompareList(prev => [...prev, phone]);
    toast(`${phone.name} added to compare`, 'success');
  }

  function removeFromCompare(phone) {
    setCompareList(prev => prev.filter(p => p.slug !== phone.slug));
  }

  return (
    <BrowserRouter>
      <div className="page-wrap">
        <Nav compareList={compareList} />
        <main>
          <Routes>
            <Route path="/" element={
              <Home compareList={compareList} onAddCompare={addToCompare} />
            } />
            <Route path="/phones/:slug" element={
              <PhoneDetail compareList={compareList} onAddCompare={addToCompare} />
            } />
            <Route path="/compare" element={
              <Compare
                compareList={compareList}
                onAddCompare={addToCompare}
                onRemoveCompare={removeFromCompare}
              />
            } />
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '.75rem' }}>
                  Page not found
                </h2>
                <a href="/" className="btn btn-primary">Go home</a>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
