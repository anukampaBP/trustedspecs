// All API calls go through here.
// Set VITE_API_URL in Cloudflare Pages environment variables.
// Falls back to localhost for local development.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost/api'

async function get(endpoint, params = {}) {
  const url = new URL(`${BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v)
    }
  })
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json()
  return json.data
}

async function post(endpoint, body = {}) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json()
  return json.data
}

// ── Phones ───────────────────────────────────────────────────────
export const getPhones      = (params) => get('phones', params)
export const searchPhones   = (q, limit = 8) => get('phones/search', { q, limit })
export const getPhone       = (slug) => get(`phone/${slug}`)
export const getSimilar     = (slug) => get(`phone/${slug}/similar`)
export const getCompare     = (ids) => get('compare', { ids: ids.join(',') })
export const getBudget      = (params) => get('budget', params)
export const getBrands      = () => get('brands')
export const getStats       = () => get('stats')

// ── Articles ─────────────────────────────────────────────────────
export const getArticles    = (params) => get('articles', params)
export const getArticle     = (slug) => get(`article/${slug}`)

// ── Games ────────────────────────────────────────────────────────
export const getMystery     = (reveal = 0) => get('game/mystery', { reveal })

// ── Actions ──────────────────────────────────────────────────────
export const createAlert    = (data) => post('alert', data)
export const trackClick     = (product_id, source, page_type) =>
  post('click', { product_id, source, page_type })
