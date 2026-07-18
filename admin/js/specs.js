/* js/specs.js — spec editor tab logic */
(function () {
  'use strict';

  const tabBtns = document.querySelectorAll('#spec-tabs .tab-btn');
  const panes   = document.querySelectorAll('#spec-panes .tab-pane');

  function activateTab(cat) {
    tabBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    panes.forEach(function (pane) {
      pane.classList.toggle('active', pane.dataset.catPane === cat);
    });
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(this.dataset.cat);
    });
  });

  // activate first tab
  if (tabBtns[0]) activateTab(tabBtns[0].dataset.cat);

})();
