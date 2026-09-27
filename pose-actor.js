/* Registered artwork, one actor. Each image keeps its own geometry during a blend.
   Feet stay planted; a drawn desk never resizes because the next pose is standing. */
(() => {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const make = (tag, cls) => { const node = document.createElement(tag); node.className = cls; return node; };
  const cache = new Map();
  const group = name => name.split('-')[0];
  // Registration uses the original square canvases, not changing alpha bounds.
  const registration = {
    talk:  { x: .51, foot: .969, head: .035, fill: .934, posture: 1 },
    react: { x: .50, foot: .967, head: .043, fill: .924, posture: 1 },
    // posture normalised so size = 1.07×personHeight across all groups — prevents size-jump on crossfade
    // Re-measured from the 32-frame rebuild. Calibrated on a standing frame,
    // so posture is 1: he renders at personHeight upright and genuinely
    // shortens as he crouches, instead of being scaled to a fixed height.
    lever: { x: .167, foot: .994, head: .273, fill: .721, posture: 1 },
    // Re-measured from the rebuilt set. `head` is his SEATED head, since nine
    // of the ten frames are seated and it anchors the speech bubble; `posture`
    // then carries the size so he still renders at personHeight standing.
    desk:  { x: .372, foot: .939, head: .162, fill: .777, posture: .879 },
    // Rear view, walking away from camera. Anchored on the head rather than
    // the bounding box, so the arm swing does not rock him side to side.
    away:  { x: .500, foot: .916, head: .158, fill: .758, posture: 1 },
  };
  // Frames that ship as transparent WebP with no PNG twin. Add a pattern here
  // when art is converted, so the loader stops spending a 404 on the PNG it
  // will never find. Matched by name, not by group: desk-r* is already cut out
  // while desk-0* still has PNG twins.
  const cutWebp = [/^lever-/, /^desk-/, /^away-/, /^fail-/];
  function loadPose(name) {
    if (!cache.has(name)) cache.set(name, TraceRenderer.asset('./assets/worlds/anim/' + name + '.webp', 512,
      cutWebp.some(re => re.test(name)) ? 'webp' : null).then(async url => {
      if (!url) return null;
      const image = new Image(); image.src = url;
      try { await image.decode(); } catch { return null; }
      return image;
    }));
    return cache.get(name);
  }
  class PoseActor {
    constructor(layer, { ground = .8, charHeight = .25 } = {}) {
      this.layer = layer; this.ground = ground; this.charHeight = charHeight;
      this.node = make('div', 'pose-actor');
      this.shadow = make('i', 'actor-contact'); this.node.append(this.shadow);
      this.layers = [0, 1].map(() => { const n = make('img', 'pose-layer'); n.alt = ''; this.node.append(n); return { node:n, name:null }; });
      this.walker = make('div', 'player world-actor pose-walker');
      const fallback = new Image(); fallback.src = './assets/madhur-character.png'; fallback.alt = ''; this.walker.append(fallback);
      this.node.append(this.walker); layer.append(this.node);
      this.animator = window.AvatarAnimator ? new AvatarAnimator(this.walker) : null;
      this.x = new WorldEngine.Spring(0, 6.5); this.bump = new WorldEngine.Spring(0, 19);
      this.lean = new WorldEngine.Spring(0, 11); this.walkMix = new WorldEngine.Spring(0, 14);
      this.pose = null; this.front = 0; this.t = 0; this.headY = 0; this.facing = 1;
      this.seq = null; this._token = 0; this._sequenceToken = 0; this.walk = null;
      this.gentle = matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    preload(names) { return Promise.all(names.map(loadPose)); }
    /* Fraction of personHeight that sits below his drawn feet. A scene shrinking
       him for depth needs this to keep the contact point still, because the
       inset shrinks with him and would otherwise slide the feet down. */
    /* Screen position of a point given as a fraction of the current pose's own
       artwork. The desk set draws the laptop at a fixed spot inside its frames,
       so this is how the fight finds what the bugs are trying to break. */
    mapPoint(fx, fy) {
      const layer = this.layers[this.front];
      if (!layer.name) return null;
      const n = layer.node, size = parseFloat(n.style.width) || 0;
      if (!size) return null;
      return { x: parseFloat(n.style.left) + size * fx, y: parseFloat(n.style.top) + size * fy };
    }
    footInset() {
      const r = registration[group(this.pose || 'talk')] || registration.talk;
      return (1 - r.foot) * r.posture / r.fill;
    }
    place(px) { this.cancelWalk(); this.x.set(px); }
    walkTo(px) {
      this.cancelWalk(); this.x.target = px;
      return new Promise(resolve => { this.walk = { resolve }; });
    }
    cancelWalk() { if (this.walk) { this.walk.resolve(false); this.walk = null; } }
    react(strength = 1) { this.bump.v -= 30 * strength; }
    async set(name) {
      if (name === this.pose && this.layers[this.front].name === name) return true;
      this.pose = name;
      const token = ++this._token;
      const image = await loadPose(name);
      if (!image || token !== this._token) return false;
      const next = this.layers[1-this.front];
      next.name = name; next.node.src = image.src;
      this.front = 1-this.front; this.blend = 0;
      return true;
    }
    /* onFrame fires with the artwork's own frame number as each one goes up, so
       a scene can hang an effect on a specific drawing instead of a timer that
       drifts the moment a frame loads slowly. */
    async play(prefix, from, to, fps = 9, onFrame = null) {
      this.stop();
      const token = this._sequenceToken, names = [], direction = from <= to ? 1 : -1;
      for (let n=from; direction>0 ? n<=to : n>=to; n+=direction) names.push(prefix+'-'+String(n).padStart(2,'0'));
      await this.preload(names);
      if (token !== this._sequenceToken) return false;
      await this.set(names[0]);
      if (token !== this._sequenceToken) return false;
      onFrame?.(from);
      return new Promise(resolve => { this.seq = { names, i:0, acc:0, step:1/fps, resolve, pending:false, first:from, dir:direction, onFrame }; });
    }
    stop() {
      this._sequenceToken++; this._token++;
      if (this.seq) { this.seq.resolve(false); this.seq = null; }
    }
    cancel() { this.stop(); this.cancelWalk(); this.x.target = this.x.x; this.x.v = 0; }
    update(dt, W, H) {
      this.t += dt;
      const s = this.seq;
      if (s && !s.pending) {
        s.acc += dt;
        // Anticipation and follow-through hold longer than the main action.
        // A slow frame never skips past the actual hand contact.
        const hold = s.i===0 ? 1.6 : s.i===s.names.length-1 ? 2.2 : 1;
        if (s.acc >= s.step*hold) {
          s.acc = 0;
          if (s.i < s.names.length-1) {
            s.pending = true;
            this.set(s.names[++s.i]).then(() => { if (this.seq===s) s.pending=false; });
            s.onFrame?.(s.first + s.i*s.dir);
          } else { this.seq = null; s.resolve(true); }
        }
      }
      const oldVelocity = this.x.v;
      const x = this.x.step(dt), bump = this.bump.step(dt);
      const moving = Math.abs(this.x.target-x)>1.5 || Math.abs(this.x.v)>8;
      if (Math.abs(this.x.v)>5) this.facing = this.x.v>0 ? 1 : -1;
      if (!moving && this.walk) { this.x.set(this.x.target); this.walk.resolve(true); this.walk=null; }
      const gentle = this.gentle || this.layer.closest('.gentle');
      this.walkMix.target = moving && this.animator?.loaded ? 1 : 0;
      const walkMix = clamp(this.walkMix.step(dt),0,1);
      this.lean.target = gentle ? 0 : clamp((this.x.v-oldVelocity)/Math.max(dt,.001)*.0015,-3.5,3.5);
      const lean = this.lean.step(dt), floor = H*this.ground;
      const personHeight = Math.min(H*this.charHeight,W*.62);
      this.blend = Math.min(1,(this.blend||0)+dt/(this.seq ? .095 : .23));
      const blend = this.blend*this.blend*(3-2*this.blend);
      let head = floor-personHeight;
      this.layers.forEach((layer,i) => {
        if (!layer.name) return;
        const r=registration[group(layer.name)]||registration.talk;
        const size=personHeight*r.posture/r.fill;
        const breath=gentle ? 0 : Math.sin(this.t*1.55)*.8;
        const scene=group(layer.name)==='lever'||group(layer.name)==='desk';
        const alpha=i===this.front ? blend : 1-blend;
        layer.node.style.width=layer.node.style.height=size+'px';
        layer.node.style.left=(x-size*r.x)+'px';
        layer.node.style.top=(floor-size*r.foot+(scene ? 0 : breath+bump*.25))+'px';
        layer.node.style.transformOrigin=(r.x*100)+'% '+(r.foot*100)+'%';
        layer.node.style.transform=scene ? 'none' : 'rotate('+((lean+bump*.2).toFixed(2))+'deg)';
        layer.node.style.opacity=String(alpha*(1-walkMix));
        if (i===this.front) head=floor-size*(r.foot-r.head);
      });
      this.headY=head*(1-walkMix)+(floor-personHeight)*walkMix;
      this.walker.style.left=x+'px'; this.walker.style.top=(floor-232)+'px';
      this.walker.style.setProperty('--player-s',String(personHeight/232));
      this.walker.style.opacity=String(walkMix); this.walker.style.rotate=lean.toFixed(2)+'deg';
      this.animator?.update(dt,{moving,direction:this.facing});
      this.shadow.style.left=x+'px'; this.shadow.style.top=(floor-3)+'px';
      this.shadow.style.width=(personHeight*.46)+'px';
      return {x,y:floor};
    }
  }
  window.PoseActor=PoseActor;
})();
