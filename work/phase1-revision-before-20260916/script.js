const stage = document.querySelector("#stage");
const canvas = document.querySelector("#universe");
const ctx = canvas.getContext("2d");
const scrollMovie = document.querySelector(".scroll-movie");
const storyCopy = document.querySelector("#storyCopy");
const sceneKicker = document.querySelector("#sceneKicker");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneBody = document.querySelector("#sceneBody");
const chapterNo = document.querySelector("#chapterNo");
const chapterKey = document.querySelector("#chapterKey");
const skillRain = document.querySelector("#skillRain");
const player = document.querySelector("#player");
const hub = document.querySelector("#hub");
const pipeCard = document.querySelector("#pipeCard");
const closeCard = document.querySelector(".close-card");
const pipes = Array.from(document.querySelectorAll(".pipe"));
const progressBar = document.querySelector("#progressBar");

const TAU = Math.PI * 2;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const scenes = [
  {
    key: "boot",
    number: "00",
    kicker: "Boot sequence",
    title: "Madhur Budhwani",
    body: "Backend and GenAI engineer shaping enterprise systems, governed AI agents, and the story universe behind Placeholder Teddy.",
    copy: [48, 48],
    wash: [50, 34],
    player: [50, 0.62],
    palette: ["#7dff93", "#56d9ff", "#111c28"],
    tokens: [
      ["Azure OpenAI", "acid", -42, -22, -420, "left"],
      [".NET / Azure", "cyan", 36, -28, -260, "top"],
      ["Placeholder Teddy", "rose", 32, 24, -520, "right"],
      ["Enterprise APIs", "gold", -24, 30, -360, "bottom"],
    ],
  },
  {
    key: "backend",
    number: "01",
    kicker: "Backend engine",
    title: "Production APIs at enterprise scale",
    body: ".NET 8, ASP.NET Core, EF Core, SQL Server, service boundaries, release ownership, and backend systems built for real users.",
    copy: [34, 48],
    wash: [70, 30],
    player: [26, 0.55],
    palette: ["#56d9ff", "#7dff93", "#06192b"],
    tokens: [
      [".NET 8", "acid", -20, -24, -260, "left"],
      ["ASP.NET Core", "cyan", 44, -12, -360, "right"],
      ["EF Core", "gold", -30, 22, -300, "left"],
      ["SQL Server", "cyan", 24, 28, -420, "bottom"],
      ["REST APIs", "acid", 58, 10, -330, "right"],
    ],
  },
  {
    key: "azure",
    number: "02",
    kicker: "Cloud delivery",
    title: "Azure systems that ship cleanly",
    body: "App Services, Functions, Azure SQL, Blob, Redis, Application Insights, AI Search, QA, UAT, and production release support.",
    copy: [63, 44],
    wash: [30, 26],
    player: [74, 0.56],
    palette: ["#7dff93", "#56d9ff", "#101729"],
    tokens: [
      ["App Service", "cyan", -36, -26, -460, "left"],
      ["Functions", "acid", -14, 14, -310, "bottom"],
      ["Blob", "gold", 34, -28, -520, "top"],
      ["Redis", "rose", 44, 18, -420, "right"],
      ["Insights", "cyan", 8, 34, -600, "bottom"],
    ],
  },
  {
    key: "security",
    number: "03",
    kicker: "Security architecture",
    title: "Access control as product infrastructure",
    body: "SQL Server RLS, RBAC, SESSION_CONTEXT, scoped permissions, cache invalidation, audit history, and tenant-aware execution.",
    copy: [40, 48],
    wash: [66, 50],
    player: [22, 0.52],
    palette: ["#ffd45c", "#7dff93", "#171308"],
    tokens: [
      ["RLS", "acid", 30, -10, -280, "right"],
      ["RBAC", "gold", -34, -20, -450, "left"],
      ["SESSION_CONTEXT", "cyan", 34, 24, -540, "right"],
      ["Audit Trail", "rose", -18, 30, -360, "bottom"],
    ],
  },
  {
    key: "search",
    number: "04",
    kicker: "Search intelligence",
    title: "Work knowledge becomes searchable memory",
    body: "Azure AI Search with faceted, fuzzy, wildcard, exact, semantic, and vector retrieval over documents, tags, attachments, and history.",
    copy: [58, 46],
    wash: [46, 38],
    player: [20, 0.5],
    palette: ["#56d9ff", "#a49cff", "#06131f"],
    tokens: [
      ["fuzzy", "cyan", -34, -28, -380, "left"],
      ["vector", "acid", 32, 22, -500, "right"],
      ["semantic", "rose", 10, -30, -620, "top"],
      ["facets", "gold", -16, 26, -320, "bottom"],
    ],
  },
  {
    key: "genai",
    number: "05",
    kicker: "GenAI Lab",
    title: "Agents that know the rules",
    body: "Azure OpenAI, AI Foundry, schema RAG, governed NL-to-SQL, validation, correction loops, semantic caching, telemetry, and feedback.",
    copy: [40, 44],
    wash: [72, 28],
    player: [80, 0.56],
    palette: ["#7dff93", "#ff78b3", "#071326"],
    tokens: [
      ["RAG", "acid", 16, -28, -350, "top"],
      ["Azure OpenAI", "cyan", 42, -4, -560, "right"],
      ["NL-to-SQL", "gold", 24, 28, -420, "bottom"],
      ["AI Foundry", "rose", -28, 20, -500, "left"],
      ["Galaxy Assistant", "cyan", -38, -22, -650, "left"],
    ],
  },
  {
    key: "delivery",
    number: "06",
    kicker: "Engineering delivery",
    title: "Consistent output under real release pressure",
    body: "1,200+ commits, 400+ merged PRs, client-facing API ownership, Azure DevOps flow, QA, UAT, and production coordination.",
    copy: [58, 48],
    wash: [28, 32],
    player: [44, 0.58],
    palette: ["#ffd45c", "#56d9ff", "#17130b"],
    tokens: [
      ["DEV", "gold", -38, -10, -300, "left"],
      ["QA", "gold", -10, 22, -420, "bottom"],
      ["UAT", "gold", 20, -24, -560, "top"],
      ["PROD", "acid", 46, 18, -380, "right"],
      ["1200+ commits", "cyan", -26, -30, -520, "left"],
      ["400+ PRs", "rose", 34, 32, -620, "bottom"],
    ],
  },
  {
    key: "writing",
    number: "07",
    kicker: "Writing world",
    title: "Placeholder Teddy opens the softer portal",
    body: "A writing space for romance, domestic surrealism, emotional comedy, character fragments, and the voice behind the engineer.",
    copy: [44, 46],
    wash: [54, 20],
    player: [72, 0.6],
    palette: ["#ff78b3", "#ffd45c", "#1b0b18"],
    tokens: [
      ["Placeholder Teddy", "rose", 30, -24, -360, "right"],
      ["manuscripts", "gold", -30, -8, -480, "left"],
      ["romance", "acid", -20, 26, -300, "bottom"],
      ["surreal", "cyan", 30, 28, -540, "bottom"],
    ],
  },
  {
    key: "hub",
    number: "08",
    kicker: "Pipe Hub",
    title: "Choose your sub-level",
    body: "Scroll journey complete. Control unlocks here.",
    copy: [30, 30],
    wash: [70, 36],
    player: [28, 1],
    palette: ["#7dff93", "#56d9ff", "#05170e"],
    tokens: [],
  },
];

const pipeData = {
  Development: "Deep dive into .NET 8, ASP.NET Core, EF Core, SQL Server, REST APIs, Azure delivery, and enterprise backend systems.",
  GenAI: "Explore Azure OpenAI, AI Foundry, RAG, embeddings, Azure AI Search, NL-to-SQL, agent loops, telemetry, and validation.",
  Writing: "Enter Placeholder Teddy: writing samples, world notes, story fragments, and the personal voice behind the technical work.",
};

const state = {
  w: 0,
  h: 0,
  progress: 0,
  targetProgress: 0,
  lastProgress: 0,
  sceneIndex: -1,
  t: 0,
  hubLive: false,
  playerX: 0,
  playerY: 0,
  vy: 0,
  grounded: true,
  keys: new Set(),
};

const world = {
  stars: [],
  blocks: [],
  shards: [],
  nodes: [],
  pages: [],
};

const lenis = window.Lenis
  ? new Lenis({
      lerp: 0.062,
      smoothWheel: true,
      wheelMultiplier: 0.8,
    })
  : null;

if (lenis) {
  lenis.on("scroll", ({ scroll, limit }) => {
    state.targetProgress = limit ? clamp(scroll / limit, 0, 1) : getScrollProgress();
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smooth(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function rand(seed) {
  const s = Math.sin(seed * 9283.231) * 43758.5453;
  return s - Math.floor(s);
}

function resize() {
  state.w = window.innerWidth;
  state.h = window.innerHeight;
  canvas.width = Math.floor(state.w * DPR);
  canvas.height = Math.floor(state.h * DPR);
  canvas.style.width = `${state.w}px`;
  canvas.style.height = `${state.h}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  state.playerX = state.playerX || state.w * 0.28;
  buildWorld();
}

function buildWorld() {
  world.stars = Array.from({ length: 140 }, (_, i) => ({
    x: (rand(i + 1) - 0.5) * state.w * 2.4,
    y: (rand(i + 30) - 0.5) * state.h * 1.7,
    z: -140 - rand(i + 70) * 1300,
    c: i % 3 === 0 ? "#7dff93" : i % 3 === 1 ? "#56d9ff" : "#ffffff",
    s: 1 + rand(i + 99) * 3,
  }));

  world.blocks = Array.from({ length: 64 }, (_, i) => ({
    x: (rand(i + 3) - 0.5) * state.w * 2.2,
    y: (rand(i + 9) - 0.48) * state.h * 1.2,
    z: -220 - rand(i + 13) * 1300,
    size: 20 + rand(i + 17) * 78,
    r: rand(i + 19) * TAU,
    color: ["#7dff93", "#56d9ff", "#ffd45c", "#ff78b3"][i % 4],
  }));

  world.shards = Array.from({ length: 34 }, (_, i) => ({
    x: (rand(i + 101) - 0.5) * state.w * 1.8,
    y: (rand(i + 104) - 0.5) * state.h * 1.4,
    z: -260 - rand(i + 107) * 1150,
    w: 160 + rand(i + 109) * 360,
    h: 18 + rand(i + 113) * 38,
    r: (rand(i + 118) - 0.5) * 0.8,
    color: ["rgba(125,255,147,.45)", "rgba(86,217,255,.42)", "rgba(255,120,179,.38)", "rgba(255,212,92,.35)"][i % 4],
  }));

  world.nodes = Array.from({ length: 26 }, (_, i) => ({
    x: (rand(i + 240) - 0.5) * state.w * 1.25,
    y: (rand(i + 246) - 0.5) * state.h,
    z: -180 - rand(i + 249) * 900,
    c: i % 2 ? "#56d9ff" : "#7dff93",
  }));

  world.pages = Array.from({ length: 24 }, (_, i) => ({
    x: (rand(i + 400) - 0.5) * state.w * 1.8,
    y: (rand(i + 403) - 0.5) * state.h,
    z: -250 - rand(i + 406) * 980,
    r: rand(i + 410) * TAU,
  }));
}

function getScrollProgress() {
  const rect = scrollMovie.getBoundingClientRect();
  const max = scrollMovie.offsetHeight - state.h;
  return clamp(-rect.top / max, 0, 1);
}

function sceneIndex(progress) {
  return Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
}

function localProgress(progress, index) {
  const span = 1 / scenes.length;
  return clamp((progress - index * span) / span, 0, 1);
}

function project(item, scene, local, speed = 1) {
  const cameraRush = state.progress * 1850 * speed;
  const scenePush = (sceneIndex(state.progress) - 3.5) * 120;
  let z = item.z + cameraRush + scenePush;
  while (z > -70) z -= 1400;
  const f = 520 / (520 - z);
  const x = state.w / 2 + item.x * f;
  const y = state.h / 2 + item.y * f;
  return { x, y, z, f };
}

function clearScene(bg) {
  const grad = ctx.createLinearGradient(0, 0, state.w, state.h);
  grad.addColorStop(0, "#020807");
  grad.addColorStop(0.42, bg || "#071326");
  grad.addColorStop(1, "#02040a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, state.w, state.h);
}

function drawPixelRect(x, y, w, h, color, border = "#020807") {
  const px = Math.round(x);
  const py = Math.round(y);
  const pw = Math.round(w);
  const ph = Math.round(h);
  ctx.fillStyle = border;
  ctx.fillRect(px - 5, py - 5, pw + 10, ph + 10);
  ctx.fillStyle = color;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = "rgba(255,255,255,.24)";
  ctx.fillRect(px + 7, py + 7, Math.max(3, pw * 0.16), ph - 14);
  ctx.fillStyle = "rgba(0,0,0,.26)";
  ctx.fillRect(px + pw - Math.max(3, pw * 0.18), py + 7, Math.max(3, pw * 0.16), ph - 14);
}

function drawStars(scene, local) {
  world.stars.forEach((star, i) => {
    const p = project(star, scene, local, 0.72);
    if (p.x < -20 || p.x > state.w + 20 || p.y < -20 || p.y > state.h + 20) return;
    ctx.globalAlpha = clamp(p.f * 1.4, 0.12, 0.86) * (0.72 + Math.sin(state.t * 0.006 + i) * 0.22);
    ctx.fillStyle = star.c;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, star.s * p.f), Math.max(1, star.s * p.f));
  });
  ctx.globalAlpha = 1;
}

function drawRibbons(scene, local) {
  world.shards.forEach((shard, i) => {
    const p = project(shard, scene, local, 1.12);
    if (p.x < -500 || p.x > state.w + 500 || p.y < -300 || p.y > state.h + 300) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(shard.r + state.progress * (i % 2 ? 1.2 : -1.1));
    ctx.globalAlpha = clamp(p.f * 0.95, 0.04, 0.52);
    ctx.fillStyle = shard.color;
    ctx.shadowColor = shard.color;
    ctx.shadowBlur = 26;
    ctx.fillRect((-shard.w * p.f) / 2, (-shard.h * p.f) / 2, shard.w * p.f, shard.h * p.f);
    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = "#ffffff";
    for (let x = (-shard.w * p.f) / 2; x < (shard.w * p.f) / 2; x += 38 * p.f) {
      ctx.fillRect(x, (-shard.h * p.f) / 2, 12 * p.f, shard.h * p.f);
    }
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawBlocks(scene, local) {
  world.blocks.forEach((block, i) => {
    const p = project(block, scene, local, scene.key === "backend" || scene.key === "delivery" ? 1.25 : 0.95);
    if (p.x < -200 || p.x > state.w + 200 || p.y < -200 || p.y > state.h + 200) return;
    const size = block.size * p.f * (scene.key === "security" ? 1.24 : 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(block.r + state.progress * (i % 2 ? 2.2 : -1.7));
    ctx.globalAlpha = clamp(p.f * 1.1, 0.08, 0.92);
    drawPixelRect(-size / 2, -size / 2, size, size, block.color);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

function drawConstellation(scene, local) {
  if (!["search", "genai", "boot"].includes(scene.key)) return;
  const pts = world.nodes
    .map((node) => ({ node, p: project(node, scene, local, 0.84) }))
    .filter(({ p }) => p.x > -80 && p.x < state.w + 80 && p.y > -80 && p.y < state.h + 80);

  ctx.globalAlpha = scene.key === "boot" ? 0.22 : 0.68;
  ctx.strokeStyle = scene.key === "genai" ? "rgba(255,120,179,.58)" : "rgba(86,217,255,.48)";
  ctx.lineWidth = 2;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i].p;
    const b = pts[(i + 3) % pts.length]?.p;
    if (!b) continue;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < state.w * 0.32) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  pts.forEach(({ node, p }, i) => {
    ctx.globalAlpha = clamp(p.f * 1.4, 0.2, 0.9);
    ctx.fillStyle = node.c;
    ctx.shadowColor = node.c;
    ctx.shadowBlur = 22;
    ctx.fillRect(p.x - 4, p.y - 4, 8 + p.f * 12, 8 + p.f * 12);
    if (scene.key === "genai" && i % 5 === 0) {
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.strokeRect(p.x - 20 * p.f, p.y - 20 * p.f, 40 * p.f, 40 * p.f);
    }
  });
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawPages(scene, local) {
  if (scene.key !== "writing") return;
  world.pages.forEach((page, i) => {
    const p = project(page, scene, local, 1.15);
    const w = 90 * p.f;
    const h = 120 * p.f;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(page.r + state.progress * 3);
    ctx.globalAlpha = clamp(p.f * 1.2, 0.1, 0.9);
    ctx.fillStyle = "#fff1b8";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "rgba(18,12,20,.35)";
    for (let y = -h / 2 + 20 * p.f; y < h / 2 - 10; y += 17 * p.f) {
      ctx.fillRect(-w / 2 + 14 * p.f, y, w - 28 * p.f, Math.max(1, 3 * p.f));
    }
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

function drawHeroObject(scene, local) {
  const pulse = 1 + Math.sin(local * Math.PI) * 0.18;
  const x = mix(state.w * 0.5, state.w * (scene.key === "hub" ? 0.7 : 0.52), smooth(local));
  const y = state.h * (scene.key === "writing" ? 0.54 : scene.key === "security" ? 0.48 : 0.42);
  const size = (scene.key === "hub" ? 220 : 310) * pulse;
  const color = scene.palette[0];
  const color2 = scene.palette[1];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((local - 0.5) * 0.32 + state.progress * 0.4);
  ctx.globalAlpha = scene.key === "hub" ? 0.28 : 0.82;
  ctx.shadowColor = color;
  ctx.shadowBlur = 70;

  if (scene.key === "security") {
    for (let i = 0; i < 4; i += 1) {
      drawPixelRect(-size * 0.48 + i * size * 0.25, -size * 0.36, size * 0.16, size * 0.72, i % 2 ? color2 : color);
    }
    drawPixelRect(-size * 0.42, -size * 0.52, size * 0.84, size * 0.14, color2);
  } else if (scene.key === "search" || scene.key === "genai") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    for (let r = 0.24; r <= 0.52; r += 0.14) {
      ctx.beginPath();
      ctx.arc(0, 0, size * r, local * TAU, local * TAU + Math.PI * 1.3);
      ctx.stroke();
    }
    drawPixelRect(-size * 0.18, -size * 0.18, size * 0.36, size * 0.36, color2);
  } else if (scene.key === "writing") {
    drawPixelRect(-size * 0.3, -size * 0.36, size * 0.6, size * 0.72, "#fff1b8");
    ctx.fillStyle = "#2b1723";
    ctx.fillRect(-size * 0.18, -size * 0.14, size * 0.36, size * 0.04);
    ctx.fillRect(-size * 0.18, size * 0.02, size * 0.3, size * 0.04);
    ctx.fillStyle = color;
    ctx.fillRect(size * 0.16, -size * 0.36, size * 0.12, size * 0.72);
  } else {
    drawPixelRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.68, color);
    drawPixelRect(-size * 0.16, -size * 0.16, size * 0.32, size * 0.32, color2);
  }

  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawGround(scene, local) {
  const show = scene.key === "hub" ? smooth((local - 0.05) / 0.3) : 0;
  if (show <= 0) return;
  const y = state.h - 82;
  ctx.globalAlpha = show;
  ctx.fillStyle = "#7dff93";
  ctx.fillRect(0, y, state.w, 7);
  ctx.fillStyle = "#198347";
  ctx.fillRect(0, y + 7, state.w, 82);
  ctx.fillStyle = "#105c32";
  for (let x = -80 + (state.progress * 200) % 120; x < state.w + 120; x += 120) {
    ctx.fillRect(x, y + 24, 70, 12);
  }
  ctx.globalAlpha = 1;
}

function drawFrame() {
  const index = sceneIndex(state.progress);
  const scene = scenes[index];
  const local = localProgress(state.progress, index);
  clearScene(scene.palette[2]);
  drawStars(scene, local);
  drawRibbons(scene, local);
  drawHeroObject(scene, local);
  drawBlocks(scene, local);
  drawConstellation(scene, local);
  drawPages(scene, local);
  drawGround(scene, local);
}

function renderTokens(scene) {
  skillRain.replaceChildren();
  scene.tokens.forEach((token, i) => {
    const [label, tone, x, y, z, from] = token;
    const el = document.createElement("span");
    el.className = `skill-token ${tone}`;
    el.textContent = label;
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.z = z;
    el.dataset.from = from;
    el.dataset.i = i;
    skillRain.append(el);
  });
}

function tokenMotion(el, local) {
  const x = Number(el.dataset.x);
  const y = Number(el.dataset.y);
  const z = Number(el.dataset.z);
  const from = el.dataset.from;
  const tx = (x / 100) * state.w;
  const ty = (y / 100) * state.h;
  const start = {
    left: [-state.w * 0.7, ty],
    right: [state.w * 0.7, ty],
    top: [tx, -state.h * 0.65],
    bottom: [tx, state.h * 0.65],
  }[from];
  const exit = {
    left: [state.w * 0.72, ty],
    right: [-state.w * 0.72, ty],
    top: [tx, state.h * 0.7],
    bottom: [tx, -state.h * 0.7],
  }[from];
  let px = tx;
  let py = ty;
  let o = 1;
  let s = 1;
  if (local < 0.24) {
    const t = smooth(local / 0.24);
    px = mix(start[0], tx, t);
    py = mix(start[1], ty, t);
    o = Math.max(0.22, t);
    s = mix(0.78, 1.18, t);
  } else if (local > 0.72) {
    const t = smooth((local - 0.72) / 0.28);
    px = mix(tx, exit[0], t);
    py = mix(ty, exit[1], t);
    o = 1 - t;
    s = mix(1.18, 0.78, t);
  } else {
    s = 1.18 + Math.sin(local * Math.PI) * 0.08;
  }
  const i = Number(el.dataset.i);
  el.style.setProperty("--x", `${px - state.w / 2 + Math.sin(local * TAU + i) * 12}px`);
  el.style.setProperty("--y", `${py - state.h / 2 + Math.cos(local * TAU + i) * 10}px`);
  el.style.setProperty("--z", `${z * (0.4 + local)}px`);
  el.style.setProperty("--rx", `${Math.sin(local * TAU + i) * 18}deg`);
  el.style.setProperty("--ry", `${Math.cos(local * TAU + i) * 24}deg`);
  el.style.setProperty("--rz", `${Math.sin(local * TAU + i) * 8}deg`);
  el.style.setProperty("--s", s);
  el.style.setProperty("--o", o);
}

function syncScene() {
  state.targetProgress = getScrollProgress();
  const ease = Math.abs(state.targetProgress - state.progress) > 0.18 ? 0.16 : 0.085;
  state.progress = mix(state.progress, state.targetProgress, ease);
  const index = sceneIndex(state.progress);
  const scene = scenes[index];
  const local = localProgress(state.progress, index);
  state.hubLive = scene.key === "hub" && local > 0.26;

  if (state.sceneIndex !== index) {
    state.sceneIndex = index;
    sceneKicker.textContent = scene.kicker;
    sceneTitle.textContent = scene.title;
    sceneBody.textContent = scene.body;
    chapterNo.textContent = scene.number;
    chapterKey.textContent = scene.key;
    renderTokens(scene);
    pipeCard.classList.remove("is-open");
  }

  const copyIn =
    scene.key === "boot" && local < 0.08
      ? mix(0.86, 1, smooth(local / 0.08))
      : local > 0.78
        ? 1 - smooth((local - 0.78) / 0.22)
        : smooth(local / 0.12);
  const copyDriftX = Math.sin(local * TAU) * 48;
  const copyDriftY = Math.cos(local * TAU) * 24;
  stage.style.setProperty("--scroll", state.progress);
  stage.style.setProperty("--wash-x", `${scene.wash[0]}%`);
  stage.style.setProperty("--wash-y", `${scene.wash[1]}%`);
  stage.style.setProperty("--wash-dx", `${Math.sin(local * TAU) * 40}px`);
  stage.style.setProperty("--wash-dy", `${Math.cos(local * TAU) * 24}px`);
  stage.style.setProperty("--wash-scale", 1 + Math.sin(local * Math.PI) * 0.24);
  stage.style.setProperty("--wash-r", `${100 + local * 80}deg`);
  stage.style.setProperty("--flash", Math.max(0, 0.32 - Math.abs(local - 0.02) * 4));
  storyCopy.style.setProperty("--copy-x", `${scene.copy[0]}%`);
  storyCopy.style.setProperty("--copy-y", `${scene.copy[1]}%`);
  storyCopy.style.setProperty("--copy-dx", `${copyDriftX}px`);
  storyCopy.style.setProperty("--copy-dy", `${copyDriftY}px`);
  storyCopy.style.setProperty("--copy-r", `${Math.sin(local * Math.PI) * 1.2}deg`);
  storyCopy.style.setProperty("--copy-s", mix(0.92, 1, copyIn));
  storyCopy.style.setProperty("--copy-o", scene.key === "hub" ? 0 : copyIn);
  progressBar.style.height = `${state.progress * 100}%`;

  Array.from(skillRain.children).forEach((el) => tokenMotion(el, local));

  if (!state.hubLive) {
    state.playerX = (scene.player[0] / 100) * state.w;
    state.playerY = 0;
    player.classList.remove("jumping", "crouching", "entering");
  }

  const autoX = state.hubLive ? state.playerX : state.playerX + Math.sin(local * TAU) * 34;
  player.style.setProperty("--player-x", `${autoX}px`);
  player.style.setProperty("--player-bottom", `${82 + state.playerY}px`);
  player.style.setProperty("--player-s", scene.player[1]);
  player.style.setProperty("--player-o", scene.key === "boot" && local < 0.16 ? mix(0.72, 1, smooth(local / 0.16)) : 1);
  player.style.setProperty("--player-r", `${Math.sin(local * TAU) * 1.5}deg`);
  player.classList.toggle("walking", Math.abs(state.progress - state.lastProgress) > 0.00025 || (state.hubLive && isWalking()));

  const hubIn = scene.key === "hub" ? smooth((local - 0.12) / 0.28) : 0;
  hub.style.setProperty("--hub-o", hubIn);
  hub.style.setProperty("--hub-y", `${mix(110, 0, hubIn)}px`);
  hub.classList.toggle("is-live", hubIn > 0.9);

  state.lastProgress = state.progress;
}

function isWalking() {
  return state.keys.has("a") || state.keys.has("d") || state.keys.has("arrowleft") || state.keys.has("arrowright");
}

function nearestPipe() {
  let nearest = null;
  let best = Infinity;
  pipes.forEach((pipe) => {
    const rect = pipe.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(center - state.playerX);
    pipe.classList.toggle("is-near", state.hubLive && distance < 94);
    if (distance < best) {
      best = distance;
      nearest = pipe;
    }
  });
  return best < 94 ? nearest : null;
}

function openPipe(pipe) {
  if (!pipe) return;
  const title = pipe.dataset.pipe;
  pipeCard.querySelector("h2").textContent = title;
  pipeCard.querySelector("span").textContent = pipeData[title];
  player.classList.add("entering");
  setTimeout(() => {
    pipeCard.classList.add("is-open");
    player.classList.remove("entering");
  }, 220);
}

function tickPlayer() {
  if (state.hubLive) {
    let dir = 0;
    if (state.keys.has("a") || state.keys.has("arrowleft")) dir -= 1;
    if (state.keys.has("d") || state.keys.has("arrowright")) dir += 1;
    state.playerX = clamp(state.playerX + dir * 7.2, state.w * 0.14, state.w * 0.91);
    state.vy -= 0.85;
    state.playerY += state.vy;
    if (state.playerY <= 0) {
      state.playerY = 0;
      state.vy = 0;
      state.grounded = true;
      player.classList.remove("jumping");
    }
    nearestPipe();
  }
  requestAnimationFrame(tickPlayer);
}

function animate(t) {
  state.t = t;
  syncScene();
  drawFrame();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
window.addEventListener("scroll", syncScene, { passive: true });

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  state.keys.add(key);
  if (!state.hubLive) return;

  if ((key === "w" || key === "arrowup" || key === " ") && state.grounded) {
    event.preventDefault();
    state.vy = 19;
    state.grounded = false;
    player.classList.add("jumping");
  }

  if (key === "s" || key === "arrowdown" || key === "enter") {
    const pipe = nearestPipe();
    if (pipe) {
      event.preventDefault();
      player.classList.add("crouching");
      setTimeout(() => player.classList.remove("crouching"), 170);
      openPipe(pipe);
    }
  }
});

window.addEventListener("keyup", (event) => state.keys.delete(event.key.toLowerCase()));
pipes.forEach((pipe) => pipe.addEventListener("click", () => openPipe(pipe)));
closeCard.addEventListener("click", () => pipeCard.classList.remove("is-open"));

resize();
state.targetProgress = getScrollProgress();
state.progress = state.targetProgress;
syncScene();
tickPlayer();
requestAnimationFrame(animate);
