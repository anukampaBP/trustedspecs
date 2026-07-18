/* quality is loaded via admin.js tab handling - sliders need separate wiring */
/* This script is injected via the quality page using products.js slot - handle it here */
(function () {
  'use strict';

  document.querySelectorAll('.score-slider').forEach(function (slider) {
    const key = slider.closest('[data-score-key]')?.dataset.scoreKey;
    const display = key ? document.getElementById('sv_' + key) : null;

    function update() {
      const v = parseFloat(slider.value);
      if (display) display.textContent = v === 0 ? '—' : v.toFixed(1);
      // Color based on score
      if (display) {
        display.style.color = v >= 8 ? 'var(--green)' : v >= 5 ? 'var(--purple)' : v > 0 ? 'var(--amber)' : 'var(--ink-faint)';
      }
    }

    slider.addEventListener('input', update);
    update();
  });
})();
