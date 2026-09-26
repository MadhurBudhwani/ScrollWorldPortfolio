/* The unfinished portrait/mobile experience is intentionally preview-only.
   Use ?experience=portrait to inspect it without exposing it to normal visits. */
(() => {
  const params = new URLSearchParams(location.search);
  const requested = params.get('experience');
  const isWorld = /(?:^|\/)world\.html$/i.test(location.pathname);
  function enterHub(chapter = location.hash.slice(1)) {
    const url = new URL('./boot-hub-proto.html', location.href);
    const highlights = { backend:'boot', azure:'boot', delivery:'boot', security:'gyro', search:'gyro', genai:'trace', writing:'hobby', hobbies:'hobby', about:'about' };
    if (highlights[chapter]) url.searchParams.set('focus', highlights[chapter]);
    if (chapter === 'hub') url.searchParams.set('return', '1');
    window.mobileRedirect = true;
    document.documentElement.classList.add('mobile-redirect');
    location.replace(url.href);
  }
  window.portraitExperience = requested === 'portrait';
  if (window.portraitExperience) {
    if (!isWorld) { enterHub(); return; }
    document.documentElement.classList.add('portrait-experience');
    window.landscapePrompt = { blocked: false };
    return;
  }
})();
