# Portfolio Phases

## Phase 1

- Boot brand header; compact navigation disclosure on all later chapters.
- Preserve the space, perspective grid, frames and original stars; add restrained planets and scroll-linked bright stars.
- Larger fully visible actor: train boarding/run, rope-operated reel, security idle, spiral ride.
- Unique GenAI circuit/correction path, delivery bridge construction, writing pop-up notebook.
- Ground apertures: Work Experience, GenAI Projects, Hobbies. Walk to selected aperture, descend, transition to a routed arrival shell.
- Restore point: `work/phase1-before-20260915` in the parent workspace.

## Phase 1 Revision

The 16 September change spec and mechanical transforming dog are now part of Phase 1. See `REVISION-20260916.md` for details, source prompts and rollback notes. The dog is not deferred to Phase 2. Boot sub-items are provisional resume-based lists, pending Madhur's final wording.

## Phase 2 — Playable worlds

The interior-world discussion is complete. These worlds use direct keyboard/touch movement, not scroll-linked animation.

- Work: a rooftop route with jump, highlighted web anchors, held attachment, momentum on release, forward/reverse traversal and safe landing checkpoints.
- GenAI: a lunar route with low gravity, high jumps, a finite jetpack boost and recharge on landing. Six utility stations replace project-specific exhibits: Find Answers in Documents, Ask Questions About Your Data, Automate Everyday Tasks, Give an AI Assistant a Task, Check Answers and Protect Private Data, and Keep AI Fast and Reliable.
- Hobbies: a gallery with six framed interests, using existing illustrations pending original media. Shift (or the touch JETPACK/DOG button) toggles an animated dog-to-jetpack transformation. Hold Space/RISE to ascend, S/down arrow/DOWN to descend, A/D to fly sideways; release vertical controls to hover. Boost is unlimited, the ceiling keeps the avatar visible, and exhibits can open while hovering near them. Reset returns the pet to dog form.
- Shared: A/D or left/right to move; Space to jump in the main hub and every world; Shift for web/boost; W only climbs an attached web; E to interact; R to recover. Touch buttons support simultaneous movement, jump, web and climb. The camera follows the player, dog proportions stay at 0.60 of avatar height, and dialogs/orientation changes pause input safely. Space no longer scrolls the main movie; its arrow/page controls are preserved.
- Web shots grow from the registered avatar hand toward the selected anchor before attachment and tension begin. The silk uses several irregular filaments and loops; an adhesive spiral spreads over the target on impact. W shortens the attached web with a two-pose climbing cycle, stops at a safe minimum length, and preserves the shortened length for swinging when W is released.
- The dog flies independently beside the swinging avatar using twin cyan thrusters; no web or tether connects them. In the gallery, existing dog sprite panels fold toward the avatar's back and unfold into a silver/cyan jetpack; reversing the toggle restores the dog.
- Existing avatar/dog artwork is reused. No new image generation was required. Main-page scrolling is preserved.

### Content still needed

The user approved utility-based GenAI stations and guided interactive experiments. E now opens a lunar console with pixel machinery, selectable inputs, an animated pipeline, result/evidence, replay, skip and an expandable implementation explanation. Search selects source passages or refuses an unsupported answer; query experiments aggregate fictional rows; workflow inputs produce four different draft outcomes; agent missions select different tools; trust gates separate permission and evidence failures; reliability retains a local scoped cache between completed experiments and illustrates a bounded retry. All examples are explicitly local simulations; they call no AI, database or external service. Canvas animation uses the existing graphite, cyan and mint style with no new generated artwork.

Hobbies category contents are reserved for the next discussion; no original media has been invented.

Work content is sourced from the two-page `C:/Users/Madhur/Downloads/Madhur_Budhwani_Resume.pdf`, supplied by the user. The chronological route is Freelance Web Development (Nov 2018 - Feb 2020), C-DAC (May 2021 - Oct 2022), Manipal Business Solutions (Oct 2022 - Oct 2024), and Infomatrix Inc. (Oct 2024 - Present, as stated in the resume). Roles, locations, projects and outcomes are summarized in `world-content.js`. The PDF itself and its contact details are not copied into the website.

Original hobby photos, drawings, recordings and videos remain pending. Gallery frames currently show the existing illustrations; these are not presented as the user's original portfolio media.

Owner-supplied additions: the freelance entry includes the website built for Seema Bhogate, a Pune-based German language instructor, with project context and a link to https://seemabhogate.com/. The C-DAC entry explicitly includes client-site visits, relationship building, deployment to client servers and feedback collection. These additions supplement the resume.

### Validation

`node work/world-check.cjs` checks complete forward/reverse city and moon traversal, web launch/cancellation/climbing/release, platform recovery, frame-rate parity, moon boost limits/recharge, uniform jump inputs, gallery unlimited flight/hover/descent/ceiling/airborne exhibits, keyboard and multi-touch input, wheel isolation, and pause/reset/rotation behavior. It also renders the actual canvas and avatar code through a mocked DOM into `work/world-*-canvas.png`; these previews do not include browser-rendered HUD/CSS. Actual browser/mobile verification remains pending. Main-page regression checks are retained.

`node work/lunar-lab-check.cjs` verifies 17 input combinations through the real console controller and canvas renderer, sample aggregates, source selection, workflow branching, permission/evidence stops, session cache behavior, replay, skip, input cancellation, closed-panel cleanup, visibility/orientation pause and reduced motion. `work/lab-contact-sheet.png` shows the six rendered instruments. Responsive HTML/CSS keeps native controls and result text separate from the canvas, with a narrow-screen stacked fallback; browser layout remains unverified because browser launch was previously rejected.

## Original discussion topics

When Phase 1 is complete, remind Madhur to discuss the interior worlds before designing them.

1. Work Experience world: page structure, employers, case studies, progression.
2. GenAI Projects world: actual projects, demonstrations and interactions.
3. Hobbies world: writing and other interests, including Placeholder Teddy.
4. Additional animated characters and object mascots, including a teddy bear for Placeholder Teddy.
5. Content and navigation connecting the worlds back to the hub.

`world.html` now hosts the playable worlds. Editable content is in `world-content.js`; shared physics is in `world-physics.js`.

### Visitor-friendly station copy

Applied the owner-reviewed station names, full explanations, and action labels. Each introduction explains the use case, what to choose, what button to press and what result to expect. Technical skill labels now live inside the implementation disclosure. The animated steps use plain-language labels, and moon signs wrap longer names across two lines. The orders example describes order activity, not revenue.
