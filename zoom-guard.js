/* Tells a visitor their browser zoom is outside what these worlds are laid out
   for, and gets out of the way the moment it is back.

   It builds its own panel and its own styles so a page only has to load the
   file; there is nothing to add to the markup and nothing to keep in step
   across three stylesheets.

   Reading the zoom: outerWidth is the window and does not move when the zoom
   does, so the gap between it and innerWidth is the zoom. screen.width looks
   like it would do the same job, and does on a phone, but on a desktop it is
   the whole monitor — measured on a windowed browser at 100% it claimed 1.5x.

   The two thresholds are deliberately not symmetric. A scrollbar puts the ratio
   a percent or two over 1 on its own, so the zoomed-in edge sits above that
   rather than at exactly 1. Zooming out stays readable until it is extreme, so
   that side is left alone until 60%. */
(function () {
  'use strict';

  var IN_TOO_FAR = 1.06;
  var OUT_TOO_FAR = 0.60;

  /* Past this much zoom the worlds stop growing with it. Everything keeps the
     size it had at 80%, because beyond that the type starts to crowd the art it
     sits on. Below 80% nothing is touched, so the sizes these worlds have
     always used are the ones that show. */
  var HOLD_FROM = 0.80;

  var CSS = [
    '#zoomGuard{position:absolute;inset:0;z-index:60;display:grid;place-items:center;',
    '  padding:28px;background:#04070ff2;backdrop-filter:blur(6px);text-align:center;',
    '  font-family:"Segoe UI",system-ui,sans-serif;color:#edf7fd}',
    '#zoomGuard[hidden]{display:none}',
    '#zoomGuard>div{max-width:34ch}',
    '#zoomGuard .zg-eyebrow{font:10px/1.4 Consolas,monospace;letter-spacing:1.7px;',
    '  color:#a5d9ff;margin:0 0 8px}',
    '#zoomGuard h2{font-size:22px;line-height:1.2;font-weight:500;margin:0 0 10px}',
    '#zoomGuard p{font-size:14px;line-height:1.5;color:#c2d5e2;margin:0 0 10px}',
    '#zoomGuard .zg-now{font:11px/1.5 Consolas,monospace;color:#8aa6bd;letter-spacing:1px}',
    '#zoomGuard b{color:#ffd9a0;font-weight:600}'
  ].join('');

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.id = 'zoomGuard';
    box.hidden = true;
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-labelledby', 'zoomGuardTitle');
    box.innerHTML =
      '<div><p class="zg-eyebrow">DISPLAY</p>' +
      '<h2 id="zoomGuardTitle"></h2>' +
      '<p>These worlds are laid out for 100% zoom. Set the zoom back and this ' +
      'will clear on its own.</p>' +
      '<p class="zg-now">Currently at <b id="zoomNow">—</b></p></div>';

    // Inside the world column where there is one, so it covers exactly what the
    // visitor is looking at rather than the whole page around it.
    var host = document.querySelector('#world,#boot,#trace') || document.body;
    host.appendChild(box);
    return box;
  }

  function start() {
    var box = document.getElementById('zoomGuard') || build();
    var title = document.getElementById('zoomGuardTitle');
    var now = document.getElementById('zoomNow');

    function check() {
      var zoom = (outerWidth && innerWidth) ? outerWidth / innerWidth : 1;

      // One number the stylesheets multiply every text size by.
      var scale = zoom > HOLD_FROM ? HOLD_FROM / zoom : 1;
      document.documentElement.style.setProperty('--ui-scale', scale.toFixed(4));

      var inToo = zoom > IN_TOO_FAR, outToo = zoom < OUT_TOO_FAR;
      var off = inToo || outToo;
      box.hidden = !off;
      if (!off) return;
      title.textContent = inToo
        ? 'Your browser is zoomed in.'
        : 'Your browser is zoomed out too far.';
      now.textContent = Math.round(zoom * 100) + '%';
    }

    addEventListener('resize', check);
    if (window.visualViewport) visualViewport.addEventListener('resize', check);
    check();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();
})();
