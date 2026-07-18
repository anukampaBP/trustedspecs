// src/api/index.js
const BASE = 'https://api.trustedspecs.com';

async function get(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error('API error ' + r.status);
  return r.json();
}

export const api = {
  // Phones list with optional filters
  phones: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get('/phones' + (q ? '?' + q : ''));
  },

  // Single phone detail
  phone: (slug) => get('/phones/' + slug),

  // Search
  search: (q) => get('/search?q=' + encodeURIComponent(q)),

  // Compare up to 3 phones
  compare: (slugs) => get('/compare?phones=' + slugs.join(',')),

  // Similar phones
  similar: (slug) => get('/similar/' + slug),

  // Budget finder
  budget: (params) => get('/budget?' + new URLSearchParams(params).toString()),

  // Brands list
  brands: () => get('/brands'),

  // Articles
  articles: (params = {}) => get('/articles?' + new URLSearchParams(params).toString()),
  article: (slug) => get('/articles/' + slug),

  // Stats for homepage
  stats: () => get('/stats'),
};
