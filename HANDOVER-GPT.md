# HANDOVER PROMPT — Madhur's Portfolio Mobile Rebuild (give this whole file to GPT)

You are taking over an in-progress build. Read all of this, then continue implementation. Ask me for anything missing (especially individual sprite PNGs). I (Madhur) am a .NET / GenAI engineer; I speak Hinglish; I want a premium, never-seen-before result, not a slideshow. I generate my own 8-bit pixel art from prompts — so when you need art, give me production-ready prompts instead of making placeholders. Ground all storytelling in my REAL work (details below). Be decisive, not verbose.

## 1. WHAT THIS IS
A cinematic 8-bit "scrollworld" portfolio for Madhur Budhwani (Backend & GenAI engineer). A polished **desktop/landscape** version already exists and is good (neon perspective-grid world, avatar + husky dog, skills as floating constellations, scroll-driven story of 9 chapters). We are **rebuilding the MOBILE (portrait) experience** from scratch because the old mobile version was boring.

- Stack: **vanilla JS + HTML5 Canvas**, static site. No framework.
- Run: `node scripts/serve.cjs` → serves on **http://localhost:4173**. (`.claude/launch.json` config name = `scrollworld`.)
- Working dir: `C:\Users\Madhur\Documents\Codex\2026-09-15\c-users-madhur-downloads-placeholder-teddy\outputs\placeholder-teddy-scrollworld`
- Test at mobile viewport 375×812. NOTE: the experience is animated — static screenshots don't show the motion; view it live.

## 2. WHY THE REBUILD (what was rejected)
Old mobile "tower" (`portrait-app.js`, `portrait-scene.js`, `portrait.css`, gated by `experience-mode.js`): it sliced the phone into 6 fixed horizontal bands (header / text-card / small world-box / skills-grid / buttons / status). Result: the "world" was trapped in ~35% of the screen, and variable content was force-paginated (a 25-word intro split into 2 pages; 3 separate pagers on one screen). It felt like a control panel / slideshow. **REJECTED.** Do not resurrect band layouts or pagination.

## 3. THE NEW CONCEPT (approved direction)
`Cold boot → Hub → 3 signature immersive worlds` (+ a "the person" section). Each world is a distinct, interactive, full-bleed experience grounded in my real projects. The 9 desktop story chapters are reorganized into 3 worlds, mapped to the desktop "slides":

| World | Concept | Desktop slides | Grounded in |
|---|---|---|---|
| **Backend + Cloud** | **BOOT SEQUENCE** — power up my whole stack like a machine; my career = boot order | 1 (backend), 2 (cloud/Azure), 6 (delivery) | resume work history |
| **GenAI** | **TRACE** — first-person: you ARE a request/packet flowing down the NL-to-SQL pipeline; at the `INTENT` stage it BRANCHES by user choice into "Analyze" (SafetyChatAgent NL-to-SQL) vs "Act" (Galaxy Assistant) | 5 (generative AI) | SafetyChatAgent + Galaxy projects |
| **Architecture + Security** | **GYROSCOPE / LSD** — trippy device-tilt journey through the real interceptor + SESSION_CONTEXT + RLS machinery (MY favourite, highest bar) | 3 (security), 4 (search) | ESS.Ecosys.Safety.API interceptors |

Plus **"the person"** section in the hub: **Beyond Code** (Hobbies) and **About Madhur** — reuse the existing rich experiences (`hobby-gallery.js`, `about-*.js`, `lunar-lab*`, `world.html`).

## 4. DESIGN PRINCIPLES (non-negotiable — these are hard-won from iteration)
1. **My art is the HERO.** I make rich, bright, mirror-symmetric 8-bit kaleidoscope scenes. Use them full-bleed as backdrops. Your job = layer motion + interaction on top, not draw geometry.
2. **"Trippy" = rich moving scenes, NOT thin line-art.** Thin procedural rings/cells were rejected as "kachra" (junk) — unreadable on a small screen. Trippy = my scene art that MOVES hazily: liquid warp (subtle horizontal-strip sine displacement), slow zoom + tilt-parallax, bloom-haze, chromatic aberration, gentle hue-breathing, drifting sparkles.
3. **Dim the backgrounds.** My art is very bright — always put a dark scrim/vignette overlay on top so the foreground is readable.
4. **Foreground MUST be interactive gameplay.** The user drives progression by their own action; the meaning of each element is revealed through interaction. NEVER auto-advancing slides. "User is world me aaya hai apne action se saari cheezon ka meaning banega."
5. Full-bleed, no fixed bands, no forced pagination.
6. Minimal, confident controls — no redundant nav clutter.
7. **Palette:** teal `#67daf5`, mint `#84f5ad`, gold `#f3cc70`, pink `#f58caf`, violet `#bf8cff`, on near-black navy `#05060f`/`#081423`. 8-bit crisp pixels, monospace HUD, CRT scanlines, bloom, chromatic aberration.

## 5. GROUND TRUTH — MY REAL WORK (use for authentic storytelling)
**Security world (`C:\Users\Madhur\source\repos\ESS.Ecosys.Safety.API`):**
- `ESS.Ecosys.Safety.Data\Context\SetSessionContextInterceptor.cs` — an EF Core interceptor hooking connection-open, save-changes, and reader-executing. On every DB touch it resolves the user's permission via a **3-tier cache: in-memory (per-DbContext) → Redis ("UserDetails") → stored proc `sp_GetUserPermissionData`** (validated against `UserPermissionCache.CacheKey`). It then stamps SQL **`SESSION_CONTEXT`** with `UserId, CompanyId, PermissionType, CacheKey, UserRole`. SQL-side **predicate functions + security policies (RLS)** read that to filter rows. Has an `AllowAnonymousInsert` bypass + post-save read bypass. → The DATABASE itself enforces security.
- `ESS.Ecosys.Safety.Data\Interceptors\UserSiteAccessInterceptor.cs` — rewrites `User.UserSites.Any(...)` LINQ expression trees so GlobalAdmin/SuperUser implicitly get access to every site (reality-rewriting; the "god mode" beat).

**GenAI world:**
- SafetyChatAgent (`C:\AIResearch\SafetyChatbot-5`): NL-to-SQL analytics — pipeline = intent detection → schema RAG → business rules → SQL generation → validation → correction loop → RLS-aware controlled execution → visualization; plus semantic caching, failed-query logging, telemetry, pipeline tracing.
- Galaxy Assistant (`C:\AIResearch\GalaxyAssets\GalaxyAssistant`): .NET 10 + Angular 19 + Azure OpenAI + Microsoft Graph; integrates Teams/Outlook/Calendar/Azure DevOps for summarization, retrieval, DevOps query generation, task automation; Entra ID auth; won 3rd/9 in an internal competition.

**Resume highlights:** 5+ yrs .NET/SQL/Azure; 1,200+ commits, 400+ PRs; RLS/RBAC/multi-tenant; Azure AI Search (exact/fuzzy/semantic/vector); banking APIs (Manipal), govt (C-DAC), Infomatrix (Safety + Macro search).

## 6. ASSETS — full inventory (ALL of my generated art is in `assets/worlds/`)
All 8 sheets I generated are copied into **`<workingdir>/assets/worlds/`** (paths below are relative to the working dir in Section 1).

**Ready-to-use backdrop scenes (full-scene, rich, already used in gyroscope-proto):**
- `assets/worlds/6.webp` — Identity Aura (robotic hands holding a split blue/pink crystal, twin galaxies, husky guardian statues, portal stairway).
- `assets/worlds/7.webp` — Into the Vault (husky walking up a glowing portal stairway between guardian huskies).
- `assets/worlds/8.webp` — Predicate Oracle (central crystal in a ring, floating document tablets in 4 tints = exact/fuzzy/semantic/vector, husky statues).

**Sprite sheets (composite, on WHITE background — before use, either ask me for individual transparent PNGs, OR knock out white at runtime: draw to an offscreen canvas, `getImageData`, set near-white pixels alpha=0; then use as an atlas via `drawImage` sub-rects):**
- `assets/worlds/1.webp` — avatar "operator" (2 frames: panel-touch, lever-pull), matches `assets/madhur-character.png` (black outfit + brown side-bag).
- `assets/worlds/2.webp` — Boot Sequence set — server tower (6 stackable segments), CPU chip, encryption vault (lock/open), SQL vault, Redis module, Azure cloud-uplink, CI/CD conveyor (DEV/QA/UAT/PROD).
- `assets/worlds/3.webp` — TRACE set — data-packet (orb→crystal→answer, 3 frames), AUTH gate, INTENT fork (Analyze/Act doors), Schema-RAG shards, SQL forge, Validate+Correction, Galaxy orbs (Teams/Outlook/Calendar/DevOps).
- `assets/worlds/4.webp` — Gyroscope core — 5 identity sigils (UserId/CompanyId/Role/PermissionType/CacheKey), cache-ladder rings (Memory/Redis/Oracle), predicate-lattice tiles (yours/denied), multi-tenant mirror-worlds.
- `assets/worlds/5.webp` — Gyroscope frames — elevation-burst (4), search-oracle 4 tints, shield states, mirror-orb spins.

**Existing engine assets:** `assets/madhur-character.png`, a husky companion sprite atlas under `assets/`, and lots of procedurally-drawn mech symbols in `portrait-scene.js` / `world.js` to learn the art language from.

### PATHS QUICK REFERENCE
- **Working dir:** `C:\Users\Madhur\Documents\Codex\2026-09-15\c-users-madhur-downloads-placeholder-teddy\outputs\placeholder-teddy-scrollworld`
- **Built prototypes:** `boot-hub-proto.html`, `gyroscope-proto.html` (both at working-dir root)
- **Generated art:** `assets/worlds/1.webp` … `8.webp` (1–5 sprite sheets, 6–8 backdrops)
- **Security project (interceptors + SQL):** `C:\Users\Madhur\source\repos\ESS.Ecosys.Safety.API` — key files `ESS.Ecosys.Safety.Data\Context\SetSessionContextInterceptor.cs`, `ESS.Ecosys.Safety.Data\Interceptors\UserSiteAccessInterceptor.cs`, SQL under `ESS.Ecosys.Safety.Data\Scripts\`
- **GenAI project — SafetyChatAgent (NL-to-SQL):** `C:\AIResearch\SafetyChatbot-5\SafetyChatbot-5`
- **GenAI project — Galaxy Assistant:** `C:\AIResearch\GalaxyAssets\GalaxyAssistant`
- **Resume:** `C:\Users\Madhur\Downloads\Madhur_Budhwani_Resume.pdf`

## 7. WHAT IS ALREADY BUILT (standalone prototypes at repo root — NOT yet wired into the real app)
- **`boot-hub-proto.html`** — APPROVED. Cold boot: a "MADHUR_OS" terminal boot-log types my real stack (POST → .NET 10 → SQL Server·EF Core → Redis → Azure → RLS·SESSION_CONTEXT ARMED → 5+ yrs·1,200+ commits·400+ PRs → SYSTEM READY), then resolves into the **HUB**: 3 big signature tiles (Boot Sequence / Trace / Gyroscope) + a "the person" divider + Beyond Code + About Madhur. Tapping a tile shows an "ENTERING…" transition. This is the entry frame + the mobile home for the old landscape hub.
- **`gyroscope-proto.html`** (v3) — WORKING, built first at my request. The 3-layer model that we finally got right:
  - **Layer 1 (background):** my scene art (6/7/8.webp) full-bleed, with liquid warp + slow zoom + tilt-parallax + bloom + chromatic aberration + hue-breathing, THEN a **dark scrim + radial vignette** to tame brightness.
  - **Layer 2 (interactive foreground, currently procedural):** the gameplay.
  - **Layer 3 (HUD):** beat title, telemetry (`RLS ON · latency · tenant #`), progress counter, one-line caption, hint.
  - **Beat 1 — Identity Aura (bg 6):** 5 sigil shards scattered; user TAPS each to lock it into orbit around the core; each lock reveals its meaning (UserId/CompanyId/Role/PermissionType/CacheKey); at 5/5, tap the core to descend. (Confirmed working: tapping increments "identity N/5" and reveals captions.)
  - **Beat 2 — Into the Vault (bg 7):** 3 cache gates (Memory→Redis→Oracle); tap each in order to "resolve permission"; then tap to enter beat 3.
  - **Beat 3 — Predicate Oracle (bg 8):** user TILTS to shift identity-phase; rows that are "yours" glow (tap to read), the rest **REDACT** (RLS live); read 4 → "the archive obeyed your identity."
  - **Input:** `deviceorientation` (iOS needs an "ENABLE TILT" permission button, present) + pointer/drag fallback for desktop; tap-vs-drag distinguished by movement threshold. Progression is **only** by user action — nothing auto-advances.

## 7.5 GYROSCOPE — ITERATION LOG (mistakes already made — DO NOT REPEAT)
This world took 3 tries. Each was rejected by Madhur for a specific reason. Learn from these; do not regress.

- **v1 — thin procedural line-art (REJECTED).** I drew the whole world as thin neon geometry: glowing stroke-rings, a tiny grid of lattice cells, a thin-line kaleidoscope "mandala," small sigil circles. Madhur's verdict: *"clarity nahi hai phone ki choti screen pe, kachra lag raha hai"* (looks like junk/clutter on a small phone). Specifically the **cache-ladder rings collapsed into each other** (overlapping, unreadable), and it **didn't feel trippy at all**. His definition: *trippy = distinct bright kaleidoscope structures, rich, moving/hazy* — NOT thin lines. He then generated the reference art (now `assets/worlds/6/7/8.webp`) to SHOW me what trippy means. **Lesson: never make thin procedural geometry the main visual on a phone — it reads as noise. Trippy comes from rich art, not strokes.**

- **v2 — rich art backdrops + motion only (REJECTED, but half-right).** I used his scenes (6/7/8) full-bleed with liquid warp + bloom + chromatic + hue-breathing + parallax. The **trippy/hazy MOVING feel was finally achieved** — keep this. But rejected because: (a) *"ye to backgrounds wire kiye, foreground me kuch ho hi nahi raha"* — only the background moved, the **foreground was empty, no gameplay**; (b) *"bahut bright hai, iske upar ek overlay aayega"* — the art was **too bright**, needs a dimming overlay; (c) *"aise bas apne aap 3 slides change hogi, aisa nahi"* — it was a **passive auto-advancing 3-slide reel**. His core demand: *"user is world me aaya hai, apne action se saari cheezon ka meaning banega"* (the user must DRIVE it; meaning forms through the user's own interaction). **Lesson: art-as-hero + motion is necessary but NOT sufficient — it must be dimmed and it must be an interactive game, not a reel.**

- **v3 — current (accepted so far).** Dimmed backdrop (dark scrim + vignette) + **interactive foreground** (tap sigils to stamp identity → tap gates → tilt+tap rows) + **user-driven progression** (nothing auto-advances). This is the model to extend to the other 2 worlds too.

**Net rules distilled (these ARE Section 4, restated because I violated them and paid for it):** rich art is the hero (never thin geometry) → dim it with an overlay → put an interactive, user-driven foreground on top where each element's meaning is revealed by the user's action → never auto-advance.

## 8. WHAT REMAINS (priority order)
1. **Gyroscope polish:** replace the procedural foreground rings/gates/rows with my actual **sprite art (sheets 4 & 5)**; tune dim/warp/hue levels; smooth beat transitions; wire the iOS tilt-permission into the flow. Optionally add more beats (Elevation "god-mode" = `UserSiteAccessInterceptor`; Search Oracle exact/fuzzy/semantic/vector; Audit Trail).
2. **Wire the prototypes into the REAL app:** integrate `boot-hub` + worlds into `index.html`'s experience routing, REPLACING the old `portrait-*.js` tower. (`experience-mode.js` currently decides portrait vs desktop and loads `portrait-app.js`/`portrait-scene.js`/`portrait.css` — swap these out.)
3. **Build the TRACE world (GenAI):** first-person packet down the NL-to-SQL pipeline; branch at INTENT into Analyze (SafetyChatAgent) vs Act (Galaxy). Use sheet 3. Same 3-layer model (art bg dimmed + interactive foreground + HUD; user-driven).
4. **Build the BOOT SEQUENCE world (Backend + Cloud):** interactive boot/power-up deep dive; use sheet 2 + operator sheet 1; content from desktop slides 1/2/6 + resume work history in `world-content.js`.
5. **Hobbies + About Me:** give the existing rich experiences a home reachable from the hub.
6. **Asset pipeline:** transparent-PNG / atlas prep for sheets 1–5 (runtime white-knockout works; or ask me for clean PNGs).

## 9. REPO CONTENT SOURCES
- `story-data.js` — the 9 chapters (boot/backend/azure/security/search/genai/delivery/writing/hub) with kickers, titles, bodies, skill lists.
- `world-content.js` — deep world data (`work`, `genai`, `hobbies` levels) built from my resume: exact job history, project descriptions, links.
- `about-data.js` — About Me observatory content.
- `PORTRAIT.md` — notes on the old (rejected) tower.
- Desktop engine to learn the art/animation language from: `director.js`, `world.js`, `portrait-scene.js`, `choreography.js`, `avatar.js`, `companion.js`.

## 10. HOW TO WORK WITH ME
Bold original ideas grounded in my real code; be decisive; keep it tight; Hinglish is fine. When you need art, give me exact 8-bit prompts with the palette above and I'll generate and hand it back. Build real, runnable slices I can feel on my phone — not plans.

Start by: confirming you can run `gyroscope-proto.html` and `boot-hub-proto.html`, then continue from Section 8 item 1 (integrate my Gyroscope sprite sheets 4 & 5 into the foreground) unless I say otherwise.


## 11. LATEST OWNER FEEDBACK AND IMPLEMENTATION (supersedes "v3 accepted so far")

The owner subsequently rejected the Gyroscope foreground and layout. Only the rich moving background effect was liked. A crystal/scanner pilot was then built; the owner found it better but still unclear about what the actions meant or what his engineering achieved.

The clarified scope is **system architecture + security + search**, covering landscape chapters 03 and 04 in full. Architecture must explicitly show designing complete applications from scratch and established practices including SOLID. Nontechnical visitors must understand each object's purpose, their action, and the resulting benefit. Small unexplained icons and jargon-only explanations are not acceptable.

Current review URL: `http://127.0.0.1:4173/gyroscope-chamber.html`. It now loads `gyroscope-world.js`, `gyroscope-renderer.js` and `gyroscope-world.css`. The old scanner JS/CSS are superseded but retained. The approved boot-hub prototype's Gyroscope tile opens this experience; the main desktop application is unchanged.

The updated implementation offers five user-driven experiences: assemble/change an application; compare user/company access; reuse/invalidate permission information; encrypt a fictional value and record a status change; try exact, fuzzy, semantic and vector-style search examples. Objects have visible descriptive names and purpose labels. Optional explanations cover the actual mechanisms and all five SOLID principles. Records and search examples are explicitly local illustrations, not live project data or live Azure search.

This revision has NOT yet received the owner's visual approval. Do not label it approved. No tests or browser/gameplay QA were run, following the owner's persistent instruction to leave testing to him unless requested.
