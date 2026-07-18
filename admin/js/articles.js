/* js/articles.js — blog editor toolbar */
(function () {
  'use strict';

  const textarea = document.getElementById('article-content');
  const toolbar  = document.getElementById('editor-toolbar');
  if (!textarea || !toolbar) return;

  // HTML block templates
  const blocks = {
    'ul': '<ul>\n  <li>Item one</li>\n  <li>Item two</li>\n</ul>\n',
    'ol': '<ol>\n  <li>First point</li>\n  <li>Second point</li>\n</ol>\n',
    'specs-table':
`<div class="ts-specs-table">
  <h3 class="ts-specs-title">Key Specifications</h3>
  <table>
    <tr><th>Display</th><td>6.67" AMOLED, 120Hz</td></tr>
    <tr><th>Processor</th><td>Snapdragon 8 Gen 3</td></tr>
    <tr><th>RAM / Storage</th><td>12GB + 256GB</td></tr>
    <tr><th>Camera</th><td>50MP + 12MP + 10MP</td></tr>
    <tr><th>Battery</th><td>5000 mAh, 100W charging</td></tr>
    <tr><th>OS</th><td>Android 14</td></tr>
  </table>
</div>\n`,
    'pro-con':
`<div class="ts-pro-con">
  <div class="ts-pros">
    <h4>✅ Pros</h4>
    <ul>
      <li>Excellent battery life</li>
      <li>Flagship camera system</li>
    </ul>
  </div>
  <div class="ts-cons">
    <h4>❌ Cons</h4>
    <ul>
      <li>Heats up during gaming</li>
      <li>No wireless charging</li>
    </ul>
  </div>
</div>\n`,
    'verdict':
`<div class="ts-verdict">
  <div class="ts-verdict-score">8.5<span>/10</span></div>
  <div class="ts-verdict-text">
    <h3>Verdict</h3>
    <p>Write your final verdict here. Summarise who this phone is for, what it does best, and where it falls short.</p>
  </div>
</div>\n`,
    'buy-box':
`<div class="ts-buy-box">
  <img src="PHONE_IMAGE_URL" alt="Phone name">
  <div class="ts-buy-info">
    <h3>Phone Name</h3>
    <div class="ts-buy-price">₹34,999</div>
    <div class="ts-buy-links">
      <a href="AMAZON_URL" class="ts-buy-amazon">Buy on Amazon</a>
      <a href="FLIPKART_URL" class="ts-buy-flipkart">Buy on Flipkart</a>
    </div>
  </div>
</div>\n`,
    'callout':
`<div class="ts-callout ts-callout-tip">
  💡 <strong>Quick tip:</strong> Write your callout text here. Use ts-callout-warn for warnings, ts-callout-info for info.
</div>\n`,
    '---divider---': '<hr class="ts-divider">\n',
  };

  toolbar.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-wrap],[data-insert],[data-insert-block]');
    if (!btn) return;

    const start  = textarea.selectionStart;
    const end    = textarea.selectionEnd;
    const sel    = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after  = textarea.value.substring(end);

    let insert = '';

    if (btn.dataset.wrap) {
      const tag = btn.dataset.wrap;
      const tagName = tag.split(' ')[0]; // handle "a href=..."
      insert = `<${tag}>${sel || 'text here'}</${tagName}>`;
    } else if (btn.dataset.insert) {
      insert = blocks[btn.dataset.insert] || btn.dataset.insert;
    } else if (btn.dataset.insertBlock) {
      insert = blocks[btn.dataset.insertBlock] || '';
    }

    if (insert) {
      textarea.value = before + insert + after;
      const cursor = before.length + insert.length;
      textarea.setSelectionRange(cursor, cursor);
      textarea.focus();
    }
  });

  // Auto-resize textarea
  function autoResize() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(320, textarea.scrollHeight) + 'px';
  }
  textarea.addEventListener('input', autoResize);
  autoResize();

  // Tab key inserts 2 spaces
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end   = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.setSelectionRange(start + 2, start + 2);
    }
  });

})();
