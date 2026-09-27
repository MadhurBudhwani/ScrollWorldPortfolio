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
  // Where the companion's chest gem sits inside its sprite.
  const CHEST = { x: .819, y: .499 };

  class Pet {
    constructor(layer) {
      this.node = el('canvas', 'world-pet'); this.c = this.node.getContext('2d'); layer.append(this.node);
      this.x = new Spring(0, 5); this.cooldown = 0; this.t = 0; this.shots = []; this.recoil = 0; this.ground=.84;
    }
    follow(px) { this.x.target = px; }
    /* A beam, not a lob. The aim point is taken once, at the moment of firing,
       so the shot stays a straight line instead of curving after a bug that
       has since moved. */
    fire(bug) {
      if (this.cooldown > 0 || bug.dead || this.shots.some(s=>s.bug===bug)) return false;
      this.cooldown = 1.6; this.recoil = 1;
      const m=this.muzzle||{x:this.x.x+15,y:this.floor-36};
      this.shots.push({t:0,life:.26,bug,hit:false,
        fromX:m.x,fromY:m.y,toX:bug.x,toY:bug.y-24});
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
        // The beam leaves the blue gem on his chest. Measured off the sprite at
        // 81.9% across and 49.9% down, so it tracks his size and bob instead of
        // being a pair of pixel offsets that drift the moment either changes.
        this.muzzle={x:x-width/2+width*CHEST.x, y:y-height+bob+height*CHEST.y};
      }
      for(const shot of this.shots){
        shot.t+=dt;
        const u=clamp(shot.t/shot.life,0,1);
        // The bolt crosses in the first fifth; the rest of the life is the beam
        // burning out, which is what makes it read as a beam and not a pellet.
        const reach=clamp(u/.2,0,1), fade=1-clamp((u-.2)/.8,0,1);
        const hx=shot.fromX+(shot.toX-shot.fromX)*reach;
        const hy=shot.fromY+(shot.toY-shot.fromY)*reach;
        c.save();c.lineCap='round';c.shadowColor='#75e8ff';
        // Three passes: bloom, body, white-hot centre.
        const pass=[[11,.16,'#3fd2ff',18],[4,.7,'#8fefff',10],[1.4,1,'#ffffff',0]];
        for(const [w,a,col,blur] of pass){
          c.globalAlpha=a*fade;c.lineWidth=w;c.strokeStyle=col;c.shadowBlur=blur;
          c.beginPath();c.moveTo(shot.fromX,shot.fromY);c.lineTo(hx,hy);c.stroke();
        }
        c.globalAlpha=fade;c.shadowBlur=0;
        // Muzzle flare, brightest on the frame it leaves the companion.
        const muz=(1-clamp(u/.22,0,1))*7;
        if(muz>0){c.fillStyle='#e9fdff';c.beginPath();c.arc(shot.fromX,shot.fromY,muz,0,Math.PI*2);c.fill();}
        if(reach>=1){
          if(!shot.hit){shot.hit=true;if(!shot.bug.dead){shot.bug.hp=1;shot.bug.damage();}}
          const k=clamp((u-.2)/.8,0,1);
          c.globalAlpha=(1-k)*.9;c.strokeStyle='#bff4ff';c.lineWidth=2;
          c.beginPath();c.arc(shot.toX,shot.toY,4+k*26,0,Math.PI*2);c.stroke();
          c.fillStyle='#ffd996';
          for(let i=0;i<8;i++){
            const angle=i*Math.PI/4+shot.t*3,r=6+k*30;
            c.fillRect(shot.toX+Math.cos(angle)*r-2,shot.toY+Math.sin(angle)*r-2,4,4);
          }
        }
        c.restore();
      }
      c.globalAlpha=1;
      this.shots=this.shots.filter(s=>s.t<s.life);
      return {x,y};
    }
  }

  /* The line they came in on, and the threads they are hanging from. Drawn on
     one canvas under the bugs rather than per-bug, because a thread starts above
     its bug and would be clipped by the bug's own box. */
  /* Silk, not rope. The first version hung tendrils off the line to look more
     web-like and did the opposite: evenly spaced stubs of similar length read as
     a fringe, and a fringe reads as decoration. Real silk is almost invisible —
     a couple of long anchor lines, one carrying strand, and light catching it
     here and there. Restraint is the realism. */
  /* Silk.

     Two earlier passes failed the same way: more strands, more beads, more
     tendrils. That is the wrong axis. Evenly weighted lines read as wire or as
     fringe no matter how many you draw, because what makes silk look like silk
     is not its shape, it is how it takes light — it all but disappears along
     most of its length and flares where the light catches it, and where strands
     cross, the light ADDS rather than replacing.

     So the geometry here is deliberately plain and the work is in the render:
     every segment gets its own width and alpha from a smooth noise field, and
     the whole thing is composited additively. */
  class Web {
    constructor(layer) {
      this.node = el('canvas', 'world-web'); this.c = this.node.getContext('2d');
      layer.append(this.node); this.t = 0; this.show = 0; this.grow = 0;
      this.tab = Array.from({ length: 64 }, () => Math.random());
    }
    noise(u, seed) {
      const t = this.tab, n = t.length, x = u * 23 + seed * 9.7;
      const i = Math.floor(x), f = x - i, e = f * f * (3 - 2 * f);
      const a = t[((i % n) + n) % n], b = t[((((i + 1) % n)) + n) % n];
      return a + (b - a) * e;
    }

    line(W, top, sag, bugs) {
      const N = 64, pts = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, x = -6 + (W + 12) * u;
        let y = top + sag * Math.sin(Math.PI * u) ** 1.6;
        for (const b of bugs) {
          if (!b.threadTo || b.dead) continue;
          const d = Math.abs(x - b.threadTo.x) / (W * .22);
          if (d < 1) y += sag * 1.9 * (1 - d * d) ** 2;
        }
        // Micro-kink. Silk is never truly straight, and a perfectly smooth curve
        // is most of what made this read as cable.
        y += (this.noise(u, 3.1) - .5) * 1.3;
        pts.push([x, y]);
      }
      return pts;
    }
    at(pts, x) {
      const last = pts[pts.length - 1][0];
      const i = Math.max(0, Math.min(pts.length - 1, Math.round((x + 6) / (last + 6) * (pts.length - 1))));
      return pts[i][1];
    }
    sample(x, fallback) { return this.pts ? this.at(this.pts, x) : fallback; }

    /* Segment by segment, each with its own weight. Thin to the point of
       vanishing for most of the run, bright for a few. */
    strand(c, pts, from, { width = 1, alpha = 1, seed = 0, colour = '#dfeef8' }) {
      c.strokeStyle = colour; c.lineCap = 'round';
      for (let i = pts.length - 1; i > 0; i--) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i - 1];
        if (x1 < from) break;
        const u = i / pts.length;
        const w = this.noise(u, seed), a = this.noise(u, seed + 2.4);
        c.globalAlpha = alpha * Math.max(0, a * 1.5 - .28);
        c.lineWidth = width * (.25 + w * 1.5);
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      }
    }

    update(dt, W, H, bugs, ropeY, live) {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      if (this.w !== W || this.h !== H) {
        this.w = W; this.h = H;
        this.node.width = Math.round(W * dpr); this.node.height = Math.round(H * dpr);
        this.node.style.width = W + 'px'; this.node.style.height = H + 'px';
        this.c.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this.t += dt;
      this.show = clamp(this.show + (live ? dt * 3 : -dt * 2.4), 0, 1);
      this.grow = clamp(this.grow + (live ? dt / 1.1 : -dt * 2), 0, 1);
      const c = this.c; c.clearRect(0, 0, W, H);
      if (this.show <= .01) return;

      const top = H * ropeY, sag = Math.min(9, H * .011);
      const breath = Math.sin(this.t * .5) * .9;
      const main = this.line(W, top + breath, sag, bugs);
      this.pts = main;
      const from = W * (1 - this.grow) - 8, A = this.show;

      c.save();
      c.globalCompositeOperation = 'lighter';   // crossings add light, as silk does

      this.strand(c, this.line(W, top + breath + 4, sag * 2.4, []), from,
        { width: .8, alpha: A * .3, seed: 5.2 });
      this.strand(c, main, from, { width: 1.5, alpha: A * .62, seed: 1.1 });
      // A hair-thin pass a fraction above the carrying line: the lit upper edge
      // of a round filament, not a second strand.
      this.strand(c, main.map(([x, y]) => [x, y - .7]), from,
        { width: .6, alpha: A * .5, seed: 7.9, colour: '#ffffff' });

      if (this.grow > .92) {
        for (const [ax, dx] of [[W * .1, -34], [W * .88, 34]]) {
          const y = this.at(main, ax);
          const pts = Array.from({ length: 12 }, (_, i) => {
            const k = i / 11;
            return [ax + dx * k + (this.noise(k, ax) - .5) * 1.2, y + (-20 - y) * k];
          });
          this.strand(c, pts, -1e9, { width: .8, alpha: A * .34, seed: ax });
        }
      }
      if (this.grow < 1 && this.grow > .02) {
        c.globalAlpha = A * .8; c.fillStyle = '#eaf7ff';
        c.beginPath(); c.arc(from + 8, this.at(main, from + 8), 1.6, 0, Math.PI * 2); c.fill();
      }

      for (const b of bugs) {
        if (!b.threadTo || b.dead) continue;
        const { x, y } = b.threadTo;
        if (x < from) continue;
        const anchorY = this.at(main, x);
        const swing = (1 - clamp((y - anchorY) / Math.max(1, H * .55), 0, 1)) * 2.6;
        const bend = Math.sin(this.t * 1.4 + x * .03) * swing;
        const pts = Array.from({ length: 16 }, (_, i) => {
          const k = i / 15, e = k * k * (3 - 2 * k);
          return [x + bend * Math.sin(Math.PI * k) + (this.noise(k, x) - .5) * .8,
                  anchorY + (y - 5 - anchorY) * e];
        });
        this.strand(c, pts, -1e9, { width: 1.1, alpha: A * .7, seed: x * .3 });
        c.globalAlpha = A * .5; c.fillStyle = '#eaf7ff';
        c.beginPath(); c.arc(x, anchorY, 1.2, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
    clear() { this.show = 0; this.grow = 0; this.pts = null; if (this.c && this.w) this.c.clearRect(0, 0, this.w, this.h); }
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
    constructor(layer, { pattern = 'crawl', from = 1, y = .78, speed = 26, hp = 1, target = .5,
                         ropeY = .13, dropAt = null, dropSpeed = .10 }) {
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
      /* The rope pattern exists because a phone has almost no horizontal runway:
         a bug that walks in from the edge is on top of you immediately. These
         come in along a line strung across the top, stop somewhere of their own
         choosing, and lower themselves on a thread — which is slow, visible, and
         leaves them hanging still long enough to be dealt with. */
      this.ropeY = ropeY; this.dropSpeed = dropSpeed;
      this.dropAt = dropAt == null ? .18 + Math.random() * .66 : dropAt;
      this.phase = pattern === 'rope' ? 'walk' : 'crawl';
      this.descent = 0;
      this.node.classList.add('arriving');
    }
    /* It was a machine, so it comes apart like one: a short flash, sparks thrown
       off the break, and heavier parts that arc and fall. The flash goes up
       first and dies fastest, so the eye reads the hit before the debris. */
    scatter() {
      const x = this.x, y = this.y - 18, toss = [];
      const blast = el('i', 'blast');
      blast.style.left = x + 'px'; blast.style.top = y + 'px';
      toss.push(blast);

      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + Math.random() * .4;
        const r = 34 + Math.random() * 46;
        const k = el('i', 'spark');
        k.style.left = x + 'px'; k.style.top = y + 'px';
        // The spark is rotated to its angle and then thrown along its own axis,
        // so one length is all it needs.
        k.style.setProperty('--rot', (a * 180 / Math.PI).toFixed(1) + 'deg');
        k.style.setProperty('--len', r.toFixed(0) + 'px');
        k.style.animationDelay = (Math.random() * 40) + 'ms';
        k.style.background = i % 4 ? '#bff4ff' : '#ffe9a8';
        toss.push(k);
      }

      for (let i = 0; i < 8; i++) {
        const d = el('i', 'debris');
        d.style.left = x + 'px'; d.style.top = y + 'px';
        d.style.setProperty('--dx', ((Math.random() - .5) * 95).toFixed(0) + 'px');
        d.style.setProperty('--dy', (-28 - Math.random() * 46).toFixed(0) + 'px');
        d.style.setProperty('--rot', ((Math.random() - .5) * 460).toFixed(0) + 'deg');
        d.style.background = i % 3 ? '#8ea6b8' : '#f3cc70';
        toss.push(d);
      }

      for (const n of toss) this.layer.append(n);
      setTimeout(() => { for (const n of toss) n.remove(); }, 1000);
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
      let x, y;
      if (this.pattern === 'rope') {
        if (this.phase === 'walk') {
          this.p += (this.dir * this.speed * 1.5 / W) * dt;
          const there = this.dir > 0 ? this.p >= this.dropAt : this.p <= this.dropAt;
          if (there) { this.p = this.dropAt; this.phase = 'drop'; }
        } else if (this.phase === 'drop') {
          this.descent = Math.min(1, this.descent + this.dropSpeed * dt);
          if (this.descent >= 1) { this.phase = 'crawl'; this.dir = this.p > this.target ? -1 : 1; }
        } else if (this.phase === 'crawl') {
          // Once it is down it means business: the walk along the rope is a
          // stroll, the run at the desk is not.
          this.p += (this.dir * this.speed * 1.35 / W) * dt;
          const there = this.dir > 0 ? this.p >= this.target : this.p <= this.target;
          // Reaching the desk is not reaching the laptop. It still has to get up
          // there, which is the last moment the player has to stop it.
          if (there && this.goal) { this.phase = 'climb'; this.climb = 0; this.climbFrom = this.p * W; }
        } else if (this.phase === 'climb') {
          this.climb = Math.min(1, this.climb + dt / 1.15);
        }
        x = this.p * W;
        const flat = H * this.ropeY, floor = H * this.yFrac;
        // Walk the drawn curve, and start the drop from wherever on it the bug
        // actually stopped, so it never lets go of thin air.
        const top = this.ropeAt ? this.ropeAt(x) : flat;
        if (this.phase === 'climb') {
          const k = this.climb, e = k * k * (3 - 2 * k);
          x = this.climbFrom + (this.goal.x - this.climbFrom) * e;
          // Up the near face first, then across the top, so it looks like it is
          // hauling itself onto the desk rather than floating to the screen.
          y = floor + (this.goal.y - floor) * Math.min(1, e * 1.35);
        }
        y = this.phase === 'walk' ? top
          : this.phase === 'drop' ? top + (floor - top) * this.descent
          : this.phase === 'climb' ? y
          : floor;
        this.threadTo = this.phase === 'drop' ? { x, y, top } : null;
        /* On the line it hangs underneath, the way anything walking silk does.
           It has to be the right way up by the time it lands though, so the last
           stretch of the descent turns it over rather than snapping it upright
           at the floor. */
        this.upright = this.phase === 'crawl' || this.phase === 'climb' ? 1
          : this.phase === 'drop' ? clamp((this.descent - .8) / .2, 0, 1) : 0;
      } else {
        if (!this.attacking) this.p += (this.dir * this.speed / W) * dt;
        x = this.p * W; y = H * this.yFrac;
        if (this.pattern === 'fly') y = H * (this.yFrac - .22) + Math.sin(this.t * 1.8 + this.p * 7) * H * .07;
        if (this.pattern === 'rail') y = H * (this.yFrac - .06);
      }
      const s = clamp(Math.min(W / 375, H / 760), .40, .58) * (1 + this.hit * .12);
      // Standing: its feet are on the floor line. Hanging: its back is against
      // the silk and the body is below it. The turn-over moves between the two.
      const u = this.upright == null ? 1 : this.upright;
      const e = u * u * (3 - 2 * u);
      this.node.style.left = (x - 32 * s) + 'px';
      // 12 is where the artwork's feet sit inside its 64px box once it is turned
      // over - the sprite carries about 18% empty margin, so anchoring on the box
      // left it floating a body's width under the silk.
      this.node.style.top = (y - (12 + 46 * e) * s) + 'px';
      this.node.style.width = this.node.style.height = (64 * s) + 'px';
      this.x = x; this.y = y;
      this.draw();
      // Only a bug that is actually on the floor can reach what it came for.
      const arrived = this.pattern === 'rope'
        ? this.phase === 'climb' && this.climb >= 1
        : (this.dir > 0 ? this.p >= this.target - .02 : this.p <= this.target + .02);
      if (arrived && !this.attacking) { this.attacking = true; this.node.classList.add('biting'); }
      return arrived;
    }
    draw() {
      const c = this.c, t = this.t, armoured = this.maxHp > 1;
      const art = bugArt(armoured ? 'icon-bug-armour' : 'icon-bug');
      c.clearRect(0, 0, 64, 64);
      if (art.complete && art.naturalWidth && !art.broken) {
        const step = Math.sin(t * 12) * 1.4;           // scuttle
        const u = this.upright == null ? 1 : this.upright;
        c.save(); c.translate(32, 32 + step);
        if (u < 1) c.rotate(Math.PI * (1 - u * u * (3 - 2 * u)));
        c.scale(this.dir, 1);
        if (this.hit > 0) { c.shadowColor = '#ffd9e4'; c.shadowBlur = 18 * this.hit; }
        c.drawImage(art, -32, -32, 64, 64); c.restore();
        return;
      }
      /* Stand-in until the sprite lands: silhouette still reads at phone size. */
      const legs = Math.sin(t * 14) * 3;
      const up = this.upright == null ? 1 : this.upright;
      c.save(); c.translate(32, 34);
      if (up < 1) c.rotate(Math.PI * (1 - up * up * (3 - 2 * up)));
      c.scale(this.dir, 1);
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

  window.WorldEngine = { Spring, Actor, Pet, Bug, Bubble, Web, disintegrate, shatter };
})();
