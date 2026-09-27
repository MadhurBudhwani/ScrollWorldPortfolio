/* Full-bleed scenery for Trace: warped backdrop, bloom, dim overlay, pointer/tilt parallax.
   Backgrounds swap per station. New TRACE art lands in ART below; until a file exists the
   renderer falls back to an already-shipped scene so the world always runs. */
window.TraceRenderer = class {
  // Station key -> preferred artwork, then fallback that already exists on disk.
  static ART = {
    arrival: ['9.webp', '6.webp'],
    fork:    ['10.webp', '7.webp'],
    analyze: ['11.webp', '8.webp'],
    galaxy:  ['12.webp', '7.webp'],
    answer:  ['13.webp', '8.webp'],
  };

  constructor(host, art) {
    this.artMap = art || TraceRenderer.ART;
    this.host = host;
    this.canvas = document.getElementById('scenery');
    this.c = this.canvas.getContext('2d');
    this.buffer = document.createElement('canvas');
    this.bc = this.buffer.getContext('2d');
    this.scene = Object.keys(this.artMap)[0]; this.previous = this.scene; this.blend = 1;
    this.time = 0; this.last = 0; this.camera = { x: 0, y: 0 }; this.target = { x: 0, y: 0 };
    this.gentle = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.dim = 0.39;  // 0..1 — how hard the art is knocked back behind the UI
    this.images = {};
    this.ready = this.load();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    const tick = t => {
      const dt = Math.min(.04, this.last ? (t - this.last) / 1000 : 0); this.last = t;
      if (this.loaded && !document.hidden && !document.querySelector('dialog[open]')) this.draw(dt);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
    addEventListener('pagehide', () => cancelAnimationFrame(this.frame));
    addEventListener('pageshow', e => { if (e.persisted) { this.last = 0; this.frame = requestAnimationFrame(tick); } });
  }

  /* Icons arrive on a white card. Remove only the white CONNECTED TO THE EDGE, so the
     white armour plates inside each icon survive. Downscaled first — they render small. */
  static assets = new Map();
  static asset(src, size = 256, prefer = null) {
    const key = src + ':' + size;
    // prefer:'webp' is for art that has already been cut out and shipped as a
    // transparent WebP with no PNG twin. Without it every one of those frames
    // spends a 404 round-trip on a .png that was never there.
    if (prefer === 'webp' && !this.assets.has(key))
      this.assets.set(key, this.fromWebp(src.replace(/\.png$/i, '.webp'), size));
    if (!this.assets.has(key)) this.assets.set(key, new Promise(resolve => {
      const png = src.replace(/\.(webp|png)$/i, '.png');
      const img = new Image();
      img.onload = async () => {
        try { await img.decode(); } catch { /* onload already confirmed a usable image */ }
        resolve(png);
      };
      img.onerror = () => this.fromWebp(src.replace(/\.png$/i, '.webp'), size).then(resolve);
      img.src = png;
    }));
    return this.assets.get(key);
  }
  /* No PNG twin. A WebP that already carries alpha is a finished cutout and can
     be used straight from disk; only the older white-card art needs the flood
     fill, which re-encodes to a PNG data URL and would throw away everything the
     WebP saved. Probe a tiny downscale rather than the full frame. */
  static fromWebp(src, size = 256) {
    return new Promise(resolve => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 8;
        const c = cv.getContext('2d', { willReadFrequently: true });
        c.drawImage(img, 0, 0, 8, 8);
        try {
          const d = c.getImageData(0, 0, 8, 8).data;
          for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return resolve(src);
        } catch { return resolve(src); }
        this.removeLegacyWhite(src, size).then(resolve);
      };
      img.src = src;
    });
  }
  // Compatibility for older callers. Supplied PNGs never go through flood fill.
  static cutout(src, size = 256) { return this.asset(src, size); }
  static removeLegacyWhite(src, size = 256, tol = 234) {
    return new Promise(resolve => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = cv.height = size;
        const c = cv.getContext('2d', { willReadFrequently: true });
        c.imageSmoothingEnabled = false;
        c.drawImage(img, 0, 0, size, size);
        let d;
        try { d = c.getImageData(0, 0, size, size); } catch { return resolve(src); }
        const p = d.data, seen = new Uint8Array(size * size), stack = [];
        const isWhite = i => p[i * 4] >= tol && p[i * 4 + 1] >= tol && p[i * 4 + 2] >= tol;
        for (let x = 0; x < size; x++) stack.push(x, (size - 1) * size + x);
        for (let y = 0; y < size; y++) stack.push(y * size, y * size + size - 1);
        while (stack.length) {
          const i = stack.pop();
          if (seen[i] || !isWhite(i)) continue;
          seen[i] = 1; p[i * 4 + 3] = 0;
          const x = i % size, y = (i / size) | 0;
          if (x > 0) stack.push(i - 1);
          if (x < size - 1) stack.push(i + 1);
          if (y > 0) stack.push(i - size);
          if (y < size - 1) stack.push(i + size);
        }
        c.putImageData(d, 0, 0);
        resolve(cv.toDataURL('image/png'));
      };
      img.src = src;
    });
  }

  // Try each candidate in turn; resolve with the first that decodes.
  static pick(list) {
    return new Promise(resolve => {
      let i = 0;
      const attempt = () => {
        if (i >= list.length) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => { i++; attempt(); };
        img.src = './assets/worlds/' + list[i];
      };
      attempt();
    });
  }

  async load() {
    const keys = Object.keys(this.artMap);
    const picked = await Promise.all(keys.map(k => TraceRenderer.pick(this.artMap[k])));
    keys.forEach((k, i) => { if (picked[i]) this.images[k] = picked[i]; });
    this.loaded = Object.keys(this.images).length > 0;
    return this.loaded;
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.dpr = Math.min(devicePixelRatio || 1, 1.5);
    for (const cv of [this.canvas, this.buffer]) { cv.width = Math.round(this.w * this.dpr); cv.height = Math.round(this.h * this.dpr); }
    for (const c of [this.c, this.bc]) { c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.imageSmoothingEnabled = false; }
  }

  set(scene) {
    if (!this.images[scene] || scene === this.scene) return;
    this.previous = this.scene; this.scene = scene; this.blend = 0;
  }

  warp(img, alpha) {
    if (!img) return;
    const { w: W, h: H } = this, t = this.gentle ? 0 : this.time;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight) * (1.09 + Math.sin(t * .11) * .022);
    const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
    const ox = (W - iw) / 2 - this.camera.x * 20, oy = (H - ih) / 2 - this.camera.y * 15;
    const c = this.bc, slices = 40, step = img.naturalHeight / slices;
    c.save(); c.globalAlpha = alpha;
    for (let i = 0; i < slices; i++) {
      const sy = i * step;
      const shift = this.gentle ? 0 : Math.sin(sy * .019 + t * .7) * 3.1 + Math.sin(sy * .006 - t * .38) * 2.1;
      c.drawImage(img, 0, sy, img.naturalWidth, Math.min(step + 1, img.naturalHeight - sy),
        ox + shift, oy + sy * scale, iw, step * scale + 1.2);
    }
    c.restore();
  }

  draw(dt) {
    this.time += dt;
    this.blend = Math.min(1, this.blend + dt * 1.6);
    const ease = 1 - Math.exp(-dt * 3);
    this.camera.x += ((this.gentle ? 0 : this.target.x) - this.camera.x) * ease;
    this.camera.y += ((this.gentle ? 0 : this.target.y) - this.camera.y) * ease;
    const { w: W, h: H, c, bc } = this;
    bc.clearRect(0, 0, W, H);
    this.warp(this.images[this.previous], 1);
    if (this.scene !== this.previous) this.warp(this.images[this.scene], this.blend);
    if (this.blend >= 1) this.previous = this.scene;

    c.clearRect(0, 0, W, H);
    c.drawImage(this.buffer, 0, 0, this.buffer.width, this.buffer.height, 0, 0, W, H);
    if (!this.gentle) {
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = .13; c.filter = 'blur(11px)';
      c.drawImage(this.buffer, 0, 0, this.buffer.width, this.buffer.height, 0, 0, W, H); c.restore();
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = .05;
      c.drawImage(this.buffer, 0, 0, this.buffer.width, this.buffer.height, 3 + this.camera.x * 2, 1, W, H); c.restore();
    }
    // Dim so the floating copy stays readable.
    // The TRACE artwork is already authored dark, so this only needs a light seat.
    c.globalAlpha = this.dim; c.fillStyle = '#04081a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    const v = c.createRadialGradient(W / 2, H * .45, W * .2, W / 2, H * .5, H * .78);
    v.addColorStop(0, '#04081a00'); v.addColorStop(1, 'rgba(3,6,18,' + (0.18 + this.dim * 0.9).toFixed(2) + ')');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    // Travelling telemetry motes.
    if (!this.gentle) for (let i = 0; i < 20; i++) {
      const x = ((i * 127.3 - this.camera.x * 18) % W + W) % W;
      const y = ((i * 91.7 - this.time * 26 * (1 + i % 3 * .4)) % H + H) % H;
      c.fillStyle = i % 3 ? '#8fd6ff55' : '#b9a6ff66';
      c.fillRect(x, y, 1.5, i % 5 ? 1.5 : 4);
    }
  }
};
