/* Enter portrait when the viewport becomes mobile; an active tower stays put. */
(() => {
  const requested = new URLSearchParams(location.search).get('experience');
  const portraitViewport = matchMedia('(max-width: 900px) and (orientation: portrait)');
  const touchPointer = matchMedia('(pointer: coarse)');
  const prefersTower = () => portraitViewport.matches ||
    (touchPointer.matches && Math.min(screen.width, screen.height) <= 700);
  window.portraitExperience = requested === 'portrait' || (requested !== 'desktop' && prefersTower());
  if (window.portraitExperience) {
    document.documentElement.classList.add('portrait-experience');
    window.landscapePrompt = { blocked: false };
    return;
  }
  if (requested === 'desktop') return;

  // DevTools device emulation and desktop window resizing can happen after
  // the desktop script bundle has started. Replace it with a fresh document
  // rather than leaving two animation controllers running on the same page.
  let timer;
  const enterTower = () => {
    if (!prefersTower()) return;
    const url = new URL(location.href);
    url.searchParams.set('experience', 'portrait');
    if (!url.searchParams.has('world')) {
      const chapter = document.querySelector('#stage')?.dataset.scene;
      if (chapter) url.hash = chapter;
    }
    location.replace(url.href);
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(enterTower, 180); };
  addEventListener('resize', schedule, { passive: true });
  portraitViewport.addEventListener('change', schedule);
  touchPointer.addEventListener('change', schedule);
  // Re-evaluate once the browser has applied the viewport meta tag and layout.
  addEventListener('DOMContentLoaded', schedule, { once: true });
  addEventListener('load', schedule, { once: true });
})();
