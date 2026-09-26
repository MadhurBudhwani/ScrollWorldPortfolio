/* Asset-driven backend train.

   The artwork carries the bodies; this module carries the geometry the rest of
   the scene already agrees on. Two contracts must hold or the avatar walks in
   mid-air:

     deck  = +100  the bottom of every chassis, shared by engine and carriages
     rail  = +138  where the tyres meet the line (unchanged from the old train)

   so a part's walkable roof is `deck - bodyHeight`, which lands the carriages
   at -100 and the engine at -124 — exactly the values scenePose() already uses.
   Each body is therefore scaled by its ROOF-TO-DECK distance rather than by its
   width, which is why the yellow wagon ends up a few pixels longer than the
   blue one: its art carries a taller roof vent. Alternating the two keeps every
   coupling gap identical, and keeps the avatar's feet at one height. */
(() => {
  'use strict';

  const DECK = 100, RAIL = 138;
  const CAR_BODY = 200, ENGINE_BODY = 224;   // roof-to-deck, in local units
  const GAP = 500;                            // wagon pitch, in local units
  const WHEEL = .112;                         // tyre diameter as a fraction of body width

  /* Measured off the trimmed source art, as fractions of each image's own
     height. `roof` is the walkable deck; the chassis bottom is the image
     bottom, so the axle fractions below are shared by all three parts.
     `textCenter` is the optical centre of the clean nameplate area. Labels are
     centred as a block around it, so one-line skills no longer hang from the
     same high top edge used by two-line skills. */
  const AXLES = [.166, .305, .697, .836];
  const PARTS = {
    engine: {
      file: 'backend-body.png', roof: .247, textCenter: .568, textX: -.08,
      labelSize: 31, labelWidth: 300, labelExtrude: 7, labelOutline: 3,
      labelGradient: ['#ffffff', '#dff7ff', '#42b9dc'],
      labelEdge: '#061e35', labelShadow: '#04384f',
    },
    blue:   { file: 'car-blue.png',     roof: .049, textCenter: .460, textX: 0 },
    yellow: { file: 'car-yellow.png',   roof: .115, textCenter: .470, textX: 0 },
  };
  const CARS = ['blue', 'yellow'];

  /* One type size on every wagon, never fitted per label. Longer skill names
     wrap before the clean panel's 255-unit limit, so the typography remains
     consistent instead of shrinking unpredictably from wagon to wagon. */
  const SIZE = 24, LINE_STEP = 27, MAX_LINE = 255;
  const FILL = '#f4fbff', EDGE = '#0a1e39', EXTRUDE = 3, OUTLINE = 2.4;
  const font = size => `700 ${size}px PixeloidSansBold, monospace`;

  const images = {};
  let pending = 4, fontDone = false;
  const settle = () => { TrainArt.ready = pending === 0 && fontDone; };

  function load(name, file) {
    const img = new Image();
    img.onload = () => { images[name] = img; pending--; settle(); };
    img.onerror = () => { pending--; settle(); };   // the old block train stays on screen
    img.src = './assets/train/' + file;
  }
  for (const [name, part] of Object.entries(PARTS)) load(name, part.file);
  load('wheel', 'wheel.png');

  /* Held back until the face is registered, so no wagon is ever painted in the
     fallback font and then repainted — the train simply arrives correct. A
     failed load still releases the scene rather than stranding it. */
  new FontFace('PixeloidSansBold', "url('./assets/fonts/PixeloidSans-Bold.woff2')", { weight: '700' })
    .load()
    .then(face => { document.fonts.add(face); })
    .catch(() => {})
    .then(() => { fontDone = true; settle(); });

  /* Body box for a part, in the local units the scene draws in. */
  function box(kind) {
    const img = images[kind], part = PARTS[kind];
    if (!img) return null;
    const body = kind === 'engine' ? ENGINE_BODY : CAR_BODY;
    const h = body / (1 - part.roof);
    return { img, part, h, w: h * (img.naturalWidth / img.naturalHeight), top: DECK - body - part.roof * h };
  }

  /* Wheels ride behind the chassis, so only the tyre shows below the skirt.
     They roll off the distance the train has actually covered — no free-running
     clock — which is why a stalled scroll leaves them still. */
  function wheels(b, roll) {
    if (!images.wheel) return;
    const d = b.w * WHEEL, angle = -roll / (d / 2);
    for (const f of AXLES) {
      ctx.save();
      ctx.translate(-b.w / 2 + f * b.w, RAIL - d / 2);
      ctx.rotate(angle);
      ctx.drawImage(images.wheel, -d / 2, -d / 2, d, d);
      ctx.restore();
    }
  }

  /* One line when the name fits the clean panel; otherwise broken at the space
     that leaves the two lines most even, at the same size. Nothing is squeezed. */
  function lines(text, size, maxLine) {
    ctx.font = font(size);
    if (ctx.measureText(text).width <= maxLine) return [text];
    const words = text.split(' ');
    if (words.length < 2) return [text];
    let at = 1, widest = Infinity;
    for (let i = 1; i < words.length; i++) {
      const head = words.slice(0, i).join(' '), tail = words.slice(i).join(' ');
      const w = Math.max(ctx.measureText(head).width, ctx.measureText(tail).width);
      if (w < widest) { widest = w; at = i; }
    }
    return [words.slice(0, at).join(' '), words.slice(at).join(' ')];
  }

  /* Light face, dark edge, and a hard offset extrusion to the bottom right —
     stepped rather than blurred, so it stays a solid block of shadow. */
  function label(text, cx, centerY, size = SIZE, maxLine = MAX_LINE,
    extrude = EXTRUDE, outline = OUTLINE, fillGradient = null,
    edge = EDGE, shadow = EDGE) {
    const rows = lines(text.toUpperCase(), size, maxLine);
    ctx.save();
    ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.shadowBlur = 0;
    rows.forEach((row, i) => {
      const y = centerY + (i - (rows.length - 1) / 2) * LINE_STEP;
      ctx.fillStyle = shadow;
      for (let d = extrude; d >= 1; d--) ctx.fillText(row, cx + d, y + d);
      ctx.strokeStyle = edge; ctx.lineWidth = outline * 2; ctx.strokeText(row, cx, y);
      if (fillGradient) {
        const face = ctx.createLinearGradient(0, y - size * .55, 0, y + size * .55);
        face.addColorStop(0, fillGradient[0]);
        face.addColorStop(.48, fillGradient[1]);
        face.addColorStop(1, fillGradient[2]);
        ctx.fillStyle = face;
      } else ctx.fillStyle = FILL;
      ctx.fillText(row, cx, y);
    });
    ctx.restore();
  }

  /* One part, centred on `screenX` and standing on the scene's rail. */
  function draw(kind, screenX, g, text) {
    const b = box(kind);
    if (!b) return false;
    ctx.save();
    ctx.translate(screenX, g.y); ctx.scale(g.scale, g.scale);
    // Preserve the pixel-art edges on both the reusable body and wheel sprites.
    ctx.imageSmoothingEnabled = false;
    wheels(b, g.roll / g.scale);
    ctx.drawImage(b.img, -b.w / 2, b.top, b.w, b.h);
    if (text) {
      label(text, b.part.textX * b.w, b.top + b.part.textCenter * b.h,
        b.part.labelSize, b.part.labelWidth, b.part.labelExtrude, b.part.labelOutline,
        b.part.labelGradient, b.part.labelEdge, b.part.labelShadow);
      registerMascotTarget(text, 0, b.top + b.h / 2, b.w * .86, b.h * .8);
    }
    ctx.restore();
    return true;
  }

  /* Couplings are drawn between the shells rather than baked into them, so
     adding a wagon never leaves a floating bar behind. */
  function coupling(g, leftEdge, rightEdge) {
    const y = g.y + 66 * g.scale;
    line([[leftEdge, y], [rightEdge, y]], '#5d8390', 6 * g.scale);
    line([[leftEdge, y - 5 * g.scale], [rightEdge, y - 5 * g.scale]], '#8fb6c0', 2 * g.scale);
  }

  const TrainArt = {
    ready: false, GAP, DECK, RAIL, CARS,
    /* Which body a wagon uses. Alternating keeps every coupling gap equal. */
    car: i => CARS[i % CARS.length],
    width: kind => { const b = box(kind); return b ? b.w : 0; },
    /* A landmark on a part's art, in local units — the chimney mouth sits at
       (.185, .03), so the steam keeps its place if the body is ever resized. */
    point(kind, fx, fy) { const b = box(kind); return b && { x: -b.w / 2 + fx * b.w, y: b.top + fy * b.h }; },
    /* The engine sits its own half-width clear of the first wagon instead of a
       flat `-gap`, because the locomotive art is longer than a carriage. */
    engineOffset() {
      const e = box('engine'), c = box(CARS[0]);
      return e && c ? e.w / 2 + c.w / 2 + 24 : GAP;
    },
    draw, coupling,
  };
  window.TrainArt = TrainArt;
})();
