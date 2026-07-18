/* admin.js — global UI logic (no inline scripts anywhere) */
(function () {
  'use strict';

  /* ── Toast system ─────────────────────────────────────────────────────── */
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);

  window.toast = function (msg, type = 'info', duration = 3000) {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), duration);
  };

  /* ── Sidebar toggle ───────────────────────────────────────────────────── */
  const sidebar    = document.getElementById('sidebar');
  const overlay    = document.getElementById('overlay');
  const menuToggle = document.getElementById('menuToggle');
  const sidebarClose = document.getElementById('sidebarClose');

  function openSidebar()  { sidebar?.classList.add('open'); overlay?.classList.add('active'); }
  function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); }

  menuToggle?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  /* ── Tab system ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    const buttons = tabGroup.querySelectorAll('.tab-btn');
    const paneId  = tabGroup.dataset.target;
    const panes   = paneId
      ? document.querySelectorAll('#' + paneId + ' .tab-pane')
      : document.querySelectorAll('.tab-pane');

    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        buttons.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panes[i]) panes[i].classList.add('active');
      });
    });
    // activate first
    if (buttons[0]) buttons[0].classList.add('active');
    if (panes[0]) panes[0].classList.add('active');
  });

  /* ── Modal system ─────────────────────────────────────────────────────── */
  window.openModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  };
  window.closeModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  };

  document.addEventListener('click', function (e) {
    if (e.target.matches('.modal-close')) {
      e.target.closest('.modal-backdrop')?.classList.remove('open');
    }
    if (e.target.matches('.modal-backdrop')) {
      e.target.classList.remove('open');
    }
  });

  /* ── Search-and-choose widget ─────────────────────────────────────────── */
  // Usage: <div class="search-choose" data-api="/api/..." data-name="related_ids[]">
  document.querySelectorAll('.search-choose').forEach(initSearchChoose);

  function initSearchChoose(wrap) {
    const input    = wrap.querySelector('.search-choose-input');
    const dropdown = wrap.querySelector('.search-dropdown');
    const tagsWrap = wrap.querySelector('.chosen-tags');
    const hiddenWrap = wrap.querySelector('.chosen-hidden');
    const apiUrl   = wrap.dataset.api || '/api/actions.php?action=search_products';
    const fieldName = wrap.dataset.name || 'product_ids[]';
    let chosen = [];
    let timer;

    input?.addEventListener('input', function () {
      clearTimeout(timer);
      const q = this.value.trim();
      if (q.length < 2) { dropdown.classList.remove('open'); return; }
      timer = setTimeout(() => fetchOptions(q), 280);
    });

    input?.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { dropdown.classList.remove('open'); this.value = ''; }
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) dropdown.classList.remove('open');
    });

    function fetchOptions(q) {
      fetch(apiUrl + '&q=' + encodeURIComponent(q))
        .then(r => r.json())
        .then(data => {
          dropdown.innerHTML = '';
          if (!data.length) {
            dropdown.innerHTML = '<div class="search-option text-muted">No results</div>';
          }
          data.forEach(function (item) {
            const opt = document.createElement('div');
            opt.className = 'search-option';
            opt.innerHTML = `
              ${item.image ? `<img src="${esc(item.image)}" alt="">` : ''}
              <div>
                <div class="search-option-name">${esc(item.name)}</div>
                ${item.sub ? `<div class="search-option-sub">${esc(item.sub)}</div>` : ''}
              </div>`;
            opt.addEventListener('click', function () {
              addChosen(item);
              dropdown.classList.remove('open');
              input.value = '';
            });
            dropdown.appendChild(opt);
          });
          dropdown.classList.add('open');
        })
        .catch(() => { dropdown.classList.remove('open'); });
    }

    function addChosen(item) {
      if (chosen.find(c => c.id === item.id)) return;
      chosen.push(item);
      renderChosen();
    }

    function removeChosen(id) {
      chosen = chosen.filter(c => c.id !== id);
      renderChosen();
    }

    function renderChosen() {
      tagsWrap.innerHTML = '';
      hiddenWrap.innerHTML = '';
      chosen.forEach(function (item) {
        const tag = document.createElement('span');
        tag.className = 'chosen-tag';
        tag.innerHTML = `${esc(item.name)} <button class="chosen-tag-remove" data-id="${esc(item.id)}" type="button">×</button>`;
        tag.querySelector('.chosen-tag-remove').addEventListener('click', function () {
          removeChosen(item.id);
        });
        tagsWrap.appendChild(tag);

        const hidden = document.createElement('input');
        hidden.type  = 'hidden';
        hidden.name  = fieldName;
        hidden.value = item.id;
        hiddenWrap.appendChild(hidden);
      });
    }
  }

  /* ── Image upload + URL dual input ───────────────────────────────────── */
  document.querySelectorAll('.img-dual-input').forEach(function (wrap) {
    const urlInput   = wrap.querySelector('.img-url-input');
    const fileInput  = wrap.querySelector('.img-file-input');
    const preview    = wrap.querySelector('.img-preview');
    const uploadPath = wrap.dataset.uploadPath || 'actions.php?action=upload_image';

    urlInput?.addEventListener('change', function () {
      if (preview && this.value) preview.src = this.value;
    });

    fileInput?.addEventListener('change', function () {
      if (!this.files[0]) return;
      const fd = new FormData();
      fd.append('file', this.files[0]);
      fd.append('type', wrap.dataset.imgType || 'product');
      fetch(uploadPath, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(function (d) {
          if (d.url) {
            if (urlInput) urlInput.value = d.url;
            if (preview)  preview.src = d.url;
            toast('Image uploaded', 'success');
          } else {
            toast(d.error || 'Upload failed', 'error');
          }
        })
        .catch(() => toast('Upload error', 'error'));
    });
  });

  /* ── Confirm delete ───────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-confirm]');
    if (!btn) return;
    e.preventDefault();
    if (!confirm(btn.dataset.confirm)) return;
    const href = btn.getAttribute('href');
    const action = btn.dataset.action;
    if (href) { window.location.href = href; }
    else if (action) {
      fetch('actions.php', { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'action=' + encodeURIComponent(action) + '&id=' + encodeURIComponent(btn.dataset.id || '') })
        .then(r => r.json())
        .then(d => { toast(d.message || 'Done', d.ok ? 'success' : 'error'); if (d.ok) setTimeout(() => location.reload(), 800); })
        .catch(() => toast('Error', 'error'));
    }
  });

  /* ── Slug auto-gen ────────────────────────────────────────────────────── */
  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const nameInput = document.getElementById('product_name');
  const slugInput = document.getElementById('product_slug');
  if (nameInput && slugInput) {
    nameInput.addEventListener('input', function () {
      if (!slugInput.dataset.manual) {
        slugInput.value = slugify(this.value);
      }
    });
    slugInput.addEventListener('input', function () {
      this.dataset.manual = '1';
    });
  }
  const artTitle = document.getElementById('article_title');
  const artSlug  = document.getElementById('article_slug');
  if (artTitle && artSlug) {
    artTitle.addEventListener('input', function () {
      if (!artSlug.dataset.manual) {
        artSlug.value = slugify(this.value);
      }
    });
    artSlug.addEventListener('input', function () {
      this.dataset.manual = '1';
    });
  }


  /* ── Bulk JSON import ─────────────────────────────────────────────────────── */
  var bulkDropZone  = document.getElementById('bulk-drop-zone');
  var bulkFileInput = document.getElementById('bulk-file-input');
  var bulkFileList  = document.getElementById('bulk-file-list');
  var bulkBtn       = document.getElementById('bulk-import-btn');
  var bulkProgress  = document.getElementById('bulk-progress');
  var bulkBar       = document.getElementById('bulk-progress-bar');
  var bulkStatus    = document.getElementById('bulk-status');
  var bulkResults   = document.getElementById('bulk-results');
  var selectedFiles = [];

  if (bulkDropZone) {
    bulkDropZone.addEventListener('click', function(e) {
      if (!e.target.closest('label')) bulkFileInput.click();
    });
    bulkDropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      bulkDropZone.style.borderColor = 'var(--purple)';
      bulkDropZone.style.background  = 'var(--purple-dim)';
    });
    bulkDropZone.addEventListener('dragleave', function() {
      bulkDropZone.style.borderColor = '';
      bulkDropZone.style.background  = '';
    });
    bulkDropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      bulkDropZone.style.borderColor = '';
      bulkDropZone.style.background  = '';
      handleFiles(Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json')));
    });
    bulkFileInput.addEventListener('change', function() {
      handleFiles(Array.from(this.files));
    });

    function handleFiles(files) {
      selectedFiles = files;
      if (!files.length) return;
      bulkFileList.style.display = 'block';
      bulkFileList.innerHTML = '<div class="text-sm font-weight-600" style="margin-bottom:.5rem">'
        + files.length + ' file(s) selected:</div>'
        + files.map(f => '<div class="text-sm text-muted" style="padding:.2rem 0">📄 ' + esc(f.name) + '</div>').join('');
      bulkBtn.style.display = 'inline-flex';
      bulkResults.style.display = 'none';
    }

    bulkBtn.addEventListener('click', async function() {
      if (!selectedFiles.length) return;
      bulkBtn.disabled = true;
      bulkProgress.style.display = 'block';
      bulkResults.style.display  = 'none';

      const fd = new FormData();
      fd.append('action', 'bulk_import_phones');
      selectedFiles.forEach(f => fd.append('json_files[]', f));

      bulkBar.style.width = '30%';
      bulkStatus.textContent = 'Uploading and importing...';

      try {
        const resp = await fetch('actions.php', { method: 'POST', body: fd });
        const data = await resp.json();
        bulkBar.style.width = '100%';

        if (data.ok) {
          bulkStatus.textContent = 'Done — ' + data.imported + ' imported, ' + data.failed + ' skipped';
          bulkResults.style.display = 'block';
          bulkResults.innerHTML = data.results.map(function(r) {
            return '<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem 0;border-bottom:1px solid var(--cream-border);font-size:.82rem">'
              + (r.ok
                ? '<span class="badge badge-green">✓</span> <strong>' + esc(r.name) + '</strong>'
                  + ' — ' + r.mapped + ' specs mapped'
                  + ' <a href="index.php?page=specs&id=' + r.id + '" style="margin-left:auto">Fill specs →</a>'
                : '<span class="badge badge-red">✗</span> ' + esc(r.file) + ' — ' + esc(r.error))
              + '</div>';
          }).join('');
          toast(data.imported + ' phones imported successfully', 'success');
        } else {
          bulkStatus.textContent = 'Error: ' + (data.error || 'Unknown');
          toast('Import failed', 'error');
        }
      } catch (e) {
        bulkStatus.textContent = 'Upload failed: ' + e.message;
        toast('Upload error', 'error');
      }
      bulkBtn.disabled = false;
    });
  }

  /* ── Parameter edit — toggle options field ──────────────────────────────── */
  var atSelect = document.getElementById('answer-type-select');
  var optField = document.getElementById('options-field');
  if (atSelect && optField) {
    function toggleOptions() {
      var at = parseInt(atSelect.value);
      optField.style.display = (at === 1 || at === 3 || at === 4) ? '' : 'none';
    }
    atSelect.addEventListener('change', toggleOptions);
    toggleOptions();
  }

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
