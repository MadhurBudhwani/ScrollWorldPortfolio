# Gyroscope — architecture, security and search

The current review experience is `gyroscope-chamber.html`. The Gyroscope tile in `boot-hub-proto.html` now opens it. Main desktop routing and the old prototype are preserved.

## Current content

1. **Design an application:** assemble an incident-reporting system from a requirement. Named components explain the screen, request handling, business rules, storage and integrations. Add email alerts, replace a provider or change an approval rule. Optional explanations cover designing complete applications from scratch, all five SOLID principles, dependency injection, maintainability and testability.
2. **Control access:** send the same request as three fictional users. Company and site/company scope determine the returned reports. Restricted reports stay outside the response. Context stamping, EF interception, database predicates and RLS are explained behind the interaction.
3. **Reuse permissions:** compare an initial lookup, reuse in the current context, Redis reuse after a version check, and fresh resolution after permission changes. No invented latency numbers or zero-database-call claim.
4. **Protect and record:** encrypt/decrypt a fictional value with actual browser AES-GCM and record an example approval with actor, timestamp and before/after status.
5. **Find information:** exact matching, typo-tolerant edit distance, a curated semantic example and cosine similarity over hand-authored topic vectors. These are labelled local illustrations; no live Azure AI Search or embedding model is called.

The prototype uses the owner’s full-bleed backgrounds, liquid displacement, colour breathing, bloom, parallax and dark overlay. Authored sprite objects now have visible descriptive names and purpose labels. Every action has a plain-language outcome. There is no automatic chapter progression. Tilt changes the view, not access rights.

## Files

- `gyroscope-world.js`: narrative, local demonstrations, explanation topics and controls.
- `gyroscope-renderer.js`: artwork, spatial assembly, labelled object positioning, request travel and atmosphere.
- `gyroscope-world.css`: responsive overlays and object labels.
- `gyroscope-chamber.html`: current entry page.

Earlier `gyroscope-chamber.js` / `.css` are the superseded scanner slice and are no longer loaded by this page.

Source content: landscape Security and Search chapters in `story-data.js`, the owner’s architecture description, `SetSessionContextInterceptor.cs`, `UserSiteAccessInterceptor.cs`, and SQL predicate references in the Safety repository. All interactive records are fictional. No production application files are changed.

Static output: `node scripts/content-index.cjs --build`.

No automated tests or browser/gameplay QA were run, as requested by the owner. This implementation awaits the owner’s visual and interaction review.
