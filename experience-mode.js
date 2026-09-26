/* Mobile enters the world hub; an open portrait world stays put on rotation. */
(() => {
  const params = new URLSearchParams(location.search);
  const requested = params.get('experience');
  const isWorld = /(?:^|\/)world\.html$/i.test(location.pathname);
  const portraitViewport = matchMedia('(max-width: 900px) and (orientation: portrait)');
  const touchPointer = matchMedia('(pointer: coarse)');
  const prefersPortrait = () => portraitViewport.matches ||
    (touchPointer.matches && Math.min(screen.width, screen.height) <= 700);
  function enterHub(chapter = location.hash.slice(1)) {
    const url = new URL('./boot-hub-proto.html', location.href);
    const highlights = { backend:'boot', azure:'boot', delivery:'boot', security:'gyro', search:'gyro', genai:'trace', writing:'hobby', hobbies:'hobby', about:'about' };
    if (highlights[chapter]) url.searchParams.set('focus', highlights[chapter]);
    if (chapter === 'hub') url.searchParams.set('return', '1');
    window.mobileRedirect = true;
    document.documentElement.classList.add('mobile-redirect');
    location.replace(url.href);
  }
  window.portraitExperience = requested === 'portrait' || (requested !== 'desktop' && prefersPortrait());
  if (window.portraitExperience) {
    if (!isWorld) { enterHub(); return; }
    document.documentElement.classList.add('portrait-experience');
    window.landscapePrompt = { blocked: false };
    return;
  }
  if (requested === 'desktop') return;

  // DevTools device emulation and desktop window resizing can happen after
  // the desktop script bundle has started. Replace it with a fresh document
  // rather than leaving two animation controllers running on the same page.
  let timer;
  const enterPortrait = () => {
    if (!prefersPortrait()) return;
    if (!isWorld) { enterHub(document.querySelector('#stage')?.dataset.scene || location.hash.slice(1)); return; }
    const url = new URL(location.href);
    url.searchParams.set('experience', 'portrait');
    location.replace(url.href);
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(enterPortrait, 180); };
  addEventListener('resize', schedule, { passive: true });
  portraitViewport.addEventListener('change', schedule);
  touchPointer.addEventListener('change', schedule);
  // Re-evaluate once the browser has applied the viewport meta tag and layout.
  addEventListener('DOMContentLoaded', schedule, { once: true });
  addEventListener('load', schedule, { once: true });
})();
