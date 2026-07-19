// src/api/index.js
const BASE = import.meta.env.VITE_API_URL || 'https://api.trustedspecs.com';

async function get(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error('API error ' + r.status);
  return r.json();
}

export const api = {
  phones:       (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get('/phones' + (q ? '?' + q : ''));
  },
  phone:        (slug)   => get('/phones/' + slug),
  search:       (q)      => get('/search?q=' + encodeURIComponent(q)),
  compare:      (slugs)  => get('/compare?phones=' + slugs.join(',')),
  similar:      (slug)   => get('/similar/' + slug),
  budget:       (params) => get('/budget?' + new URLSearchParams(params).toString()),
  brands:       ()       => get('/brands'),
  articles:     (params = {}) => get('/articles?' + new URLSearchParams(params).toString()),
  article:      (slug)   => get('/articles/' + slug),
  stats:        ()       => get('/stats'),
  // New endpoints
  topComparisons: ()     => get('/top-comparisons'),
  upcoming:     ()       => get('/upcoming'),
  topSearched:  ()       => get('/top-searched'),
};
