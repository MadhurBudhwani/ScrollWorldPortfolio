# Claude handover — current mobile build rejected; fix quality before adding scope

Written 19 September 2026. This records the actual working tree after the latest Codex turn.

## Read the owner's latest feedback first

Madhur's exact complaint:

> “animation aur flow ekdum ghatiya lag raha hai, white bg ab bhi kayi jagah par hai, pet abhi bhi gayab hai avatar ka, avatar screen ke hisab se bohot bada dikh raha hai”

He has rejected the present result. He asked Codex to STOP implementing and leave this handover for Claude. Do not call this version polished, professional, approved, finished, or verified. Source changes were made, but the desired visual outcome was not achieved.

Immediate priorities, in order:

1. Remove the visible white cards/halos without destroying white details in the art.
2. Restore the missing mechanical husky companion.
3. Make the avatar appropriately sized for the phone and environment. He is currently TOO BIG; do not respond by increasing him again.
4. Fix composition, feet/prop alignment, animation continuity and pacing as a coherent scene.
5. Make the flow feel natural and understandable. Smooth crossfades alone do not make unrelated still poses into human animation.
6. Finish or safely restore the partially changed Trace entry; it is not a completed handoff from its implementation agent.

## Owner constraints that override older documents

- **Do not generate new visuals.** Madhur supplies artwork. If another pose, prop or background is actually needed, give him precise prompts; he will generate it. He wants prompts in batches of at most 10.
- Preserve the supplied artwork and the visual ideas he liked. Do not remove important animations to hide bugs.
- **No testing unless he explicitly asks.** He previously said to leave testing to him. No browser gameplay QA, automated tests, syntax checks or unsolicited test scripts were run in this pass. Older handovers saying “play it end to end” do not override him.
- Easy English inside the product. Plain explanation first, technical tag second.
- No narrow stacked bands that trap the world in a small strip, no forced pagination, no footer Next-button slideshow.
- Rich art, readable foreground, meaningful player actions; no tiny unexplained icons.
- Do not rewrite the resume, commit unrelated work, or discard existing uncommitted changes just because older notes suggest it.
- Desktop animations/autoplay were previously approved. Preserve timing and behavior except for a justified focused repair.

## Workspace and entry points

Workspace:
`C:\Users\Madhur\Documents\Codex\2026-09-15\c-users-madhur-downloads-placeholder-teddy\outputs\placeholder-teddy-scrollworld`

Vanilla HTML/CSS/JS/Canvas. Source served by `node scripts/serve.cjs` on port 4173; user also uses Live Server on 5500.

- `index.html`: desktop entry; portrait now redirects to the mobile hub.
- `boot-hub-proto.html`: cold boot and five world links.
- `boot-world.html`: Backend & Cloud tap/defend game; central focus of the recent failed polish.
- `trace-world.html`: now points at **trace-game.js**, NOT trace-world.js.
- `gyroscope-chamber.html`: the earlier architecture/security/search version. Madhur had explicitly approved its clarity before the later game-plan discussion. Do not lose its whole-application architecture/SOLID content.
- `world.html?world=hobbies&experience=portrait` and `world.html?world=about&experience=portrait`: existing rich person/gallery experiences.

Last commit is `4fea27a`. Much of the build is UNTRACKED, so `git diff` alone does not show it. Read `git status --short` and the new files too. Nothing was committed in the latest pass. `dist/` was not rebuilt in this pass; do not confuse it with current source.

## Supplied transparent ZIP and actual import

Original ZIP:
`C:\Users\Madhur\Downloads\scrollworld-transparent-png.zip`

62 supplied PNGs were copied into the project, preserving names, full canvas and framing:

- ZIP `anim/*.png` → `assets/worlds/anim/*.png` (40 frames).
- ZIP `icons/*.png` → `assets/worlds/icon-*.png` (12 icons).
- ZIP `props/*.png` → `assets/worlds/prop-*.png` (5 props).
- ZIP `sprite-sheets/1.png` through `5.png` → `assets/worlds/1.png` through `5.png`.
- Original WebP counterparts are retained.

Source-image inspection found 1254×1254 ARGB images. Corner alpha was 0 for sampled lever, desk, talk and bug PNGs; sheet 3's corner alpha was 1. **This only establishes that those corners have alpha. It does NOT establish that all background white was removed. The owner still sees white backgrounds.** Do not dismiss his report because the extension says PNG.

Investigate actual image URL used at each offending location, PNG interior white islands/edges, browser caching and old direct `.webp` references. The ZIP README describes the original conversion request, not proof of success. Do not blindly erase every white pixel: shoes, armour plates and highlights must remain.

`trace-renderer.js` now has:

- `TraceRenderer.asset(src, size)`: tries the same basename `.png`, returns its direct URL, falls back to legacy WebP white removal if unavailable.
- `cutout()` is a compatibility alias to `asset()`.
- `removeLegacyWhite()` is the old edge-connected flood fill, only for fallback.
- PNGs bypass that cleanup entirely. If a supplied PNG still has white islands, they will remain visible.
- Loader results are cached for that page. No offline derived art was generated.

Gyroscope's separate `gyroscope-renderer.js` still loads numbered WebP sheets directly. Other legacy paths may do so too. Trace's old `intake-hero.webp` did not have a corresponding PNG in the ZIP. Audit references rather than assuming every path uses the new loader.

## Missing pet — concrete source bug, not a guess about visibility

In `companion.js`:

```js
const companionAtlas = new Image();
const companionSprites = [ /* ... */ ];
```

They are top-level lexical constants. They are **not** properties on `window`.

In `world-engine.js`, the new Pet checks and draws:

```js
window.companionAtlas
window.companionSprites
```

Therefore the guard can fail even though `companion.js` loaded successfully, and the pet body never draws. Fix the shared contract explicitly (an exported object or correct references); preserve existing desktop consumers. Then address floor, z-index and visible dimensions rather than adding a placeholder dog.

`boot-world.html` does include `companion.js`. **Trace currently does not include `companion.js` or `avatar.js`, and its new controller does not instantiate Pet at all.** Do not claim a companion exists in Trace. The shared PoseActor can show provided pose images without AvatarAnimator, but its genuine walking fallback needs `avatar.js`.

No application code was changed after the owner's final stop request, so this pet bug remains for Claude.

## Current motion implementation and why it still needs design work

### pose-actor.js — rewritten this pass, not approved

The former single wrapper changed size immediately on scene/character switches. The replacement gives the two image layers independent sizes and anchors and blends their opacity. It retains async request tokens and sequence cancellation.

Current group-wide registration constants:

| Group | x anchor | foot | head | fill | posture |
|---|---:|---:|---:|---:|---:|
| talk | .51 | .969 | .035 | .934 | 1 |
| react | .50 | .967 | .043 | .924 | 1 |
| lever | .245 | .888 | .180 | .708 | 1 |
| desk | .39 | .891 | .103 | .788 | .87 |

These are coarse group estimates from a few representative frames, **not reliable per-frame character/prop registration**. Artist drawings shift composition across frames. A lever/desk contains a prop and actor; fitting the whole square and pretending its center is the character is wrong.

- `personHeight = min(H * charHeight, W * .62)`.
- Boot requests `charHeight: .265`, ground `.84`; in short landscape it switches to `.39`, ground `.90`. Owner says oversized. Retune from visible body size and usable scene depth, not square image size alone.
- Talk/scene crossfade is about .23s; within sequence about .095s.
- `play()` adds first/last holds and advances frames through rAF.
- `walkTo()` uses a critically damped spring and an existing AvatarAnimator walking layer. Size/style of that atlas can differ from newly drawn poses. Align head/body proportions and floor before relying on the crossfade.
- Desk/lever images include their own props. Do not mirror or bob the whole desk like a human torso.
- Big pose changes can still look like dissolving paper cutouts. Use pose sequences for actual transitions, neutral holds where appropriate, and limited gestures. Do not constantly alternate unrelated poses just to avoid stillness.

### boot-game.js — rewritten this pass, not approved

An epoch and animation-clock waits now guard restart and old async callbacks. Dialogue/work/reaction priority is more centralized. These are engineering improvements, not evidence the scene looks good.

- Cold start: talk → walk to x .32W → lever 01–10 → background crossfade + bricks → desk 01–03.
- Engine uses desk art; later stages use standing/talk poses with vault/capsule props. Dedicated convincing vault/uplink/launch interactions are still missing. Do not pretend these exist.
- Actor remains around x .28W; vault/capsule target at .73W. Layer size and background perspective were not visually tuned together.
- Work cycle currently alternates desk 03/04/03/05 every ~2.1s. A work loop should read as purposeful hand movement, not a periodic whole-image replacement.
- After every two player kills the game pauses for a skill line. Pet kills do not advance the teaching beats.
- Vault target is no longer overwritten with avatar position; delivery bugs approach capsule from one side.
- “Release gate” progression is still mainly pips/dialogue. There is not yet a convincing capsule progressing through physical review/QA/UAT gates.
- Vault/capsule props are wired, but drawing a large prop next to a large actor does not guarantee coherent composition.
- New Pet draws its body and missiles in a full-playfield canvas; launch position stored in world coordinates; damage happens at impact. Its missing lexical-global contract above prevents the dog art drawing.
- New scene code pauses its clock for hidden pages/dialogs and uses cancellation on reset. Keep that behavior.

### world-game.css / speech-bubble.css

- Shared pose wrapper now fills the playfield; each `.pose-layer` is positioned independently.
- Boot dialogue body enlarged to 15px, width 352px. That may obscure scene/title at short heights. Do not solve it by shrinking everything or hiding essential content.
- Dialogue follows `actor.headY`; current coarse head registration can move it incorrectly when switching poses.
- Shared bubble currently applies clip-path to the parent while a pseudo-element tail extends beyond it. This can clip the tail. Inspect structure rather than piling on offsets.
- Preserve readability, stable bubble position, consistent ground line, enough clear space for play and the pet. Put technical depth in the existing optional explanation, not multiple huge simultaneous panels.

## Trace is PARTIALLY CHANGED — urgent consistency issue

A delegated implementation ran out of usage before completing its handoff. It wrote new markup and a new `trace-game.js` but did not supply a completed stylesheet/integration report.

Current `trace-world.html` loads:

```text
speech-bubble.css
world-game.css
trace-world.css
trace-renderer.js
world-engine.js
pose-actor.js
trace-game.js
```

New markup uses `#traceBoard`, `#traceCast`, `#traceSpeech`, `.trace-scene`, etc.

At this handoff, `trace-world.css` still contained the OLD `#arena`, `#artifact`, `.glass`, `.choice-grid` layout; the promised new scoped drag-game CSS was not present in the inspected tail. This is a likely major source of broken layout/flow. **Do not treat the mere existence of trace-game.js as a completed implementation.**

- `trace-world.js` remains the old button-based controller and is no longer loaded by this page.
- `trace-game.js` contains intended branching, drag destinations, local fixtures, holds, speech, trace log and lifecycle controls. Read it completely before deciding what to keep.
- Trace actor currently caps visible height around 155px and places at .83W. Its relationship to board, bubble and pet is not composed.
- New page lacks avatar/companion scripts and pet instance as noted above.
- Complete the styling/controller contract as one coherent scene. Avoid loading both old and new controllers together.

Desired GenAI content remains:

1. Visitor chooses Safety Chatbot (analyze data) or Galaxy Assistant (workplace actions) at the intent fork.
2. Safety: select relevant schema/business meaning; missing necessary context blocks the query; extra unrelated context shows the trade-off without fabricated production cost numbers.
3. Show validation catching a mistake and correction repairing it; permissions still apply when executing.
4. Show an answer/chart from fictional allowed records; explain the useful outcome.
5. Galaxy: Teams/Outlook/Calendar/DevOps tools, useful combined output, clear preview before a local simulated action. Never send real messages.
6. Preserve optional technical explanations, semantic cache and tracing concepts. Real Safety cache reuses verified SQL then executes again; do not misdescribe it as blindly reusing an old answer.

## Other changes already on disk

### Mobile routing (unverified)

`experience-mode.js`, `index.html`, `boot-hub-proto.html`:

- Portrait index redirects with location.replace to new hub before old main bundles load.
- Explicit `experience=desktop` preserves desktop entry.
- Hub links point to Boot, Trace, existing approved Gyroscope, Hobbies and About.
- Return skips repeated cold boot per session; original desktop chapter hash highlights relevant tile.
- Hub links are real anchors with keyboard support and preserved page position.
- Gallery/About still use existing portrait world containers and rich modals. Do not confuse “main tower replaced” with those experiences redesigned.

### Desktop train (unverified)

`choreography.js` has focused edits: eased travel start/stop, engine→carriage roof height blending, airborne/landing pose during carriage gaps. Artwork and approved autoplay durations retained. These were source-level changes only. Avoid a wider desktop rewrite while the mobile scene is failing.

### Copy corrections worth preserving

The failed polish also removed unsupported first-person claims. Keep factual fixes even if replacing scene logic:

- Encryption work: **IndusInd Bank + ICICI Bank, 500+ stored procedures**. Five banks was API integration, not encryption rollout. No unsupported “no downtime” claim.
- **1,200+ commits and 400+ merged PRs**, not an invented “shipped without drama” guarantee.
- Removed fabricated personal midnight rollback story.
- Whole-database encryption is not universally slower/worse than column encryption. Explain threat model/trade-off.
- No guaranteed instant responses, automatic scaling or “cache always removes every SQL read”.
- Galaxy has multiple identity flows; do not claim every action can only use delegated user permissions when source includes app credentials.
- Runtime branding changes to `.NET 10` and linked mascot keys are already in the working tree. Keep ASP.NET Core / EF Core names.

## What to do next — concrete repair order

1. Read current source and uncommitted changes. Do not reset all files to the last commit.
2. Fix the confirmed pet asset contract and the incomplete Trace markup/style integration.
3. Find each remaining white background's actual source. Use supplied PNGs correctly; ask Madhur for corrected assets if actual alpha is incomplete. No self-generated replacement art.
4. Establish one ground/perspective model and a modest avatar silhouette appropriate to the scene. Compose actor + companion + prop + bubble together at portrait dimensions. Group formulas are insufficient; use per-sequence/per-frame registration where art shifts.
5. Repair one continuous cold-start sequence: standing → credible walking → planted feet at lever → hand contact → weight through pull → lights react → settle → move into work. No abrupt size changes, sliding prop, double ghost bodies, teleporting positions or three effects all competing at once.
6. Let calm holds breathe. Intentional timing and action order matter more than constant motion and extra effects. Keep each object's purpose visible.
7. Apply the same shared geometry/timing fixes to later stages. Make vault, uplink and delivery feel like distinct actions; request missing pose art rather than faking them with unrelated talk frames.
8. Preserve Gyroscope's clear architecture + security + search explanations. Any future game redesign must still explain building whole applications from scratch and SOLID, not regress to security jargon alone.
9. Only claim completion based on work actually completed. Leave testing to Madhur unless he changes that instruction.

## Background references

- `GAME-PLAN.md`: broader direction from Claude; read with latest owner feedback above.
- `HANDOVER-GPT.md`, `GYROSCOPE-CHAMBER.md`: older history; approval statements apply only to the earlier Gyroscope revision, not this mobile quality pass.
- `story-data.js`, `world-content.js`: profile/content grounding.
- Security code: `C:\Users\Madhur\source\repos\ESS.Ecosys.Safety.API`.
- Safety GenAI: `C:\AIResearch\SafetyChatbot-5\SafetyChatbot-5`.
- Galaxy: `C:\AIResearch\GalaxyAssets\GalaxyAssistant`.

Do not spend the next turn congratulating the existing changes. The owner is unhappy with the actual result. Correct the fundamentals, preserve the art, and keep communication short and honest.
