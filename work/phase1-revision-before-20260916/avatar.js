/* Frame animation is isolated so ?avatar=original restores the approved static artwork. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('avatar') === 'original') return;

  const image = new Image();
  image.src = './assets/madhur-avatar-atlas-v1.png';
  const ready = image.decode().then(() => true).catch(() => false);
  const actions = new Image();
  actions.src = './assets/madhur-avatar-actions-v1.png';
  let actionsReady = false;
  actions.decode().then(() => { actionsReady = true; }).catch(() => {});
  const interactions = new Image();
  interactions.src = './assets/madhur-interactions-v1.png';
  let interactionsReady = false;
  interactions.decode().then(() => { interactionsReady = true; }).catch(() => {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  // Artist atlas registration: crop gutters, align body roots and share each cycle's scale.
  const frames = [
    [82,11,184,411,173,419], [383,11,184,411,474,419],
    [689,11,188,411,781,419], [997,12,191,410,1088,419],
    [72,431,211,386,172,814], [397,430,193,388,486,814],
    [716,430,163,389,795,814], [1005,430,212,387,1108,814],
    [63,830,222,387,169,1214], [388,830,189,388,480,1214],
    [712,830,179,389,794,1214], [1007,830,214,387,1109,1214],
  ];
  const actionFrames = [
    [42,70,277,450,215,517], [428,17,294,503,580,517],
    [810,12,290,457,954,465], [1148,17,373,503,1340,517],
    [25,606,359,381,200,982], [465,630,235,355,580,981],
    [853,536,217,449,961,982], [1239,666,223,318,1350,979],
  ];
  const interactionFrames = [
    [96,0,356,872,267,867], [525,108,348,764,692,868],
    [927,108,340,764,1100,867], [1381,108,316,764,1535,867],
  ];

  class AvatarAnimator {
    constructor(element) {
      this.element = element;
      this.canvas = document.createElement('canvas');
      this.canvas.width = 720;
      this.canvas.height = 720;
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.className = 'avatar-frames';
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.mode = 'idle';
      this.facing = 1;
      this.elapsed = 0;
      this.idleTime = 0;
      this.frame = -1;
      this.loaded = false;
      ready.then(ok => {
        if (!ok) return;
        this.loaded = true;
        this.element.append(this.canvas);
        this.element.classList.add('is-animated');
        this.draw(0);
      });
    }

    update(dt, { moving = false, direction = this.facing, airborne = false, verticalSpeed = 0, anticipating = false, crouching = false, entering = false, interaction = null, choreographyTime = null } = {}) {
      if (!this.loaded) return;
      if (direction) this.facing = direction < 0 ? -1 : 1;
      if (this.wasAirborne && !airborne) this.landingTime = 0.13;
      this.wasAirborne = airborne;
      this.landingTime = Math.max(0, (this.landingTime || 0) - dt);
      const mode = entering ? 'enter' : interaction || (anticipating ? 'anticipate' : airborne ? 'jump' : this.landingTime > 0 ? 'land' : crouching ? 'crouch' : moving ? 'walk' : 'idle');
      if (mode !== this.mode) {
        this.mode = mode;
        this.elapsed = 0;
      }
      this.elapsed += dt;
      this.idleTime += dt;
      let frame = 0;
      let action = false;
      if (!reduce.matches) {
        if (interactionsReady && (mode === 'pull' || mode === 'read')) {
          action = 'interaction';
          frame = mode === 'pull' ? Math.floor((choreographyTime ?? this.elapsed) * 2) % 2 : (choreographyTime ?? this.elapsed) < 1 ? 2 : 3;
        }
        else if (mode === 'walk') frame = 4 + (choreographyTime === null ? Math.floor(this.elapsed * 12) : Math.floor(choreographyTime * 8)) % 8;
        else if (actionsReady && ['anticipate', 'jump', 'land', 'crouch', 'enter'].includes(mode)) {
          action = true;
          frame = mode === 'anticipate' ? 0 : mode === 'land' ? 4 : mode === 'crouch' ? 5 : mode === 'enter' ? this.elapsed < 0.15 ? 6 : 7 : this.elapsed < 0.10 ? 1 : verticalSpeed < -90 ? 3 : 2;
        }
        else {
          const breath = this.idleTime % 3.8;
          frame = breath < 1.05 ? 0 : breath < 2.0 ? 1 : breath < 3.0 ? 3 : 0;
          const blink = this.idleTime % 4.7;
          if (blink > 4.42 && blink < 4.56) frame = 2;
        }
      }
      this.draw(frame, action);
    }

    draw(frame, action = false) {
      const facing = action === 'interaction' ? 1 : action ? frame < 5 ? this.facing : 1 : frame >= 4 ? this.facing : 1;
      if (frame === this.frame && action === this.drawnAction && facing === this.drawnFacing && this.mode !== 'enter') return;
      this.frame = frame;
      this.drawnAction = action;
      this.drawnFacing = facing;
      const source = action === 'interaction' ? interactions : action ? actions : image;
      const [sx, sy, sw, sh, anchorX, baseline] = (action === 'interaction' ? interactionFrames : action ? actionFrames : frames)[frame];
      const c = this.ctx;
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      c.save();
      c.translate(this.canvas.width / 2, 0);
      c.scale(facing, 1);
      if (this.mode === 'enter' && !reduce.matches) c.translate(0, Math.max(0, this.elapsed - 0.18) * this.canvas.height * 2.7);
      const scale = 576 * 0.94 / (action === 'interaction' ? 757 : action ? 498 : frame < 4 ? 407 : 382);
      const ground = this.canvas.height - 576 * .02;
      c.drawImage(source, sx, sy, sw, sh, (sx - anchorX) * scale, ground - (baseline - sy) * scale, sw * scale, sh * scale);
      c.restore();
      this.element.dataset.avatarState = this.mode;
      this.element.dataset.avatarFrame = String(frame);
    }
  }
  window.AvatarAnimator = AvatarAnimator;
})();
