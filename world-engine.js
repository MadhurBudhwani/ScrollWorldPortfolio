/* Shared game engine for the three mobile worlds.
   Backgrounds come from TraceRenderer. This adds the things that make a world feel played
   rather than read: an avatar who walks, works and reacts, a pet that actually fires,
   threats that come apart, a bubble that talks, and stage transitions.

   R1 — movement is the priority. Nothing here uses a linear lerp. Positions run on a
   critically damped spring so every start eases in, every stop eases out, and the body
   leans into its own acceleration. */
(() => {
  'use strict';
  const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  class Spring {
    constructor(value = 0, stiffness = 9) { this.x = value; this.v = 0; this.target = value; this.k = stiffness; }
    set(v) { this.x = this.target = v; this.v = 0; }
    step(dt) {
      const k = this.k, d = this.target - this.x, offset = this.x - this.target;
      const c = this.v + k * offset, decay = Math.exp(-k * Math.max(0,dt));
      this.x = this.target + (offset + c * dt) * decay;
      this.v = (this.v - k * c * dt) * decay;
      if (Math.abs(d) < .05 && Math.abs(this.v) < .05) { this.x = this.target; this.v = 0; }
      return this.x;
    }
  }

  /* ---------------- Avatar ---------------- */
  class Actor {
    constructor(layer, { scale = .52, ground = .78 } = {}) {
      this.node = el('div', 'player world-actor');
      const img = el('img'); img.alt = ''; img.src = './assets/madhur-character.png';
      this.node.append(img);
      layer.append(this.node);
      this.anim = window.AvatarAnimator ? new window.AvatarAnimator(this.node) : null;
      this.x = new Spring(0, 7);       // travel — soft and weighty
      this.lean = new Spring(0, 12);   // tilt, driven by acceleration
      this.bump = new Spring(0, 22);   // quick reaction pulse
      this.baseScale = scale; this.ground = ground;
      this.facing = 1; this.busy = null; this.working = false; this.time = 0; this.headY = 0;
    }
    place(px) { this.x.set(px); }
    walkTo(px) { this.x.target = px; }

    /* Walk over, play an interaction, then resolve. He does the thing — the user never
       presses a button that skips him. */
    perform(px, interaction, hold = 1.1) {
      return new Promise(resolve => { this.busy = { interaction, hold, t: 0, phase: 'walk', resolve }; this.x.target = px; });
    }
    /* Settle in and keep working — this is what he does while you play. */
    workAt(px) { this.working = true; this.x.target = px; }
    stopWorking() { this.working = false; }
    /* A short physical acknowledgement: a nod of the whole body. */
    react(strength = 1) { this.bump.x = -7 * strength; this.bump.v = 0; this.bump.target = 0; }

    update(dt, W, H) {
      this.time += dt;
      const before = this.x.v;
      const x = this.x.step(dt);
      const accel = (this.x.v - before) / Math.max(dt, .001);
      this.lean.target = clamp(-accel * .0016, -7, 7);
      const lean = this.lean.step(dt);
      const bump = this.bump.step(dt);

      let moving = Math.abs(this.x.v) > 8;
      if (moving) this.facing = this.x.v > 0 ? 1 : -1;

      let interaction = null;
      if (this.busy) {
        const b = this.busy;
        if (b.phase === 'walk') {
          if (Math.abs(this.x.target - x) < 3 && Math.abs(this.x.v) < 14) { b.phase = 'act'; b.t = 0; }
        } else {
          b.t += dt; moving = false; interaction = b.interaction;
          if (b.t >= b.hold) { this.busy = null; interaction = null; b.resolve(); }
        }
      } else if (this.working && !moving) {
        interaction = 'read';   // head down over the laptop
      }

      const y = H * this.ground;
      const s = this.baseScale * (H / 720);
      /* transform-origin is the feet, so the layout box stays 232px tall however we scale. */
      this.node.style.setProperty('--player-s', s.toFixed(3));
      this.node.style.setProperty('--facing', String(this.facing));
      this.node.style.left = x + 'px';
      this.node.style.top = (y - 232) + 'px';
      this.node.style.rotate = (lean + bump * .4).toFixed(2) + 'deg';
      this.anim?.update(dt, { moving, direction: this.facing, interaction, choreographyTime: this.time });
      this.headY = y - 232 * s * .92;
      return { x, y };
    }
  }

  /* ---------------- Pet ---------------- */
  class Pet {
    constructor(layer) {
      this.node = el('canvas', 'world-pet'); this.c = this.node.getContext('2d'); layer.append(this.node);
      this.x = new Spring(0, 5); this.cooldown = 0; this.t = 0; this.shots = []; this.recoil = 0; this.ground=.84;
    }
    follow(px) { this.x.target = px; }
    fire(bug) {
      if (this.cooldown > 0 || bug.dead || this.shots.some(s=>s.bug===bug)) return false;
      this.cooldown = 1.6; this.recoil = 1;
      this.shots.push({t:0,life:.58,bug,fromX:this.x.x+15,fromY:this.floor-36,hit:false});
      return true;
    }
    clear() { this.shots=[]; this.cooldown=0; }
    update(dt,W,H) {
      const dpr=Math.min(devicePixelRatio||1,1.5);
      if (this.w!==W || this.h!==H) {
        this.w=W;this.h=H;this.node.width=Math.round(W*dpr);this.node.height=Math.round(H*dpr);
        this.node.style.width=W+'px';this.node.style.height=H+'px';
        this.c.setTransform(dpr,0,0,dpr,0,0);this.c.imageSmoothingEnabled=false;
      }
      this.t+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.recoil=Math.max(0,this.recoil-dt*4);
      const x=this.x.step(dt),y=H*this.ground;this.floor=y;
      const c=this.c;c.clearRect(0,0,W,H);
      if(window.companionAtlas?.complete&&window.companionAtlas.naturalWidth&&window.companionSprites){
        // sprite[0] = sitting upright dog
        const frame=window.companionSprites[0];
        const width=clamp(W*.17,56,92),height=width*frame[3]/frame[2];
        const bob=Math.sin(this.t*1.1)*.9;
        c.save();if(this.recoil>0)c.translate(this.recoil*-3,0);
        c.drawImage(window.companionAtlas,...frame,x-width/2,y-height+bob,width,height);
        c.restore();
      }
      for(const shot of this.shots){
        shot.t+=dt;
        const u=clamp(shot.t/shot.life,0,1);
        const ex=shot.bug.x,ey=shot.bug.y-24;
        // World coordinates keep the projectile aligned while the companion moves.
        const px=shot.fromX+(ex-shot.fromX)*u;
        const py=shot.fromY+(ey-shot.fromY)*u-Math.sin(u*Math.PI)*42;
        c.save();c.lineCap='round';c.strokeStyle='#83eafa99';c.lineWidth=3;c.shadowColor='#75e8ff';c.shadowBlur=10;
        c.beginPath();c.moveTo(px-(ex-shot.fromX)*.06,py+4);c.lineTo(px,py);c.stroke();
        c.fillStyle='#e9fdff';c.beginPath();c.arc(px,py,3.5,0,Math.PI*2);c.fill();
        if(u>=1){
          if(!shot.hit){shot.hit=true;if(!shot.bug.dead){shot.bug.hp=1;shot.bug.damage();}}
          c.fillStyle='#ffd996';
          const spread=9+(shot.t-shot.life)*100;
          for(let i=0;i<8;i++){const angle=i*Math.PI/4;c.fillRect(ex+Math.cos(angle)*spread-2,ey+Math.sin(angle)*spread-2,4,4);}
        }
        c.restore();
      }
      this.shots=this.shots.filter(s=>s.t<s.life+.16);
      return {x,y};
    }
  }

  /* ---------------- Threats ---------------- */
  /* The threat sprites arrive on a white card like every other icon, so they go through
     the same edge flood-fill. Until the transparent copy is ready we draw the stand-in. */
  const ART = {};
  function bugArt(name) {
    if (!ART[name]) {
      const im = new Image();
      im.broken = true;
      ART[name] = im;
      const cut = window.TraceRenderer?.cutout
        ? window.TraceRenderer.cutout('./assets/worlds/' + name + '.webp', 128)
        : Promise.resolve(null);
      cut.then(url => { if (!url) return; im.onload = () => { im.broken = false; }; im.src = url; });
    }
    return ART[name];
  }

  class Bug {
    constructor(layer, { pattern = 'crawl', from = 1, y = .78, speed = 26, hp = 1, target = .5 }) {
      this.layer = layer;
      this.node = el('button', 'world-bug ' + pattern);
      this.node.type = 'button';
      this.node.setAttribute('aria-label', 'Squash the bug');
      this.canvas = el('canvas'); this.canvas.width = this.canvas.height = 64;
      this.c = this.canvas.getContext('2d'); this.c.imageSmoothingEnabled = false;
      this.node.append(this.canvas); layer.append(this.node);
      this.pattern = pattern; this.dir = from; this.yFrac = y; this.speed = speed;
      this.hp = hp; this.maxHp = hp; this.target = target;
      this.p = from > 0 ? -.08 : 1.08; this.t = Math.random() * 6; this.dead = false; this.hit = 0;
      this.node.classList.add('arriving');
    }
    /* Scatter the parts — it was a machine, so it comes apart like one. */
    scatter() {
      for (let i = 0; i < 8; i++) {
        const d = el('i', 'debris');
        d.style.left = this.x + 'px'; d.style.top = (this.y - 18) + 'px';
        d.style.setProperty('--dx', ((Math.random() - .5) * 95).toFixed(0) + 'px');
        d.style.setProperty('--dy', (-28 - Math.random() * 46).toFixed(0) + 'px');
        d.style.setProperty('--rot', ((Math.random() - .5) * 460).toFixed(0) + 'deg');
        d.style.background = i % 3 ? '#8ea6b8' : '#f3cc70';
        this.layer.append(d);
        setTimeout(() => d.remove(), 950);
      }
    }
    damage() {
      if (this.dead) return false;
      this.hp--; this.hit = 1;
      if (this.hp > 0) {
        this.node.classList.add('clanged');
        setTimeout(() => this.node.classList.remove('clanged'), 220);
        return false;
      }
      this.dead = true; this.node.classList.add('squashed'); this.scatter();
      setTimeout(() => this.node.remove(), 900);
      return true;
    }
    update(dt, W, H) {
      if (this.dead) return;
      this.t += dt;
      this.hit = Math.max(0, this.hit - dt * 3);
      if (!this.attacking) this.p += (this.dir * this.speed / W) * dt;
      let x = this.p * W, y = H * this.yFrac;
      if (this.pattern === 'fly') y = H * (this.yFrac - .22) + Math.sin(this.t * 1.8 + this.p * 7) * H * .07;
      if (this.pattern === 'rail') y = H * (this.yFrac - .06);
      const s = clamp(Math.min(W / 375, H / 760), .40, .58) * (1 + this.hit * .12);
      this.node.style.left = (x - 32 * s) + 'px';
      this.node.style.top = (y - 58 * s) + 'px';  // bottom rests on the floor line
      this.node.style.width = this.node.style.height = (64 * s) + 'px';
      this.x = x; this.y = y;
      this.draw();
      const arrived = this.dir > 0 ? this.p >= this.target - .02 : this.p <= this.target + .02;
      if (arrived && !this.attacking) { this.attacking = true; this.node.classList.add('biting'); }
      return arrived;
    }
    draw() {
      const c = this.c, t = this.t, armoured = this.maxHp > 1;
      const art = bugArt(armoured ? 'icon-bug-armour' : 'icon-bug');
      c.clearRect(0, 0, 64, 64);
      if (art.complete && art.naturalWidth && !art.broken) {
        const step = Math.sin(t * 12) * 1.4;           // scuttle
        c.save(); c.translate(32, 32 + step); c.scale(this.dir, 1);
        if (this.hit > 0) { c.shadowColor = '#ffd9e4'; c.shadowBlur = 18 * this.hit; }
        c.drawImage(art, -32, -32, 64, 64); c.restore();
        return;
      }
      /* Stand-in until the sprite lands: silhouette still reads at phone size. */
      const legs = Math.sin(t * 14) * 3;
      c.save(); c.translate(32, 34); c.scale(this.dir, 1);
      c.strokeStyle = armoured ? '#d8e6f2' : '#9fb6c8'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(i * 7, 4); c.lineTo(i * 7 - 11, 15 + legs * (i ? 1 : -1)); c.stroke();
        c.beginPath(); c.moveTo(i * 7, 4); c.lineTo(i * 7 + 11, 15 - legs * (i ? 1 : -1)); c.stroke();
      }
      c.fillStyle = armoured ? '#3b4a5e' : '#27333f';
      c.beginPath(); c.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = armoured ? '#f3cc70' : '#546679'; c.lineWidth = 2; c.stroke();
      const glow = this.hit > 0 ? '#ffd9e4' : '#f58caf';
      c.fillStyle = glow; c.shadowColor = glow; c.shadowBlur = 12;
      c.beginPath(); c.arc(7, -3, 3.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(-3, -4, 2.4, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }

  /* ---------------- Speech ---------------- */
  /* Two layers, always: a plain sentence anyone can read, and the real term underneath
     for engineers scanning keywords. The frame lives in speech-bubble.css so the desktop
     scrollworld and the mobile worlds speak in the same voice. */
  const ICON_CACHE = {};
  function iconURL(name) {
    if (!name) return Promise.resolve(null);
    if (!ICON_CACHE[name]) {
      ICON_CACHE[name] = window.TraceRenderer?.cutout
        ? window.TraceRenderer.cutout('./assets/worlds/icon-' + name + '.webp')
        : Promise.resolve(null);
    }
    return ICON_CACHE[name];
  }

  class Bubble {
    constructor(layer, { name = 'Madhur Budhwani' } = {}) { this.layer = layer; this.node = null; this.name = name; this._reveal = null; this._resolve = null; this.anchor = null; }

    /* anchor: { x, headY } — it sits above his head and the tail points at him. */
    say(text, tag, { anchor = null, cta = 'Tap to continue', logo = null, tone = '' } = {}) {
      return new Promise(resolve => {
        this.clear();
        const b = el('div', 'world-bubble' + (tone ? ' ' + tone : ''));
        const head = el('div', 'bubble-head');
        const chip = el('span', 'bubble-logo');
        const nm = el('span', 'bubble-name'); nm.textContent = this.name;
        head.append(nm); b.append(head);
        if (logo) head.prepend(chip);
        if (logo) iconURL(logo).then(url => { if (url && chip.isConnected) { const im = el('img'); im.alt = ''; im.src = url; chip.append(im); } });

        const p = el('p', 'bubble-line typing'); b.append(p);
        const extras = [];
        if (tag) { const s = el('span', 'bubble-tag'); s.textContent = tag; s.style.visibility = 'hidden'; b.append(s); extras.push(s); }
        const go = el('span', 'bubble-cta'); go.textContent = cta; go.style.visibility = 'hidden'; b.append(go); extras.push(go);

        b.setAttribute('role', 'button'); b.tabIndex = 0;
        this.layer.append(b); this.node = b; this._resolve = resolve; this.anchor = anchor;
        // Reserve the final line height before typing to keep the frame and tail still.
        p.textContent = text; p.style.minHeight = p.offsetHeight + 'px'; p.textContent = '';
        this.position(b, anchor);

        const gentle = matchMedia('(prefers-reduced-motion: reduce)').matches;
        let i = 0, acc = 0, filled = false;
        const fill = () => {
          filled = true; p.textContent = text; p.classList.remove('typing');
          extras.forEach(n => n.style.visibility = 'visible');
          this._reveal = null; this.position(b, anchor);
        };
        if (gentle) fill();
        else this._reveal = dt => {
          acc += dt;
          while (acc > .018 && i < text.length) { acc -= .018; i++; }
          p.textContent = text.slice(0, i);
          if (i >= text.length) fill();
        };
        /* first tap fills the line, the next one moves on */
        const done = () => { if (!filled) return fill(); this._resolve = null; this.clear(); resolve(true); };
        b.onclick = done;
        b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); done(); } };
        requestAnimationFrame(() => b.classList.add('in'));
        b.focus({ preventScroll: true });
      });
    }

    /* Above his head, inside the screen, tail aimed at him. */
    position(b, anchor) {
      const W = this.layer.clientWidth, H = this.layer.clientHeight;
      anchor = typeof anchor === 'function' ? anchor() : anchor;
      const ax = anchor ? anchor.x : W / 2;
      const half = b.offsetWidth / 2 + 10;
      const left = clamp(ax, half, Math.max(half, W - half));
      b.style.left = left + 'px';
      const headY = anchor ? anchor.headY : H * .6;
      const header = this.layer.parentElement.querySelector('header');
      const minTop = (header?.offsetHeight || 64) + 12;
      b.style.top = clamp(headY - b.offsetHeight - 22, minTop, Math.max(minTop, H - b.offsetHeight - 85)) + 'px';
      b.style.bottom = 'auto';
      b.style.setProperty('--tail', clamp(ax - left + b.offsetWidth / 2 - 13, 12, Math.max(12, b.offsetWidth - 40)) + 'px');
    }

    /* Passing chatter that never blocks play. */
    hint(text) {
      this.clearHints();
      const h = el('div', 'world-hint'); h.textContent = text;
      this.layer.append(h);
      requestAnimationFrame(() => h.classList.add('in'));
      setTimeout(() => { h.classList.remove('in'); setTimeout(() => h.remove(), 400); }, 3000);
    }
    tick(dt) { this._reveal?.(dt); if(this.node) this.position(this.node,this.anchor); }
    clear() { if (this.node) { this.node.remove(); this.node = null; } this._reveal = null; if(this._resolve){this._resolve(false);this._resolve=null;} }
    clearHints() { this.layer.querySelectorAll('.world-hint').forEach(n=>n.remove()); }
  }

  /* ---------------- Stage transition ---------------- */
  /* The old view breaking apart under the discharge. Shards carry a snapshot of
     the frame they came from, so what flies away is the scene the visitor was
     just looking at rather than a grid of grey tiles. The fracture starts at
     `origin` and runs outward, and every shard travels along its own radial
     from that point, which is what makes it read as a blast instead of gravity. */
  function shatter(host, { origin = { x: .5, y: .45 }, cols = 12, tone = '#84f5ad', snapshot = null, ms = 980 } = {}) {
    return new Promise(resolve => {
      const r = host.getBoundingClientRect();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const veil = el('div', 'world-shatter is-gentle');
        host.append(veil);
        return setTimeout(() => { veil.remove(); resolve(); }, 320);
      }
      const rows = Math.max(7, Math.round(cols * r.height / r.width));
      const wrap = el('div', 'world-shatter');
      wrap.style.setProperty('--tone', tone);

      const ring = el('i', 'shock');
      ring.style.left = (origin.x * 100) + '%';
      ring.style.top = (origin.y * 100) + '%';
      wrap.append(ring);

      const reach = Math.hypot(Math.max(origin.x, 1 - origin.x), Math.max(origin.y, 1 - origin.y));
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const cx = (x + .5) / cols, cy = (y + .5) / rows;
        const vx = cx - origin.x, vy = cy - origin.y;
        const dist = Math.hypot(vx, vy), unit = dist || .0001;
        const near = 1 - Math.min(1, dist / reach);          // closest shards take the most force
        const brick = el('i', 'shard');
        brick.style.left = (x / cols * 100) + '%'; brick.style.top = (y / rows * 100) + '%';
        brick.style.width = (100 / cols) + '%'; brick.style.height = (100 / rows) + '%';
        if (snapshot) {
          brick.style.backgroundImage = 'url(' + snapshot + ')';
          brick.style.backgroundSize = r.width + 'px ' + r.height + 'px';
          brick.style.backgroundPosition = (-x / cols * r.width) + 'px ' + (-y / rows * r.height) + 'px';
        }
        const throwBy = 120 + near * 460;
        brick.style.setProperty('--dx', (vx / unit * throwBy).toFixed(0) + 'px');
        brick.style.setProperty('--dy', (vy / unit * throwBy + 90).toFixed(0) + 'px');
        brick.style.setProperty('--rot', ((Math.random() - .5) * (60 + near * 200)).toFixed(0) + 'deg');
        brick.style.setProperty('--lit', (near * .85).toFixed(2));
        brick.style.animationDelay = (dist / reach * 260 + Math.random() * 60) + 'ms';
        wrap.append(brick);
      }
      host.append(wrap);
      setTimeout(() => { wrap.remove(); resolve(); }, ms);
    });
  }
  // Kept for callers that just want the plain break, with no blast point.
  function disintegrate(host) { return shatter(host, { cols: 9, ms: 900 }); }

  window.WorldEngine = { Spring, Actor, Pet, Bug, Bubble, disintegrate, shatter };
})();
