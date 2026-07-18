/* js/image-fetcher.js */
(function () {
  'use strict';

  const searchBtn  = document.getElementById('img-search-btn');
  const searchInput= document.getElementById('img-search-input');
  const imgGrid    = document.getElementById('img-grid');
  const imgResults = document.getElementById('img-results');
  const imgLoading = document.getElementById('img-loading');
  const noImgTbody = document.getElementById('no-img-tbody');
  const noImgCount = document.getElementById('no-img-count');

  // Load phones without images
  fetch('actions.php?action=phones_no_image')
    .then(r => r.json())
    .then(function (data) {
      if (!Array.isArray(data)) return;
      if (noImgCount) noImgCount.textContent = data.length + ' missing';
      if (!noImgTbody) return;
      noImgTbody.innerHTML = '';
      if (!data.length) {
        noImgTbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">All phones have images 🎉</div></td></tr>';
        return;
      }
      data.forEach(function (p) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${esc(p.name)}</strong></td>
          <td>${esc(p.brand)}</td>
          <td>${p.status == 1 ? '<span class="badge badge-green">Live</span>' : '<span class="badge badge-amber">Draft</span>'}</td>
          <td>
            <button class="btn btn-sm btn-secondary quick-search-btn"
                    data-name="${esc(p.name)}" data-id="${esc(p.id)}">Search images</button>
          </td>`;
        noImgTbody.appendChild(tr);
      });

      // Quick search from table
      noImgTbody.addEventListener('click', function (e) {
        const btn = e.target.closest('.quick-search-btn');
        if (!btn) return;
        if (searchInput) searchInput.value = btn.dataset.name + ' official';
        doSearch(btn.dataset.id);
        searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    })
    .catch(function () {
      if (noImgTbody) noImgTbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center">Could not load data.</td></tr>';
    });

  searchBtn?.addEventListener('click', function () { doSearch(); });
  searchInput?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  let activeProductId = null;

  function doSearch(pid) {
    if (pid) activeProductId = pid;
    const q = searchInput?.value?.trim();
    if (!q) return;
    const source = document.getElementById('img-source')?.value || 'bing';

    imgLoading.style.display = 'block';
    imgResults.style.display = 'none';
    imgGrid.innerHTML = '';

    fetch('actions.php?action=search_images&q=' + encodeURIComponent(q) + '&source=' + source)
      .then(r => r.json())
      .then(function (data) {
        imgLoading.style.display = 'none';
        imgResults.style.display = 'block';
        imgGrid.innerHTML = '';

        if (!data.length) {
          imgGrid.innerHTML = '<p class="text-muted">No images found. Try a different search term.</p>';
          return;
        }

        data.forEach(function (img) {
          const card = document.createElement('div');
          card.style.cssText = 'border:1px solid var(--cream-border);border-radius:8px;overflow:hidden;';
          card.innerHTML = `
            <img src="${esc(img.thumbnail || img.url)}" alt="${esc(img.name || '')}"
                 style="width:100%;height:140px;object-fit:contain;background:var(--cream);padding:.5rem">
            <div style="padding:.5rem">
              <div class="text-xs text-muted" style="margin-bottom:.4rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                   title="${esc(img.url)}">${esc(img.source || 'Web')}</div>
              <div class="flex gap-1">
                <a href="${esc(img.url)}" target="_blank" class="btn btn-sm btn-secondary" style="flex:1">View</a>
                <button class="btn btn-sm btn-primary save-img-btn" data-url="${esc(img.url)}" style="flex:1">Save</button>
              </div>
            </div>`;
          imgGrid.appendChild(card);
        });
      })
      .catch(function () {
        imgLoading.style.display = 'none';
        toast('Image search failed. Check API key in Settings.', 'error');
      });
  }

  imgGrid?.addEventListener('click', function (e) {
    const btn = e.target.closest('.save-img-btn');
    if (!btn) return;
    const url = btn.dataset.url;
    const pid = activeProductId ||
      document.querySelector('.chosen-hidden input')?.value || '';

    if (!pid) {
      toast('Select a product first (above)', 'error');
      return;
    }

    fetch('actions.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'action=save_product_image&product_id=' + encodeURIComponent(pid)
            + '&image_url=' + encodeURIComponent(url)
    })
    .then(r => r.json())
    .then(function (d) {
      if (d.ok) {
        btn.textContent = '✓ Saved';
        btn.disabled = true;
        toast('Image saved to product', 'success');
      } else {
        toast(d.error || 'Save failed', 'error');
      }
    })
    .catch(() => toast('Error saving image', 'error'));
  });

  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
})();
