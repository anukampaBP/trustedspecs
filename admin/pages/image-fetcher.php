<?php
// pages/image-fetcher.php
// Fetches product images via search from multiple sources
// Priority: 1) Amazon PA-API (if configured), 2) GSMArena scrape, 3) Bing Image Search
$settings = [];
$stmt = $pdo->query('SELECT setting_key, setting_value FROM admin_settings');
if ($stmt) {
    foreach ($stmt->fetchAll() as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
}
?>

<div class="card mb-2">
  <div class="card-header">
    <h2>Image Fetcher</h2>
    <span class="text-xs text-muted">Find and save product images</span>
  </div>
  <div class="card-body">
    <div class="alert alert-info mb-2">
      This tool searches for phone images from multiple sources. Images are fetched in real-time
      — click "Save" to store the URL in the product record.
      For best results, configure Bing Search API key in <a href="index.php?page=settings">Settings</a>.
    </div>

    <div class="field">
      <label>Search phone images</label>
      <div class="flex gap-1">
        <input type="text" id="img-search-input" placeholder="e.g. OnePlus 13 official image…" style="flex:1">
        <select id="img-source" style="width:160px">
          <option value="bing">Bing Images</option>
          <option value="gsmarena">GSMArena</option>
        </select>
        <button type="button" id="img-search-btn" class="btn btn-primary">Search</button>
      </div>
    </div>

    <div id="img-results" style="display:none">
      <div class="field">
        <label>Link to product (optional)</label>
        <div class="search-choose" data-api="actions.php?action=search_products" data-name="_link_product_id">
          <input type="text" class="search-choose-input" placeholder="Search phone name…">
          <div class="search-dropdown"></div>
          <div class="chosen-tags"></div>
          <div class="chosen-hidden"></div>
        </div>
      </div>
      <div id="img-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-top:1rem"></div>
    </div>
    <div id="img-loading" style="display:none;text-align:center;padding:2rem">
      <div class="spinner"></div>
      <p class="text-muted mt-1">Fetching images…</p>
    </div>
  </div>
</div>

<!-- Phones with no images -->
<div class="card">
  <div class="card-header">
    <h2>Phones Without Primary Image</h2>
    <span class="badge badge-amber" id="no-img-count"></span>
  </div>
  <div class="table-wrap">
    <table id="no-img-table">
      <thead>
        <tr>
          <th>Phone</th>
          <th>Brand</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="no-img-tbody">
        <tr><td colspan="4" class="text-center text-muted" style="padding:2rem">Loading…</td></tr>
      </tbody>
    </table>
  </div>
</div>
