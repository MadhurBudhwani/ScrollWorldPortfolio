# GAME PLAN — mobile worlds rebuild

Everything decided in the regroup session. This supersedes earlier per-world notes where they disagree. Nothing here is built yet unless marked DONE.

---

## 0. The shift

The three mobile worlds stop being screens you read and become **games you play**. The user completes a task; Madhur's avatar works alongside them and narrates.

**One verb per world — each world must feel different in the hand.**

| World | Verb | Feel | Fantasy |
|---|---|---|---|
| Boot Sequence — Backend & Cloud | **TAP** | defend | clear the threats so he can build |
| Gyroscope — Architecture & Security | **TILT + HOLD** | control | align the lock, seal the request |
| Trace — GenAI | **DRAG** | guide | route the question, pick up what it needs |

---

## 1. Standing rules (apply everywhere)

**R1 · Avatar movement is the top priority.**
No glitchy, robotic motion. Smoothest possible, with realism — it must look like professionals worked on it. That means: proper easing (never a linear lerp), anticipation and follow-through, feet planted on the ground, weight and momentum, secondary motion on the bag and hair, and blended transitions between states — never a snap.

**R2 · The avatar explains at every stage.**
Non-technical people must understand what just happened. Two-layer chat bubble:
- Big line: plain, human, first person, one idea, and why it matters.
- Small tag underneath: the real technical term, for engineers scanning keywords.

Show first, then name it. Never lead with jargon.

**R3 · Language.**
Easy English. Occasionally an impressive word. Madhur's voice — first person, short, confident, not salesy. Never Hindi or Hinglish inside the product.

**R4 · Quality bar.**
All graphics high quality, all animations smooth — mobile *and* desktop. "Playful" describes a concept (the pet's missile), never the execution. Known offender: the **train animation in the desktop/landscape world looks cheap** — fix it.

**R5 · No bottom "next" buttons.**
The avatar carries the user forward. He says something rewarding, then leads into the next stage. Progression is earned in the scene, not clicked in a footer.

**R6 · Use all the backgrounds.**
Each world has several good backgrounds. Every one gets used as its own stage.

**R7 · Copy discipline.**
No filler text. Every line is meaningful, impactful, and hints at what is coming.

---

## 2. Hub screen — LOCKED

Flip the hierarchy. The codenames (Boot Sequence / Trace / Gyroscope) leave the headline — a visitor has no idea what they mean.

```
[icon]   Backend & Cloud                        <- BIG: what it actually is
         .NET 10 · SQL SERVER · AZURE · REDIS   <- small: what is inside
         Five years of production backend — APIs,
         data access, caching, and getting releases
         out safely.                            <- rich, brief, meaningful
         > Power it up yourself, part by part    <- hint: what you will DO
```

Final copy for all five tiles:

| Heading | Contents line | Description | Hint |
|---|---|---|---|
| Backend & Cloud | .NET 10 · SQL SERVER · AZURE · REDIS · CI/CD | Five years of production backend — APIs, data access, caching, and getting releases out safely. | Power it up yourself, part by part |
| GenAI | AZURE OPENAI · NL-TO-SQL · RAG · MICROSOFT GRAPH | Two real assistants he built: one turns plain questions into governed SQL, the other gets work done across Teams, Outlook and DevOps. | Pick a path, follow one question end to end |
| Architecture & Security | RLS · SESSION CONTEXT · EF INTERCEPTORS · AI SEARCH | How the same request returns different data for different people — access enforced inside the database itself, not just in the app. | Tilt to look around · a guided walkthrough |
| Hobbies | WRITING · SINGING · DRAWING · DESIGN · VIDEO | What the engineer does when nothing needs shipping. | A gallery to browse |
| About Madhur | THE PERSON BEHIND THE SYSTEMS | Why he builds what he builds, and what he is still curious about. | Follow the stars |

---

## 3. Boot world — TAP (defend)

### Known problems being fixed
- Three stations were three checkbox lists in a row.
- No progress indicator while picking subsystems.
- Choices had no consequence (2 services or 8 — same outcome).
- Wrong gate order produced a scolding, not a reward.
- "Pull the lever" was a button press, not an action.

### Cold start (bg 14)
Tight copy, no filler. The avatar **walks to the lever and pulls it** — a real action. The screen then **disintegrates like 8-bit LEGO** and the next stage **fades in**.

### The loop
```
Bugs crawl toward the avatar
  -> user taps a bug -> squashed into mechanical trash -> gone a second later
EVERY 2 KILLS -> pause
  -> big chat bubble over the avatar: logo + one skill
     "Great going — you just bought me enough time to wire up .NET 10.
      Now every request has an engine to run on."
  -> user TAPS to continue (time to read, and consent to move on)
  -> bugs resume -> next 2 kills -> next skill
```
- The pet fires a missile at any bug that gets close (on a cooldown, so it never becomes a crutch).
- The avatar drops hints between beats: "Keep them off me — fewer bugs, faster I work."

### Stages

| | 1 · Engine room `15` | 2 · Vault `16` | 3 · Cloud uplink `17` | 4 · Release gantry `18` |
|---|---|---|---|---|
| Avatar | sits down with his laptop | works a vault console | runs the uplink | launches the capsule |
| Bug pattern | crawl on the floor, slow, 2 at a time | target the **vault door**, 3 at a time, some **armoured (2 taps)** | **fly** — down the beam, arcing, faster | ride the **conveyor** toward the capsule; clear them before each gate |
| Twist | learning | now you defend *a thing* | movement changes | **time pressure** |
| Skills | .NET 10 · ASP.NET Core · EF Core + SQL Server · Redis · Background jobs | Database encryption · secure data access · audit trails · **5 banks / 500+ SPs / 30+ APIs** | App Service · Functions · Azure SQL · Blob · SignalR · API Management · Entra ID · Graph | CI/CD · DEV→REVIEW→QA→UAT→PROD · **1,200+ commits / 400+ PRs** |
| Choice | "web app or desktop?" | "column-level or whole database?" | "App Service or Functions?" | "straight to prod, or through UAT?" |

Escalation: **crawl → defend → fly → race.**

### Decisions
- **Pacing:** never 50 kills. Group closely related skills into one bubble (e.g. "EF Core + SQL Server") without dropping any. Target ~18 beats total. Later stages send more bugs at once, so they clear faster.
- **Overlap:** `RLS`, `EF interceptors`, `session interceptors` are **removed from Boot** and live only in the Gyroscope world, which is built around them.

---

## 4. Gyroscope world — TILT + HOLD — "Stamp the request"

A request arrives carrying an identity. The user **tilts the phone to align the lock rings** (a gimbal / vault tumbler), then **presses and holds to stamp SESSION_CONTEXT**. The moment it stamps, the data behind visibly filters: rows they are allowed to see light up, the rest redact. Security is something you *watch happen*.

| Stage | Variation | What it teaches |
|---|---|---|
| 1 | two rings, generous tolerance | identity stamping |
| 2 | **two identities at once** — a wrong stamp would leak another company's data (near miss) | multi-tenant isolation |
| 3 | a GlobalAdmin request: rings spin wildly, needs a **longer hold** | elevation / reality rewrite |
| 4 | tilt sweeps a beam, hold locks matches | search: exact → fuzzy → semantic → vector |

---

## 5. Trace world — DRAG — "Guide the question"

The question is a packet. The user **drags its route** with a finger, and **picks up what it needs** along the way.

| Stage | Variation | What it teaches |
|---|---|---|
| 1 | drag into one of two gates | intent fork |
| 2 | drag through a field of schema shards — **collect only the right ones**. Too many: the prompt bloats and cost/latency visibly rise. Too few: the SQL fails. | Schema RAG, with a real trade-off |
| 3 | the generated SQL has a fault — **drag the fault out**, then **hold to re-forge** | validation + correction loop |
| 4 | drag the answer through the row filter; unauthorised rows redact as it passes | RLS-aware execution |
| 5 | Galaxy branch: **connect** Teams / Outlook / Calendar / DevOps into the request, then **hold to send** | Microsoft Graph + taking action |

Stage 2 is the strongest beat in the world: the player's choice has a consequence they can see.

---

## 6. Project-wide change

**`.NET 8` → `.NET 10`** everywhere.

- `.NET Core` as a runtime name is **more** outdated than `.NET 8` — that branding ended in 2020. Do not use it.
- **Leave `ASP.NET Core` and `EF Core` alone** — those names are still current.
- `'.NET CORE'` is a **lookup key**, not just display text. It links `story-data.js` → `companion.js` (mascot form) → `mascot-catalog.js` → `phase1-qa.html`. All of them must change together or the mascot mapping breaks.
- Do not touch `work/` snapshots or `dist/` build output.
- **The resume still says .NET 8** — update it, or the portfolio contradicts it.

---

## 7. Build order

1. `.NET 10` project-wide (mechanical, fully specified).
2. Hub screen — new hierarchy and copy (locked).
3. Boot world — rebuild as the tap/defend game.
4. Gyroscope world — tilt + hold.
5. Trace world — drag.
6. Desktop pass — quality bar, starting with the train animation.
