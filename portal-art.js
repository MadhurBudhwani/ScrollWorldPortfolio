/* Reusable industrial portal/hatch renderer.
   Geometry stays procedural so every chapter and hub destination shares the
   same object language while retaining its semantic accent colour. */
(() => {
  'use strict';

  const THEMES = {
    green:  { rim:'#183c34', mid:'#397263', highlight:'#c1ffda', accent:'#84f5ad', glow:'#3fd37b', inner:'#09211d', deep:'#010707' },
    cyan:   { rim:'#123b49', mid:'#286c80', highlight:'#d3f8ff', accent:'#67daf5', glow:'#25bddd', inner:'#071c25', deep:'#010609' },
    gold:   { rim:'#4a3718', mid:'#836528', highlight:'#fff0bd', accent:'#f3cc70', glow:'#d99b32', inner:'#241b09', deep:'#080501' },
    pink:   { rim:'#472334', mid:'#7f405b', highlight:'#ffe0eb', accent:'#f58caf', glow:'#d75584', inner:'#26101b', deep:'#080205' },
    violet: { rim:'#34294d', mid:'#64518b', highlight:'#eee5ff', accent:'#b7a0ff', glow:'#8068cf', inner:'#181126', deep:'#050209' },
  };

  const clamp = value => Math.max(0, Math.min(1, value || 0));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = value => { const t=clamp(value); return t*t*(3-2*t); };

  // A stepped octagon reads as a machined hatch without introducing soft arcs.
  function steppedPath(c, width, height, cut) {
    const x = width / 2, y = height / 2, s = Math.min(cut, x, y);
    c.beginPath();
    c.moveTo(-x + s, -y); c.lineTo(x - s, -y);
    c.lineTo(x - s, -y + 2); c.lineTo(x, -y + 2);
    c.lineTo(x, y - 2); c.lineTo(x - s, y - 2);
    c.lineTo(x - s, y); c.lineTo(-x + s, y);
    c.lineTo(-x + s, y - 2); c.lineTo(-x, y - 2);
    c.lineTo(-x, -y + 2); c.lineTo(-x + s, -y + 2);
    c.closePath();
  }

  function fillStep(c, width, height, cut, color, y = 0) {
    c.save(); c.translate(0, y); steppedPath(c, width, height, cut);
    c.fillStyle = color; c.fill(); c.restore();
  }

  function draw(c, x, y, width, height, themeName = 'green', visual = {}) {
    const theme = THEMES[themeName] || THEMES.green;
    const approach = clamp(visual.approach);
    const entering = clamp(visual.entering);
    const build = visual.build === undefined ? 1 : clamp(visual.build);
    const rimBuild = smooth(build / .28);
    const depthBuild = smooth((build - .22) / .46);
    const energyBuild = smooth((build - .58) / .42);
    const pulse = visual.reducedMotion ? .35 : .35 + .65 * (.5 + .5 * Math.sin((visual.phase || 0) * Math.PI * 2));
    const active = Math.max(approach * .55, entering);
    const w = Math.max(72, Math.round(width * mix(1, .94, entering)));
    const h = Math.max(28, Math.round(height * mix(1, .88, entering)));
    const cut = Math.max(7, Math.round(w * .075));

    c.save();
    c.imageSmoothingEnabled = false;
    const baseAlpha=c.globalAlpha*(visual.opacity === undefined ? 1 : clamp(visual.opacity));
    c.globalAlpha=baseAlpha*rimBuild;
    c.translate(Math.round(x), Math.round(y));

    // Ground shadow, structural shell and hard lower-right depth.
    fillStep(c, w + 14, h + 12, cut + 5, '#010405', 5);
    fillStep(c, w + 12, h + 10, cut + 4, '#081318', 2);
    fillStep(c, w + 8, h + 6, cut + 2, theme.rim, 0);
    fillStep(c, w + 2, h, cut, theme.mid, -1);

    // Pixel bevels: bright upper lip and dark lower lip.
    c.fillStyle = theme.highlight; c.globalAlpha = baseAlpha*rimBuild*(.50 + active * .28);
    c.fillRect(-w / 2 + cut, -h / 2, w - cut * 2, 3);
    c.fillStyle = theme.accent; c.globalAlpha = baseAlpha*rimBuild*(.72 + active * .28);
    c.fillRect(-w / 2 + cut + 6, -h / 2 + 4, w - cut * 2 - 12, 3);
    c.fillStyle = '#02090d'; c.fillRect(-w / 2 + cut, h / 2 - 5, w - cut * 2, 5);

    // Recessed wall and a substantially darker cavity.
    c.globalAlpha=baseAlpha*depthBuild;
    fillStep(c, w - 14, h - 12, Math.max(4, cut - 3), theme.inner, 1);
    fillStep(c, w - 28, h - 20, Math.max(3, cut - 5), theme.deep, 3 + entering * 2);
    c.fillStyle = '#000203';
    c.fillRect(-w / 2 + cut + 15, 3, w - cut * 2 - 30, Math.max(4, h / 2 - 8));

    // Shared mechanical bolts/notches.
    const boltY = -h / 2 + 7;
    for (const side of [-1, 1]) {
      c.globalAlpha = baseAlpha*rimBuild;
      c.fillStyle = '#061015';
      c.fillRect(side * (w / 2 - cut - 5) - 2, boltY - 2, 5, 5);
      c.fillStyle = theme.highlight;
      c.globalAlpha = baseAlpha*rimBuild*.65;
      c.fillRect(side * (w / 2 - cut - 5) - 1, boltY - 1, 2, 2);
    }

    // Four restrained energy segments move deterministically with phase.
    const slots = 8, lit = Math.floor((((visual.phase || 0) % 1) + 1) % 1 * slots);
    for (let i = 0; i < 4; i++) {
      const slot = (lit + i * 2) % slots;
      const px = mix(-w / 2 + cut + 18, w / 2 - cut - 30, slot / (slots - 1));
      c.globalAlpha = baseAlpha*energyBuild*(.28 + pulse * .32 + active * .35);
      c.fillStyle = i === 0 ? theme.highlight : theme.glow;
      c.fillRect(Math.round(px), -h / 2 + 7, 12, 3);
    }

    // Entry reaction tightens and brightens the inner ring without soft glow.
    if (active > .01) {
      c.globalAlpha = baseAlpha*Math.max(active,energyBuild*.18);
      c.strokeStyle = theme.accent; c.lineWidth = 2;
      steppedPath(c, w - 20, h - 16, Math.max(3, cut - 4)); c.stroke();
      c.fillStyle = theme.highlight;
      c.fillRect(-Math.round(w * .12), -h / 2 + 4, Math.round(w * .24), 2);
    }

    c.restore();
  }

  // Repaint only the near half of a hatch above actors during chapter
  // transitions. The full hatch belongs to the rear scene canvas; this lip is
  // intentionally isolated so an emerging actor reads as being inside the
  // cavity instead of standing in front of a flat portal graphic.
  function drawFrontLip(c, x, y, width, height, themeName = 'green', visual = {}) {
    const pad = 14;
    c.save();
    c.beginPath();
    c.rect(x - width / 2 - pad, y, width + pad * 2, height / 2 + pad);
    c.clip();
    draw(c, x, y, width, height, themeName, visual);
    c.restore();
  }

  window.PortalArt = { draw, drawFrontLip, themes: THEMES };
})();
