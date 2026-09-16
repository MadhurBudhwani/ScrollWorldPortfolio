// Keep compact screens on one desktop coordinate system. Canvas, DOM actors,
// copy, portals and hit targets inherit the same uniform scale and offset.
window.SceneViewport = class SceneViewport {
  constructor(viewport, stage, {fixed = false} = {}) {
    this.viewport = viewport;
    this.stage = stage;
    this.scale = 1;
    this.fixed = fixed;
  }

  resize() {
    const viewportWidth = this.viewport.clientWidth;
    const viewportHeight = this.viewport.clientHeight;
    const css = getComputedStyle(this.viewport);
    const left = parseFloat(css.paddingLeft) || 0;
    const right = parseFloat(css.paddingRight) || 0;
    const top = parseFloat(css.paddingTop) || 0;
    const bottom = parseFloat(css.paddingBottom) || 0;
    const availableWidth = Math.max(1, viewportWidth - left - right);
    const availableHeight = Math.max(1, viewportHeight - top - bottom);
    const compact = this.fixed || availableWidth < 1100 || availableHeight < 600 ||
      (matchMedia('(pointer: coarse)').matches && availableWidth <= 1366);
    const width = compact ? 1600 : availableWidth;
    const height = compact ? 900 : availableHeight;
    this.scale = compact ? Math.min(availableWidth / width, availableHeight / height) : 1;
    this.width = width;
    this.height = height;
    Object.assign(this.stage.style, {
      width: width + 'px', height: height + 'px',
      left: (left + (availableWidth - width * this.scale) / 2) + 'px',
      top: (top + (availableHeight - height * this.scale) / 2) + 'px',
      transform: `scale(${this.scale})`
    });
    this.stage.style.setProperty('--scene-scale', this.scale);
    this.stage.style.setProperty('--scene-height', height + 'px');
    this.stage.classList.toggle('is-fitted', compact);
    return { width, height, viewportHeight };
  }

  // Avatar hand anchors and browser pointer/element bounds are screen pixels.
  // Convert once at this boundary before comparing them with scene geometry.
  point(clientX, clientY) {
    const rect = this.stage.getBoundingClientRect();
    return { x: (clientX - rect.left) / this.scale, y: (clientY - rect.top) / this.scale };
  }

  bounds(element) {
    const rect = element.getBoundingClientRect();
    const point = this.point(rect.left, rect.top);
    return { left: point.x, top: point.y, width: rect.width / this.scale, height: rect.height / this.scale };
  }
};
