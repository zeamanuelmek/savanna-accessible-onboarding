# Development progress — Savanna Accessible Onboarding Module

Digital Bridge Accessibility Hackathon 2026, Track 1. Phases are defined in `CLAUDE.md` §6.
Status labels used throughout: **implemented** · **partial** · **simulated** · **unavailable**.

---

## Phase 0 — Audit and plan ✅ (12 Nov 2026)

No feature code was written. The Savanna reference files were not changed.

### What changed

| File | What it is |
|---|---|
| `DEVELOPMENT_PROGRESS.md` | This file |
| `CLAUDE.md` | Project instructions (first commit of it) |
| `savanna-onboarding/` | The prototype, committed as-is for the first time (no edits to its code) |
| `savanna-onboarding/package.json`, `package-lock.json`, `.gitignore` | Test tooling only |
| `savanna-onboarding/playwright.config.mjs` | Runs every test on a small Android phone (Pixel 5) and a desktop |
| `savanna-onboarding/tests/static-server.mjs` | Tiny local web server for tests (no dependencies) |
| `savanna-onboarding/tests/helpers.mjs` | Shared test steps (clean device, walk the sign-up form, run axe) |
| `savanna-onboarding/tests/a11y.spec.mjs` | axe-core scan of 21 learner screens in English and Amharic |
| `savanna-onboarding/tests/smoke.spec.mjs` | 18 checks that the features the prototype claims really work |
| `savanna-onboarding/tests/known-issues.spec.mjs` | 8 known bugs written as tests that are *expected to fail* until fixed |
| `savanna-onboarding/tests/reference-audit.spec.mjs` | Measures fonts and colours the Savanna reference pages really render |
| `savanna-onboarding/tests/baseline/reference-audit.json` | Output of that measurement (evidence for Phase 1) |

### How to run the tests

```bash
cd savanna-onboarding
npm install
npx playwright install chromium   # first time only
npx playwright test --workers=1 --project=mobile    # phone, ~3 min (memory-light; recommended on this laptop)
npx playwright test --workers=1 --project=desktop   # desktop, ~3 min
npm test                          # everything with 2 workers (~7 min, needs more memory)
npx playwright test --project=desktop tests/smoke.spec.mjs   # a quicker subset
npm run test:report               # open the HTML report
```

Tracing is off by default because it made every test ~4× slower on Windows. Add `--trace=on` when debugging.

### Baseline test results (12 Nov 2026, Chromium 158, Windows 11)

**142 tests: 139 passed, 3 skipped (reference audit runs on desktop only, by design), 0 unexpected failures.**

| Suite | Result |
|---|---|
| axe-core, WCAG 2.0/2.1/2.2 A + AA + best practice, 21 screens × 2 languages × 2 devices = 84 scans | **0 violations of any severity** |
| Smoke tests (18 × 2 devices) | all pass |
| Known issues (8 × 2 devices) | all fail as expected, each for the right reason (checked) |
| No horizontal scroll at 320 px wide (home, sign-up, jobs, settings) | pass |

axe finds roughly a third of real accessibility problems. A clean axe run is **not** evidence of WCAG
conformance; screen-reader (NVDA, TalkBack), keyboard and zoom testing are still needed (Phase 9).

Screens scanned: home · welcome (and its error) · choice question · text question with error · ID choice ·
Ethiopian date (and its error) · consent · check answers · done · finish later · help open · Support
Passport · jobs · employer · apply · settings · developers page · high contrast · extra-large text.

---

### Audit: what works (verified by a test unless marked)

| Feature | Status | Evidence |
|---|---|---|
| One question per screen, question is the only `<h1>`, focus moves to it | implemented | smoke |
| Progress text "Question n of N" + bar | implemented | smoke (bar is hidden from screen readers; text is read) |
| Error summary, focused, links to the field; `aria-invalid` + `aria-describedby` | implemented | smoke |
| Phone validation (10 digits, accepts +251) | implemented | smoke |
| Ethiopian calendar date with Gregorian conversion (1 Meskerem 2017 → 11 Sep 2024) | implemented | smoke |
| `showIf` branching (partner route, ID routes) | implemented | smoke |
| Autosave after every question + "welcome back" on reload | implemented | smoke |
| Check your answers with change-and-return | implemented | smoke |
| Back link keeps answers | implemented | smoke |
| "Finish later" resume link + SMS preview | **simulated** | The preview is labelled "In the live version…". The `?resume=CODE` link does nothing special — the draft only comes back because it is stored on the same phone (`dimts.js:806`). |
| Settings: language, text size, contrast, answer mode, read-aloud; applied page-wide | implemented | smoke |
| Amharic / English switch | implemented | smoke. Amharic is an AI **draft**, not reviewed by a native speaker. |
| Voice consent screen before the microphone | implemented | smoke |
| Voice answers (Web Speech API, am-ET / en-US) | partial | Not testable automatically with a real mic. Works only in Chrome-based browsers; sends audio to Google. Amharic recognition quality untested. |
| Read-aloud (speechSynthesis, optional recorded clip) | partial | Not tested. Most phones have no Amharic voice; the module then says so. No recorded clips exist yet. |
| Jobs filter on the device from the Support Passport | implemented | smoke |
| schema.org JobPosting output | implemented | not tested beyond display |
| Sign-up creates a profile and fires `dimts:complete` | implemented | smoke |
| Draft deleted after submit | implemented | smoke |
| 320 px reflow | implemented | smoke (4 routes) |

### Audit: what is broken (each has a failing test in `known-issues.spec.mjs`)

| # | Problem | Where | Fix in |
|---|---|---|---|
| 1 | **Privacy:** after speech recognition the transcript is written into the answer **and saved to the draft before the learner confirms** | `dimts.js:735` (`this.collect(); this.save();` in `handleTranscript`) | Phase 3 |
| 2 | **Privacy:** "Say it again" / "Type it instead" leave the unconfirmed transcript in the field and draft | `dimts.js:667-668` | Phase 3 |
| 3 | **Privacy:** answers from a route the learner abandoned stay in the saved draft (e.g. switch from Fayda to "no ID" and the Fayda number is still stored). They are only removed at final submit. | `dimts.js:390` saves all answers | Phase 2 |
| 4 | Two forms on one page clash: fixed element ids (`dm-input`, `dm-help`, `dm-err`, `dm-hint`, `dm-heard`) — 5 duplicate ids. Blocks a safe `mount()` API. | `dimts.js` render functions | Phase 2 (needed by Phase 8) |
| 5 | Old name "Dimts / ድምፅ" in page title, header, hero, footer, docs | `index.html`, `app.js`, `README.md`, `dimts.js` | Phase 1 |
| 6 | "For developers" page is in the learner menu | `app.js:95`, `index.html` template | Phase 1 |
| 7 | No microphone on the date question | `dimts.js:472` | Phase 3 |
| 8 | Profile, Support Passport, applications and drafts (incl. ID numbers) are plain text in localStorage | `app.js:152, 176, 236`, `dimts.js:390` | Decide in Phase 6 |

Other problems found by reading the code (no test yet):

- Voice consent is stored forever (`dimts.voiceConsent`) and cannot be withdrawn in Settings.
- A recorded audio clip that fails to play fails silently — no fallback to the device voice (`dimts.js:179`, the `play()` promise is not handled).
- Easy mode re-reads every screen automatically; there is no pause/stop control (Phase 4).
- "Read aloud" and "big picture mode" are one setting (`easy`); they should be separate.
- Sizes use `rem`. **Savanna sets the root font size to 14 px** (`application_alx.css:103`), so inside Savanna the module's text would shrink by 12.5%. Must be handled in Phase 1.
- The prototype names "Noto Sans Ethiopic" in its font list but never loads it — Amharic relies on whatever font the phone has.
- Trust level ("assurance level") is worked out by the demo host (`app.js:151`), not the module, and is only shown after submit — no badge on each ID choice.
- Partner-assisted sign-up has no "learner takes over" step; the partner staff name is stored in the learner's profile.
- The Support Passport "sharing" choice is stored but nothing enforces or revokes it except "delete".
- Saved draft stores `mode` but it is never restored (minor).
- Question count changes as branches open ("Question 3 of 9" → "of 10") — acceptable but could confuse; consider "about N questions".

### Gaps against CLAUDE.md requirements

| Requirement | Today |
|---|---|
| Name "Savanna Accessible Onboarding Module" everywhere user-facing | missing (Phase 1) |
| Savanna branding (real tokens) | missing — green theme is not Savanna (Phase 1) |
| `SavannaOnboarding.mount(selector, options)` / `unmount()` | missing (Phase 8; groundwork in Phase 2) |
| Engine separated into config / state / presentation / services | partial — one 819-line file (Phase 2) |
| Profile-update journey | missing (Phase 2) |
| Speech as a state machine with editable transcript, discard, error states | missing (Phase 3) |
| Play button per option, pause/replay/stop | missing (Phase 4) |
| Audio adapter for reviewed Amharic recordings | partial — `audio` per question only, no adapter (Phase 4) |
| ID trust badges, revocable support consent, learner takeover | missing (Phase 5) |
| Storage behind an adapter; minimise stored data | partial — one `store` helper, plain localStorage (Phase 6) |
| Separate test host page; developer docs out of learner UI | missing (Phases 1 and 8) |
| Automated tests in the repo | **done in Phase 0** |
| `DESIGN_TOKENS.md`, `ACCESSIBILITY_CONFORMANCE.md` | not yet (Phases 1 and 9) |

---

### Savanna reference audit (fonts and colours) — no styling changed yet

Source: the reference clone of `alx-africa/Savanna-static-pages` (now kept next to this repo at `../Savanna-static-pages`). Values below come from its CSS
and from measuring the three frozen pages in Chromium (`savanna-onboarding/tests/baseline/reference-audit.json`).
The learner pages use the **ALX theme** (`<body data-theme-suffix="_alx">`).

**Fonts**

| Font | Where it comes from | Used for | Loads on localhost? | Licence / can we use it? |
|---|---|---|---|---|
| **Poppins** 300–700 | Google Fonts, **self-hosted** in `assets/fonts/pxi*.woff2`, declared in `assets/css/google-fonts-poppins.css`, imported at `application_alx.css:29`, set as `--bs-font-sans-serif` at `application_alx.css:100` | All learner-page text (body, headings, buttons) | **Yes** — all requests 200, from local files | SIL Open Font Licence: free to self-host. **Use this.** |
| DM Sans | Google Fonts, self-hosted (`google-fonts-dm-sans.css`, imported at `application_alx.css:30`) | FIT theme only (`.savanna-styles-FIT`, `fit.scss`) | yes | OFL. Not needed for ALX. |
| Lexend | Google Fonts, self-hosted (`google-fonts-lexend.css`, imported at `application_alx.css:31`) | SET theme only (`.savanna-styles-SET`, `set.scss`) | yes | OFL. Not needed for ALX. |
| Aktiv Grotesk 400/500/700/800 | **Adobe Typekit** kit `xgz4ilr` (`assets/css/typekit-xgz4ilr-css.css`), linked in every page `<head>` | **Nothing.** No CSS rule uses it; only an unused `.tk-aktiv-grotesk` class. The browser never downloads it; `document.fonts.check('aktiv-grotesk')` = false. | Not requested at all | Adobe licence, locked to ALX domains. Local copies exist in `assets/fonts/typekit-*` but we must **not** redistribute them. Not needed. |
| Font Awesome 6 | self-hosted `assets/fonts/fa-*` | icons | yes | Free licence; we will use text + SVG icons instead (icon-only buttons are banned). |
| Ethiopic | **none in Savanna** | — | — | Phase 1: add **Noto Sans Ethiopic** (OFL, Google Fonts), self-hosted, as a fallback after Poppins (Poppins has no Ethiopic letters). |

Vercel check (does it load on the live demo?) is still to do in Phase 1 — Poppins is self-hosted, so it should.

**Colours — learner shell (what learners see around the content)**

| Token | Value | Source | Contrast on white | Note |
|---|---|---|---|---|
| Theme primary (buttons, links, active menu, some headings) | `#db3e3e` | `application_alx.css:58` (`--bs-primary`), `:123` (link), `:40563` (`--savanna-theme-primary`) | **4.40:1 — fails AA for normal text** | Passes for large text and UI outlines (3:1). Savanna's 14 px white-on-red buttons fail. Accessible variant for small text needed, e.g. `#d43a3a` (4.70) or `#c53030` (5.47). Decide in Phase 1. |
| Body text | `#212529` | `application_alx.css:108` | 15.43 | |
| Secondary text | `rgba(33,37,41,.75)` | `application_alx.css:114` | ≈6.7 | |
| Body / header background | `#ffffff` | `:110`, `:40567` | — | |
| Header border | `#e5e6e6` | `:40568` | 1.25 | decorative only |
| Hamburger icon | `#98a3ae` | `:40569` | 2.57 — fails 3:1 | do not copy for icons |
| Form error | `#dc3545` | `:151` | 4.53 | passes, just |
| Form success | `#198754` | `:149` | 4.53 | |
| Focus ring | `0.25rem rgba(219,62,62,.25)` | `:146-148` | far below 3:1 | **too faint** — keep our own strong focus style |

**Colours — Savanna content palette (`.savanna-styles`, `alx.scss`, `application_alx.css:31640-31661`)**

| Token | Value | Contrast on white | Note |
|---|---|---|---|
| `--savanna-alx-primary` (navy, main text in concept pages) | `#002b56` | 14.19 | strong candidate for module text and primary button |
| `--savanna-alx-secondary` (bright green) | `#05f283` | **1.50** | never as text or border on white; fine as a fill **with navy text (9.48)** |
| `--savanna-alx-tertiary` (blue links) | `#028eca` | **3.67 — fails for text** | accessible variant e.g. `#0277a8` (4.99) |
| `--savanna-alx-accent` (purple) | `#5648b7` | 6.99 | passes |
| `--savanna-alx-light-background` | `#e7e9ec` | navy on it 11.67 | |
| `--savanna-alx-primary-hover` | `#335578` | 7.75 | |

**Type scale, shape, layout** (measured): root font size **14 px** (`application_alx.css:103`, Bootstrap 5.3.3
custom). Sizes seen: 14, 17.5, 21, 24.5, 28, 35 px (= 1, 1.25, 1.5, 1.75, 2, 2.5 rem). Weights 400/500/600/700.
Radii: buttons 0.375 rem (5.25 px), large 0.5 rem (7 px), cards **15 px**, pills 50 rem. Breakpoints 576 / 768 /
992 / 1200 / 1400 px (`:942-947`). Buttons are ~33 px tall — **below our 44–48 px touch-target minimum**, so the
module keeps larger controls while using Savanna's colours, font and radii.

---

### Proposed folder structure

Today everything lives in `dimts/`, inside a clone of the reference repo. Proposal (module folder renamed in
Phase 1 — **needs a decision, see below**):

```
savanna-onboarding/                  ← today: dimts/
├─ src/
│  ├─ index.js                       public API: SavannaOnboarding.mount / unmount / register, events
│  ├─ core/                          form engine
│  │  ├─ state.js                    one shared answer state (typing, speaking, tapping), draft, showIf, pruning
│  │  ├─ engine.js                   navigation, validation, review, finish
│  │  └─ registry.js                 journey registration
│  ├─ ui/                            presentation only
│  │  ├─ form-element.js             <savanna-onboarding-form> web component
│  │  ├─ settings-element.js         <savanna-onboarding-settings>
│  │  ├─ fields/                     text, tel, email, textarea, choice, multi, consent, ethdate
│  │  └─ styles.css                  scoped styles built from design tokens (so-* prefix)
│  ├─ services/                      replaceable adapters
│  │  ├─ speech-input/               state machine + web-speech adapter (Addis AI etc. later)
│  │  ├─ audio/                      read-aloud: recorded-clip adapter, speechSynthesis adapter
│  │  ├─ storage/                    localStorage adapter now; IndexedDB / encrypted later
│  │  └─ host/                       host integration + API adapter (events only until a real contract)
│  ├─ domain/                        identity routes + trust badges, support vocabulary, Ethiopian calendar
│  ├─ journeys/                      signup, profile-update, support, apply, employer (plain config)
│  └─ i18n/                          en.js, am.js (am = draft until native review)
├─ assets/fonts/                     Poppins + Noto Sans Ethiopic (OFL, self-hosted)
├─ demo/                             learner demo site (today's index.html, app.js, app.css)
├─ examples/test-host/               plain page proving it works outside the demo (Phase 8)
├─ docs/                             integration guide + the "For developers" content
├─ dist/savanna-onboarding.js        one-file script-tag build (Phase 8, esbuild)
└─ tests/
```

Until Phase 8 the demo loads `src/` directly as native ES modules — **no build step** is needed to develop.

### Step-by-step plan for Phases 1–3

**Phase 1 — Brand, design system, rename**
1. Write `DESIGN_TOKENS.md` from the audit above (value · source line · contrast result).
2. Create `src/ui/tokens.css`: CSS custom properties with an `--so-` prefix (Savanna onboarding), e.g.
   `--so-color-text: #002b56`, `--so-color-primary`, `--so-radius-card: 15px`, focus, error, selected, disabled.
   Accessible variants where a brand colour fails (red for small text, tertiary blue for links).
3. Base size: set the module's own size in a way that does not shrink under Savanna's 14 px root (e.g. module
   root `font-size: max(1rem, 16px)` and `em` inside), and still follows the learner's text-size setting.
4. Self-host Poppins (copy the OFL files) + Noto Sans Ethiopic; font stack `Poppins, "Noto Sans Ethiopic", system-ui, sans-serif`. Test Amharic rendering.
5. Restyle engine CSS and demo CSS to the tokens; keep 44–48 px targets and the strong focus style. High-contrast mode kept.
6. Rename all user-facing text to "Savanna Accessible Onboarding Module" (title, header, hero, footer, README, docs, `<meta>`). Keep `<dimts-form>` working as a deprecated alias so nothing breaks; new tag name decided with the team.
7. Move "For developers" out of the learner menu into `docs/` (and later the test host page).
8. Tests: remove `test.fail` from the "Dimts" and "developers" known issues; add 200 %-zoom and 320 px checks for every screen; add a contrast test of tokens; keep axe at zero critical/serious. Check fonts on Vercel.

**Phase 2 — Form engine tidy-up**
1. Split `dimts.js` into the `core/`, `ui/`, `domain/`, `i18n/` files above, with **no behaviour change** (all tests stay green after each move).
2. Unique ids per form instance (fixes known issue #4).
3. Prune answers of hidden questions from the saved draft (fixes #3).
4. Storage behind a small adapter (still localStorage) so Phase 6 can swap it.
5. Add the **profile-update** journey (prefilled from profile, change-and-save, check answers).
6. Confirm at least two journeys (sign-up, profile-update, plus existing ones) run on the same engine; add smoke tests for each.
7. Review progress announcements, error association for grouped fields (date: mark only the wrong part invalid), answer retention on back/change/language switch.

**Phase 3 — Answer input system (speak, type, tap)**
1. Speech state machine in `services/speech-input/`: idle → permission → listening → processing → transcript ready → review/edit (editable text box) → confirmed; plus error/retry and discard. Unit-tested without a browser mic (fake recogniser, as in today's tests).
2. **Never save unreviewed speech**: the answer state changes only on "Use this answer" (fixes #1, #2).
3. Ask for the microphone only after the learner taps the voice button; clear "Microphone on" status with a stop button; handle permission denied, unsupported browser, no speech, network error — each with a plain message and a type/tap fallback.
4. Explain that browser speech may send audio to an online service (Google), before first use; consent can be withdrawn in Settings.
5. Microphone on the date question (speak "12 Meskerem 1990" → parsed into day/month/year, shown for review) — or document why not if parsing proves unreliable.
6. Tests for every state and error path; remove the matching `test.fail` lines.

### Dependencies

Added in Phase 0 (dev only — nothing is shipped to learners):

| Package | Version | Why |
|---|---|---|
| `@playwright/test` | 1.65.0 | Test runner that drives a real browser (phone and desktop sizes). Also runs plain unit tests, so no separate unit-test tool is needed. |
| `@axe-core/playwright` | 4.14.0 | Runs the axe-core accessibility rules on each screen. |

Planned, only when the phase needs it:

| Package | When | Why |
|---|---|---|
| `esbuild` | Phase 8 | Bundle `src/` into one `savanna-onboarding.js` for the script-tag install. |
| Noto Sans Ethiopic font files | Phase 1 | Amharic text; files, not an npm package. |
| `idb` | Phase 6, only if IndexedDB drafts happen | Small, safe IndexedDB wrapper. |
| Lucide icons (copied SVGs) | Phase 4, optional | Clear icons always paired with text. Copied as files, not installed. |

Not planned: Vitest (Playwright covers unit tests), ESLint a11y plugins (they target JSX/React, which we don't use), React.

### Risks and ALX-dependent assumptions

- ~~**This repo is a clone of `alx-africa/Savanna-static-pages`** (git remote points there). Our module is committed on its `main` branch. Pushing would target ALX's repo. Recommend a separate repo for the module (see decisions).~~ Resolved in Phase 0.5: own repo.
- The official ALX starter and integration contract arrive at kickoff (14 Nov). Until then: no REST endpoints, Level 1 script tag only.
- Savanna's 14 px root font size and Bootstrap 5.3.3 globals will affect an embedded module — scoped styles must survive them (tested in Phase 8 by mounting inside a reference page copy).
- The 35-feature ALX checklist has not been provided — not mapped, not invented.
- Web Speech API: Chrome-only in practice; sends audio to Google; Amharic (`am-ET`) recognition quality unknown. Speech synthesis: most phones have no Amharic voice → recorded audio needed.
- Amharic text is an AI draft — needs a native speaker before learner testing.
- Vercel project `dimts-track1` deploys from somewhere unknown to this audit (CLI or another repo). Renaming the folder may affect it — will ask before touching it.
- Windows test machine: Chromium takes ~20 s to shut down; full suite ~7 min.

### Decisions needed from the team before Phase 1 (all answered — see Phase 0.5)

1. **Where should the module live?** (a) keep committing inside this clone of the reference repo (simplest, but never push), or (b) create a new repo for the module and keep the reference beside it, read-only. Recommended: **(b)**.
2. **Folder / tag names:** OK to rename `dimts/` → `savanna-onboarding/` and `<dimts-form>` → `<savanna-onboarding-form>` (keeping the old tag as an alias)? This may affect the Vercel deploy settings.
3. **Primary colour for the module:** Savanna learner-shell red `#db3e3e` (needs a darker variant for small text) **or** Savanna content navy `#002b56` with green `#05f283` accents (passes contrast as-is, calmer, matches the concept pages). Recommended: navy primary, red only where it must match the shell.

### Next step

Done — see Phase 0.5.

---

## Phase 0.5 — Own repository + accessibility definition of done ✅ (12 Nov 2026)

### Team decisions recorded (also in `CLAUDE.md` §2)

- Own repo: https://github.com/zeamanuelmek/savanna-accessible-onboarding (public).
- Folder `savanna-onboarding/`; element `<savanna-onboarding-form>` with `<dimts-form>` kept as an alias (code rename happens in Phase 1).
- Colour: primary actions = Savanna red darkened just enough for 4.5:1; headings and text = navy `#002b56`; green only for success states, never text; focus outline ≥ 3:1.
- Module sets its own base text size (no shrinking in Savanna's 14 px pages) and follows the learner's text-size setting.
- Accessibility definition of done (ALX training, 12 Nov) added as `CLAUDE.md` §8. WCAG 2.2 AA is the bar for every phase.

### What changed

| Change | Detail |
|---|---|
| New repo folder | `Desktop/savanna-accessible-onboarding/`, created with `git format-patch` + `git am`, so the Phase 0 commit keeps its author, date and message |
| `dimts/` → `savanna-onboarding/` | `git mv` (history follows the files) |
| `tests/static-server.mjs` | Serves the module at `/` and the reference clone, read only, at `/reference/` (from `../Savanna-static-pages`, or `REFERENCE_DIR`) |
| `tests/helpers.mjs`, `playwright.config.mjs` | Demo is now `/index.html` |
| `tests/reference-audit.spec.mjs` | Reads `/reference/pages/…`; skips cleanly if the reference clone is missing |
| `savanna-onboarding/.vercelignore` | Keeps tests and reports out of the Vercel deploy |
| `CLAUDE.md` | Decisions 4–7, Phase 0.5, new §8 accessibility definition of done, Vercel root directory, sections renumbered (8→9, 9→10) |

### Clean-up (approved by the team, 12 Nov)

- **Reference folder reset.** `Desktop/Savanna-static-pages` was reset to ALX's `origin/main` (`9e83ac7`, which is
  also what GitHub has today). The leftovers were deleted: `CLAUDE.md`, `DEVELOPMENT_PROGRESS.md` and the old `dimts/` folder with its
  `node_modules`. Nothing else was changed. `git status` is clean and the folder matches ALX's repo exactly.
  To delete the empty `dimts/` folder I had to stop two processes I had left running during Phase 0 (a test web server
  and the shell that started it). They were stopped by their exact process ids, and nothing else was touched.
- **History rewritten.** The first push of Phase 0.5 included `node_modules/` and partial `test-results/` because the
  `.gitignore` didn't come across in the move. Every commit was rewritten without them (`git filter-branch`),
  keeping commit messages, authors and dates, and force-pushed to `main`. The final files are identical to before. The
  local repo was garbage-collected (71 KB). Local `main` = remote `main` = `5b57cc0`; `git status` is clean.
- The GitHub repo is now **private** (team change).

### Vercel

Connected by the team: Root Directory **`savanna-onboarding`** · Framework Preset: Other · no build command.
Remember to hard-refresh the live demo after a deploy.

### Tests (re-run in the new location, memory-light: `npx playwright test --workers=1`, one project at a time)

| Run | Passed | Skipped | Unexpected failures | Time |
|---|---|---|---|---|
| Mobile (Pixel 5) | 68 | 3 (reference audit is desktop-only, by design) | 0 | 2.8 min |
| Desktop | 71 | 0 | 0 | 2.7 min |
| **Total** | **139** | **3** | **0** | — |

- **Matches the Phase 0 baseline exactly** (139 passed, 3 skipped).
- The **8 known-bug tests** still fail as expected on both devices, counted as "passed" because they are marked
  `test.fail()`: unconfirmed speech saved; "Say it again" keeps the old transcript; "Dimts" visible; developer page in
  the learner menu; no mic on the date question; duplicate ids with two forms; abandoned-route answers kept in the draft; profile
  stored as plain text.
- axe-core: 84 scans (42 per device), **0 violations of any severity**.
- Reference audit re-measured from `../Savanna-static-pages`: fonts, colours, sizes and radii are identical to Phase 0.
  Only the timestamp, the `/reference/` URL prefix and the order of font requests changed.
- One worker is now the recommended way to run on this laptop: about 5.5 min in total, versus about 7 min with 2 workers, and it doesn't run out of memory.

### Prototype vs the new definition of done (found by reading the code; to fix in the phases shown)

| Rule | Today | Phase |
|---|---|---|
| Language of parts | Static footer and sample jobs are English inside an Amharic page without `lang="en"`; skip link mixes both languages in one string | 1 |
| Result count announced on load (jobs) | Only announced after the filter changes, not on load | 7 (small fix may come earlier) |
| WebView fallback | No recogniser → clear message (good). If speech synthesis exists but the device has **no voices at all** (common in WebViews), English read-aloud stays silent with no message | 3 / 4 |
| Pop-ups | Help and voice consent are inline panels (allowed). No `<dialog>` in use | — |
| Second `<main>` | Module adds none (good). Demo host has one | — |
| Consistent help (3.2.6) | Help button is in the same top bar on every question (good); missing on the done screen | 1 / 2 |
| Redundant entry (3.3.7) | Apply prefills name and phone (good); profile-update journey must do the same | 2 |
| Keyboard / NVDA / TalkBack-in-WebView | Not yet run by a person | to do by the team, each phase |
| README keyboard and ARIA section | Missing | 1 (with the README rename) |

### Next step

Done — see Phase 1.

---

## Phase 1 — Brand, design system and rename ✅ (12 Nov 2026)

### What changed

| File | Change |
|---|---|
| `savanna-onboarding/dimts.js` → `savanna-onboarding.js` | Renamed file. New element names `<savanna-onboarding-form>` and `<savanna-onboarding-settings>`; `<dimts-form>` and `<dimts-settings>` stay as aliases. Global `window.SavannaOnboarding` (alias `window.Dimts`). Events `savanna-onboarding:complete / :prefs / :ready` (the old `dimts:*` events are still sent). New design tokens (`--so-*`), self-hosted fonts, all styles rebuilt on the tokens. Done screen keeps the help bar (3.2.6) and shows a success panel. An error on screen is re-worded when the language changes. Long links wrap at 400% zoom |
| `savanna-onboarding/assets/fonts/` | Poppins 400–700 (8 files, copied from the reference) + Noto Sans Ethiopic (Google Fonts) + both OFL licence files |
| `savanna-onboarding/app.css` | Rewritten on the tokens: Savanna-style white header, navy text, red primary buttons, 15px cards, callouts with an accent bar. The header wraps at 320px |
| `savanna-onboarding/index.html` | New title, description, theme colour, favicon and "Savanna · Accessible onboarding" brand. Skip link with separate `lang` parts. Translatable footer. Developer page template removed |
| `savanna-onboarding/app.js` | "Dimts" removed from all text. Developer page removed from the menu and the routes. Brand subtitle, footer and page titles translated. English sample jobs marked `lang="en"` on Amharic pages. The job count is announced on load as well as after filtering |
| `savanna-onboarding/forms.js` | Uses `window.SavannaOnboarding` |
| `savanna-onboarding/docs/for-developers.md` | New: the former "For developers" page, updated to the new names, with a table of old names |
| `savanna-onboarding/README.md` | Rewritten: name, real-vs-simulated table, install, **keyboard and ARIA support**, tests |
| `DESIGN_TOKENS.md` | New: every token with its value, Savanna source line, use and contrast result |
| `tests/a11y.spec.mjs` | Now also checks on every screen: one `<main>`, one `<h1>`, no skipped heading levels, only real buttons, language of parts, and no sideways scroll at 320px (400% zoom) |
| `tests/design.spec.mjs` | New: contrast of 19 token pairs in normal and high contrast; green never used for text; primary button colours; focus outline ≥ 3:1 on every Tab stop; base text size 16/20/24px inside a 14px host page; fonts load (HTTP 200) and apply |
| `tests/keyboard.spec.mjs` | New: full sign-up with the keyboard only (every stop has a focus outline and is fully on screen, 2.4.11); skip link; mobile menu with `Escape` |
| `tests/smoke.spec.mjs` | New events; new test that the old names still work |
| `tests/known-issues.spec.mjs` | "Dimts visible" and "developer page in the menu" are fixed, so they are now normal tests |

### Decisions applied (CLAUDE.md §2)

- **Primary red:** `#da3a3a`, which is Savanna `#db3e3e` darkened by 1 point of lightness — the smallest step that
  reaches 4.5:1 with white (4.52). Hover `#bf2424` (6.01).
- **Navy `#002b56`** for all headings and text. Muted text `#335578` (Savanna's primary-hover).
- **Green** `#05f283` only as the bar on success panels (with a light green background and navy text); a test checks
  it is never used for text.
- **Focus outline:** 3px solid navy with a 2px offset: 14.19:1 on white, 11.67:1 on light panels.
- **Base text size:** `max(1rem, 16px) × learner scale` (1 / 1.25 / 1.5). That gives 16 / 20 / 24px, even inside
  Savanna's 14px root. A larger browser default (e.g. 20px) is respected.

### Tests (one worker, as agreed)

| Run | Passed | Skipped (by design) | Unexpected failures | Time |
|---|---|---|---|---|
| Phone (Pixel 5) | 75 | 5 (token maths and reference audit run on desktop only) | 0 | 2.7 min |
| Desktop | 79 | 1 (the mobile menu test runs on phone only) | 0 | 2.9 min |
| **Total** | **154** | **6** | **0** | |

- Up from 139 at the Phase 0 baseline: new design, keyboard and alias tests were added, and the "developers page"
  screen was removed.
- **axe-core: 80 scans, 0 violations of any severity.**
- The 6 remaining known bugs fail as expected on both devices. Two known bugs ("Dimts" visible, developer page in
  the menu) are fixed and are now normal tests.
- **Problems the new tests found and I fixed this phase:**
  - Primary button text was navy instead of white (a general style rule overrode it; found from screenshots).
  - The header overflowed by 10px at 320px.
  - The resume link on "Finish later" overflowed by 22px at 320px. This existed before Phase 1; it was found by the
    new per-screen 400% zoom check.
  - An error message stayed in the old language after a language change.
  - English sample-job titles were not marked `lang="en"` on Amharic pages.

### Section 8 routine — automated parts

| Step | Result |
|---|---|
| 1. Keyboard only | **Automated, pass:** full sign-up with Tab/Space/Enter; every Tab stop has a visible 3px outline with ≥ 3:1 contrast and is fully on screen; skip link works; menu closes with `Escape` and returns focus |
| 2. NVDA | **Manual — to do by the team** (checklist below) |
| 3. TalkBack in an Android WebView | **Manual — to do by the team** (checklist below) |
| 4. 400% zoom (320px), no sideways scrolling | **Automated, pass** on all 20 screens × 2 languages. This found a real problem (the long resume link on "Finish later"), now fixed |
| 5. axe-core, zero serious/critical | **Automated, pass:** 80 scans (20 screens × 2 languages × 2 devices) |
| Rules: one `<main>`, headings in order, real buttons, language of parts | **Automated, pass** on every screen |
| Rule: errors linked with `aria-describedby`, focus to the summary | Automated in the smoke tests, pass |

### Manual checks for the team (not yet done — please record results here)

**NVDA (Windows, Chrome or Firefox), on https://savanna-accessible-onboarding.vercel.app** (updated 14 Nov; the old dimts-track1 site shows the old version)

1. Home page: press `H` repeatedly. Expect: one heading level 1 "Sign up, say what helps you…", then "What you can
   try" (level 2), then the four card titles (level 3).
2. Press `D`. Expect landmarks: banner, navigation "Main", main, content info (footer). Only one main.
3. Join → choose "Read and type" → Continue. Expect NVDA to read the question "Who is filling in this form?" as the
   heading, then the group name. Press `F` to move through form fields; each option is read as a radio button with
   its label.
4. On "What is your full name?", press Continue with the box empty. Expect "There is a problem" to be read, then
   the error link. Activate the link: focus goes to the box, and NVDA reads the label, the error and the hint.
5. Switch to Amharic (አማርኛ button). Expect NVDA to switch voice for Amharic text and back for English names (if
   an Amharic voice is installed; if not, note what happens).
6. Settings: change text size and contrast. Expect each choice to be read as a radio button, then "Saved…" to be
   announced.
7. Jobs: expect "4 jobs shown" to be announced when the page opens. Turn the filter on (after making a Support
   Passport) and expect the new count to be announced. Each job title is a heading (`H`).

**TalkBack inside an Android WebView**

1. Send the demo link to yourself in Telegram, then open it inside Telegram (not in Chrome).
2. Swipe through the home page. Expect the brand, the menu button ("Menu, collapsed"), the heading and the buttons, each
   with a clear name. Double-tap Menu: it should say "expanded".
3. Complete sign-up by swiping and double-tapping. Expect each question to be read first, options as radio buttons,
   and the error summary read when a question is skipped.
4. Tap "Answer by voice". Inside a WebView, voice input is probably **not available**. Expect a clear message
   ("Voice answers are not available in this browser…"), and typing or tapping still works. Write down exactly what
   happens.
5. Tap "Listen to the question". Note whether anything is spoken. If nothing happens and no message appears, record
   it (known gap, planned for Phases 3/4).
6. Turn on Settings → Extra large text. Check that nothing is cut off and that there is no sideways scrolling.

**Also by hand:** Chrome zoom at 200% and 400% on a laptop (`Ctrl` `+`), and Windows high-contrast mode.

### Vercel check (after pushing `ac6fc1e`) — needs a team fix

- **Fonts on Vercel: pass.** On `https://savanna-accessible-onboarding.vercel.app/savanna-onboarding/index.html`,
  Chromium loaded Poppins (400/500/600/700) and Noto Sans Ethiopic from our own files (all HTTP 200, `font/woff2`).
  Amharic headings render with Poppins plus Noto Sans Ethiopic.
- **The GitHub repo is connected to two new Vercel projects**, `savanna-accessible-onboarding` and
  `savanna-accessible-onboarding-7fbn`. It is **not** connected to the old `dimts-track1` project, so
  `https://dimts-track1.vercel.app` still shows the old "Dimts" upload from 11 Nov.
- **Root Directory is not applied** in either new project. The build log says `entrypoint: "."`, so the repo root is
  published:
  - the demo only works under `/savanna-onboarding/` (the site root returns 404);
  - `CLAUDE.md` and `DEVELOPMENT_PROGRESS.md` are publicly readable;
  - `.vercelignore` is not used (it sits in `savanna-onboarding/`), so `tests/` is public too.
  - None of this is secret, but it is internal.
- I changed **nothing** on Vercel (`CLAUDE.md` §10: ask first).

### Real vs simulated after Phase 1

Unchanged from Phase 0, except: Savanna branding is now **implemented** (tokens taken from the reference; it is
not the official ALX design system, which we have not been given). Fonts are self-hosted, so they do not depend on
Typekit or Google at run time.

### Known issues still open

- The 6 remaining known-bug tests: unconfirmed speech saved; "Say it again" keeps the transcript; no mic on the
  date question; duplicate ids with two forms; abandoned-route answers kept in the draft; profile in plain text.
- Browser storage keys still start with `dimts.` (internal, not shown to learners). They move to the storage adapter
  in Phase 2.
- The `data-dm-size` / `data-dm-contrast` attributes on `<html>` and the `dm-` class prefix keep their old short
  names (internal).
- The error summary and help panel (both `h2`) come before the question `h1` in reading order. This follows the
  common GOV.UK pattern, and no heading level is skipped.
- Read-aloud with no voices installed (common in WebViews) is still silent with no message (Phases 3/4).

### Next step

Done — see "Official deliverables and judging" below. Phase 2 has not started.

---

## Official hackathon deliverables and judging (recorded 13 Nov 2026)

Source: the official site, digitalbridge.et, as given by the team. Full detail is now in `CLAUDE.md` §11.

### What changed

| File | Change |
|---|---|
| `CLAUDE.md` | New §11: the 4 deliverables, the pass/fail gate, the scoring, and which phase delivers each one. Docker Compose changed from "if required" to **required and never cut** (§2.3, Phase 8, Phase 10). Phase 9 now names the co-designer gate and a test on a low-cost Android phone over 3G. Conformance report path updated (§8, §9) |
| `LICENSE` | New placeholder. The open licence is announced at kickoff on 14 Nov; until it is filled in, no licence is granted. The font licences (SIL OFL) are listed |
| `savanna-onboarding/docs/conformance-report.md` | New skeleton: all 55 WCAG 2.2 A + AA success criteria, the judging gate, test environments, known limitations and an evidence index. **Every result says "Not yet tested"** |

No code was changed, so no tests were run.

### Deliverables (due 16:30, 15 Nov)

| Deliverable | Status now | Delivered in |
|---|---|---|
| D1 Code under the open licence announced at kickoff | Placeholder `LICENSE` | Fill in on 14 Nov; check in Phase 10 |
| D2 README that lets a developer install in about an hour (Adoptable = 25 pts) | Partial: README and `docs/for-developers.md` exist; no `mount()` API, build or test host page yet | Phase 8 (build, API, guide) → Phase 10 (timed fresh install) |
| D3 Docker Compose, required (`docker compose up` serves the demo and the test host page, no paid services) | Not started | Phase 8 → Phase 10 (clean-machine check) |
| D4 WCAG 2.2 AA conformance report | Skeleton, nothing tested | Evidence gathered every phase → filled in Phase 9 |

### Pass/fail gate

| Gate | Status now |
|---|---|
| Co-designer completes the main task unaided (NVDA, TalkBack, keyboard only, 200% zoom, sound off) | **Not yet tested.** Keyboard only and zoom are covered by automated tests; NVDA and TalkBack still need a person |
| axe-core: zero critical or serious issues | **Passing today** (0 violations in 80 automated scans, Phase 1) |
| Conformance report submitted | Skeleton only |

### Scores (out of 100) and where the points come from

| Area | Points | Delivered in | Where we are |
|---|---|---|---|
| Works for the intended people | 30 | Phases 2, 3, 4, 5, 7, 9 | Core form engine works; voice privacy bug, read-aloud gaps, identity badges and the learner takeover are still open |
| Adoptable | 25 | Phases 1, 2, 8, 10 | Scoped styles and tokens done; the `mount()` API, script-tag build, Docker and the "install in about an hour" README are still to come |
| Built for Ethiopia | 15 | Phases 1, 3, 4, 6, 9 | Amharic text and font, and the Ethiopian calendar, exist. Recorded Amharic audio, offline, a 3G test and the native-speaker review are not done yet |
| Quality, security and privacy | 15 | Phases 2, 3, 5, 6, 9 | 154 automated tests; 4 privacy bugs still open; no security review yet |
| Cheap to keep running | 15 | All, checked in 8 and 10 | Static files, no paid APIs, self-hosted fonts. Browser voice input depends on Google's free service; adapters will keep it replaceable |

### Decisions needed from the team

1. ~~**Offline:**~~ Answered 14 Nov: a minimum offline mode is never cut (see below).
2. **The "main task" for the co-designer gate:** proposed as "sign up and save a Support Passport". Please confirm.
3. **3G performance:** the Amharic font file is ~198 KB and loads only when Amharic text is on screen. A throttled-3G
   test is planned for Phase 9. Do we also want a size budget for the page?
4. **Vercel (still open from Phase 1):** Root Directory not applied, and `dimts-track1.vercel.app` still shows the old version.

### Next step

Wait for "go to Phase 2".

---

## Hackathon day 1: opening deck and training decisions (recorded 14 Nov 2026)

Recorded in `CLAUDE.md` §2 (decisions 8–13), §5, §6 and the new §12.

- **Deliverables (from 13 Nov), unchanged:** code under the open licence, a README that gets a judge installed in an
  hour, Docker Compose (required), the WCAG 2.2 AA conformance report. Gate and scoring as in §11.
- **Integration levels:** Level 1 script tag (minimum), Level 2 REST + OpenAPI, Level 3 open standard. **We target
  Level 1 + Level 3 (JobPosting).** No server, no invented endpoints. Written up in `savanna-onboarding/docs/api-schema.md`.
- **Privacy rule:** "nothing leaves the host without consent". Browser voice input needs a consent step first.
  **Voice is never offered on support-needs or ID questions** (done in Phase 2, see below).
- **Offline:** a minimum is never cut (answers saved on the device first; module and recorded audio available offline).
  Plan: `savanna-onboarding/docs/offline-plan.md`.
- **Speech adapter:** one interface for speech in and out; **Addis AI** noted as an optional future engine, not a dependency.
- **Testing:** includes the cheapest Android phone we can borrow, and a 3G-speed connection.
- **21 Oct co-design findings** (time-outs, ID refugees don't have, English-only help, job boards breaking under
  screen readers): shown with our answer to each in the README and the conformance report (§2a).
- **Panel:** a certified accessibility specialist, two co-designers, a senior ALX engineer, a platform representative.
  The gate's 200% zoom is covered by our automated 400% / 320px checks (a person still checks it in Phase 9).
- **Starter kit:** it is `alx-africa/Savanna-static-pages`, the same repo as our reference clone (`9e83ac7`, unchanged
  at 11:30). Phase 8 is not blocked: pull it again at the start of Phase 8, then mount the module inside those pages
  from our repo or a copy, never changing ALX's files.

---

## Phase 2 — Form engine tidy-up ✅ (14 Nov 2026)

### What changed

- `savanna-onboarding/savanna-onboarding.js`: split into clear layers in the same single file (no build step needed):
  storage adapter → config (registry, `showIf`, validation) → **state** (`FormState`, no page elements) →
  **presentation** (`View`, HTML only) → component (wires them together). Version 0.4.0.
- `savanna-onboarding/forms.js`: `sensitive` flags on ID and support questions; `clearIfChanged` on the ID number; new
  **`profile`** form built from the sign-up questions.
- `savanna-onboarding/app.js`: new "My profile" page (`#/profile`); storage keys moved; honest ID level shared by
  sign-up and profile update.
- `savanna-onboarding/docs/api-schema.md` (new), `docs/offline-plan.md` (new), `docs/for-developers.md`, `README.md`,
  `docs/conformance-report.md` (co-design findings table): updated.
- Tests: new `tests/engine.spec.mjs` (13 tests); profile screens added to the accessibility sweep; selectors moved from
  fixed ids to `data-ref`; the button-colour test now moves the mouse away first (it was catching the hover fade).
- `CLAUDE.md`: day-1 decisions and the starter-kit news.

### Fixed

| Problem | Fix | Test |
|---|---|---|
| Two forms on one page clashed (same ids) | Every id is prefixed with the form's own id (`so1-input`, `so2-input`…) | known-issues (now a normal test) + engine: labels, errors and focus stay in their own form |
| Stale ID number | Answers to questions no longer shown are deleted from the draft; changing the ID type empties the ID number and asks it again (also after "Change" on the summary) | known-issues + 2 engine tests |
| Question count jumped ("of 6" → "of 7" at the ID question; "of 7" → "of 10" for partner help) | The count includes the shortest route a pending choice can open, so it stays at 7 for the whole "for myself" route. It only grows right after a choice that adds questions, and the learner hears "Your answer changed the number of questions. There are now 10 questions." | 2 engine tests |
| Resume screen | Leaving on "Check your answers" comes back there; one resume code per draft (no pile-up); the code is deleted on submit; a link opened on another phone explains that answers stay on the phone where you started; "Welcome back" is now announced (filled into the live region after it appears) | 3 engine tests |
| Storage keys `dimts.` | Keys are now `savanna-onboarding.*` through a replaceable storage adapter; old `dimts.*` data is moved automatically once | engine test |
| Saved draft `mode` not restored | Restored (review or question) | engine test |

### Added

- **Profile-update journey** (`profile` form, "My profile" page): opens on a summary of the learner's details,
  prefilled from the profile; "Change" only what needs updating; nothing else is asked; later forms (job application)
  use the new details. Without a profile, the page explains and links to sign-up. The demo host keeps only the honest
  ID level, not the ID number.
- **No voice on sensitive questions:** the microphone is not shown on ID type, ID number, referral partner, any Support
  Passport question or the "share my Support Passport" question (CLAUDE.md decision 9). The "other need" hint no
  longer says "Say it".

### Tests (one worker, mobile then desktop)

| Project | Passed | Skipped | Failed |
|---|---|---|---|
| mobile (Pixel 5) | 92 | 5 | 0 |
| desktop | 96 | 1 | 0 |

- axe-core: **88 scans** (22 screens × 2 languages × 2 devices), **0 serious or critical**. Structure, language of
  parts and 320px (400% zoom) checks pass on every screen, including the two new profile screens.
- Expected failures still marked `test.fail()` (fixed in later phases): unconfirmed speech saved, "Say it again" keeps
  the old words, no mic on the date (Phase 3); profile stored as plain text (Phase 6 decision).
- Behaviour kept the same: all Phase 0–1 journey, keyboard, design and accessibility tests pass, with only selectors
  changed. One deliberate difference: "Finish later" now reuses the same resume code.

### Section 8 routine

Keyboard, axe, 320px: automated, pass. **NVDA and TalkBack: still to do by the team** (checklist in the Phase 1 section).

### Real vs simulated after Phase 2

Same as Phase 1, plus: profile update **implemented**; resume link **partial** (same phone only; the SMS is still a
labelled simulation); no voice on sensitive questions **implemented**; offline **partial** (drafts on the device; the
page does not yet open offline).

### Known issues still open

Unconfirmed speech saved, "Say it again", date mic, voice consent not withdrawable (Phase 3); silent read-aloud with no
voices, no pause/stop, combined read-aloud/picture setting (Phase 4); no trust badges, no learner takeover, staff name
in the profile, sharing choice not enforced (Phase 5); plain-text storage, offline app shell (Phase 6); mount API, test
host page inside the starter, Docker Compose (Phase 8); NVDA/TalkBack by a person; Amharic review.

### Proposed schedule for Phases 3–10 (now Sat 11:45 → submit Sun 16:30)

| When | Phase | Scope (gate and Track 1 must-haves first) |
|---|---|---|
| Sat 12:00–13:30 | 3 Voice with review | Speech state machine behind one adapter; never save unreviewed speech; editable transcript; withdraw consent; WebView / unsupported fallback |
| Sat 13:30–15:00 | 5 Identity and private support | Trust badges on every ID route; private-by-default support card; consent per application enforced; learner takeover after partner sign-up |
| Sat 15:00–16:15 | 4 Low-literacy | Play button per option; pause / stop / replay (WCAG 1.4.2); separate read-aloud and picture mode; audio adapter ready for recordings |
| Sat 16:15–18:00 | 8 Integration (+ D2, D3) | Pull the starter; `mount()`/`unmount()`; mount inside the Savanna pages from our repo; test host page; **Docker Compose**; README install guide draft |
| Sat 18:00–19:00 | 6 Minimum offline | Service worker caches module, fonts, audio; offline status; drafts cleared after submit |
| Sat evening (team) | — | Amharic review; record audio clips; first NVDA / TalkBack pass on the deployed demo |
| Sun 08:30–09:30 | 7 Career gateway | Polish only: apply prefill, consent to share, employer form, JobPosting (mostly exists) |
| Sun 09:30–12:30 | 9 Testing (gate) | Co-designer main task with NVDA, TalkBack, keyboard, 200% zoom, sound off; cheapest phone on 3G; fix what breaks |
| Sun 12:30–14:30 | 9 / 10 | Conformance report filled in; README timed install by a newcomer; `docker compose up` on a clean machine |
| Sun 14:30–16:00 | 10 Submission | Licence, evidence, demo script, architecture overview, real vs simulated list. **Submit by 16:00** (30 min buffer) |

Phase stops stay, but reviews need to be quick (about 10 minutes each).

**Cut first, in this order:** (1) microphone on the date field (document why); (2) offline beyond the minimum
(IndexedDB, sync); (3) encrypting device storage (minimise and delete instead); (4) simplified-wording toggle and
picture-mode polish (keep pause/stop); (5) new Phase 7 features beyond polish; (6) removing the old `dimts` aliases.
**Never cut:** gate items, voice review fix, private support and consent, ID routes and badges, Docker Compose, README,
conformance report, minimum offline.

### Decisions needed

1. Approve the schedule and cut order above.
2. Confirm the gate's main task (proposed: sign up and save a Support Passport).
3. Who records Amharic audio tonight, and who reviews the Amharic text.
4. ~~Vercel~~ Resolved: fixed by the team on 13 Nov (see Phase 2 review decisions below).

### Next step

Wait for "go to Phase 3".

---

## Phase 2 review decisions (14 Nov 2026)

Recorded in `CLAUDE.md` §2 (decisions 14–18), §6 (Phase 8) and §10.

- **Schedule and cut order approved**, with one change: **Phase order 3 → 5 → 8 → 4 (about 17:30) → 6**, then 7, 9, 10.
- **Phase 8** must show a **realistic learner journey inside the Savanna starter pages**: Savanna home → "Sign up" →
  our onboarding → a simple dashboard; the profile with Support Passport and "My profile"; Savanna's jobs section with
  our filter and application; an employer page with the accommodations form; a **simple simulated log-in** meeting WCAG
  3.3.8 (no memory tests, paste allowed), clearly labelled as simulated. The current site stays as the developer and test page.
- **Gate main task confirmed:** "sign up for Savanna and save a Support Passport". That path must be perfect first.
- **Amharic:** the co-designer or an interpreter reviews the text this afternoon; Zeamanuel records the clips tonight
  from `savanna-onboarding/docs/audio-script.md` (written in Phase 3, ahead of Phase 4).
- **Vercel: resolved (by the team, 13 Nov).** Project `savanna-accessible-onboarding` publishes only the
  `savanna-onboarding` folder. Checked 14 Nov: https://savanna-accessible-onboarding.vercel.app serves the demo at its
  root (module 0.4.0, commit `45bac8a`), and `CLAUDE.md` and the tests are no longer public (404). The duplicate project
  is being deleted. The old `dimts-track1` site stays as it is for now. (This closes the Vercel item from Phases 1 and 2.)

---

## Phase 3 — Answer input system (speak, type, tap) ✅ (14 Nov 2026)

### What changed

- `savanna-onboarding/savanna-onboarding.js` (version 0.5.0):
  - **Speech adapter:** all speech input and output go through one interface; `SavannaOnboarding.setSpeech({ input, output })`
    plugs in another engine (Addis AI possible later, not a dependency). Default: the browser's engine.
  - **Voice state machine:** idle → consent (first use) → listening → processing → review → confirmed, plus error and
    discarded. The transcript lives only in the review panel until the learner chooses **Use this answer**.
  - **Review panel:** "I heard: …", the words in an **editable box**, "Or did you say: …" alternatives as buttons, and
    **Use this answer / Say it again / Type it instead** ("Tap it instead" for choices). For a choice it shows the option
    it matched; nothing is ticked until confirmed.
  - **Clear status:** "Microphone on. Listening… speak now. Your browser may ask to use the microphone. Choose Allow.";
    the button becomes "Stop listening" (red, `aria-pressed="true"`); pressing it again stops.
  - **Errors with plain messages:** microphone blocked, no network, nothing heard, no microphone, language not
    supported, other failure. Typing and tapping always keep working.
  - **No speech engine** (for example inside some apps' WebView): no microphone button; a learner who chose "Speak my
    answers" sees a plain note instead.
  - **Continue while a voice answer is waiting** does not skip the check: the learner is asked to choose first.
  - Changing language, opening help or leaving the question throws unconfirmed words away.
  - **Settings → "Voice answers: Allowed / Not allowed"**, with the Google explanation: consent can be withdrawn (or
    given) at any time. The consent panel says so.
- `savanna-onboarding/docs/audio-script.md` (new): **73 Amharic clips** for the sign-up and Support Passport path
  (about 10 minutes), each with its number, file name, exact Amharic text and rough length, plus recording guidance.
  Generated from the live text by `savanna-onboarding/tools/audio-script.cjs`, so it never drifts from the screens.
- Docs: `for-developers.md` (voice and speech adapter section), `README.md` (live URL, voice row), `api-schema.md`
  (voice consent key; version), `CLAUDE.md` (decisions 14–18, Phase 8 journey, Vercel), `.vercelignore` (tools/).
- Tests: new `tests/voice.spec.mjs` (17 tests, using a fake speech engine); voice consent and review panels added to
  the accessibility sweep; two known bugs now normal tests.

### Fixed

| Problem | Status | Test |
|---|---|---|
| Unconfirmed speech saved to the draft (privacy bug) | **Fixed.** Never written to the answer or the draft before "Use this answer"; saved only on Continue | known-issues + voice |
| "Say it again" kept the old words | **Fixed** | known-issues |
| Voice consent could not be withdrawn | **Fixed** (Settings) | voice |
| No microphone on the date | **Decision:** stays without one (approved cut; documented) | known-issues (now checks there is none) |
| Silent failure without a speech engine | **Fixed** for voice input (read-aloud fallback is Phase 4) | voice |

### Tests (one worker, mobile then desktop)

| Project | Passed | Skipped | Failed |
|---|---|---|---|
| mobile (Pixel 5) | 112 | 5 | 0 |
| desktop | 116 | 1 | 0 |

- axe-core: **96 scans** (24 screens × 2 languages × 2 devices), **0 serious or critical**, including the voice consent
  panel and the "check what I said" panel. Structure, language of parts and 320px checks pass on all of them.
- Only one expected failure left: profile stored as plain text (Phase 6 decision).
- **Not tested:** a real microphone and Google's recogniser (tests use a fake engine), Amharic recognition quality,
  and behaviour inside a real Android WebView. These need a person with a phone (Phase 9, or earlier on the deployed demo).

### Section 8 routine

Keyboard, axe, 320px: automated, pass. **NVDA and TalkBack: still to do by the team.** Suggested quick check for voice:
on Chrome for Android, answer the name question by voice, fix one word in the box, choose "Use this answer".

### Real vs simulated after Phase 3

Voice input: **partial** (works where the browser has a speech engine and a connection; audio goes to Google with
consent; review before use is implemented; Amharic quality unknown). Everything else as after Phase 2.

### Known issues still open

Read-aloud silent with no voices, no pause/stop, combined read-aloud/picture setting (Phase 4); trust badges, learner
takeover, staff name in the profile, sharing choice not enforced (Phase 5); plain-text storage, offline app shell
(Phase 6); realistic journey inside the starter pages, mount API, simulated log-in, Docker Compose (Phase 8);
NVDA/TalkBack by a person; Amharic review (this afternoon) and recordings (tonight).

### Decisions needed

None blocking Phase 5. For the Amharic review this afternoon: please mark changes on `docs/audio-script.md` (or send
them) and I will put them into the code and regenerate the script before recording.

### Next step

Wait for "go to Phase 5".

---

## Manual test results from the team

_Recorded here as they arrive (14 Nov onwards). None received yet at the end of Phase 5._

| Date / time | Tester | Device, browser, assistive technology | What was tested | Result | Follow-up |
|---|---|---|---|---|---|

---

## Phase 5 — Identity and private support ✅ (14 Nov 2026)

### What changed

- `savanna-onboarding/savanna-onboarding.js` (version 0.6.0):
  - **Honest trust vocabulary:** `SavannaOnboarding.TRUST` and `trustLevel(answers)`: "Self-declared", "Number recorded
    — not verified", "Partner referral pending" (Amharic too). Nothing anywhere says "verified".
  - **Option badges:** any choice can carry a visible `badge`; it is read as part of the option and repeated on "Check
    your answers".
  - **`supportForEmployer(applyAnswers)`:** the only way support data reaches an employer: the Support Passport needs,
    and only when the learner said "share" for that application. Never the learner's own words.
  - Field `default` (privacy-first preselection) and text that can be a function of the language (wording that uses
    the learner's own data).
  - **Focus outline always fully on screen:** controls keep a 24px gap when the browser scrolls them into view (found by
    the keyboard test: on the longer "Check your answers" page a Change button sat flush with the bottom edge and its
    outline was cut off).
- `savanna-onboarding/forms.js`:
  - badges on all six ID choices; a hint that nobody checks IDs automatically;
  - the ID-number hint explains the status it gives;
  - the staff-name hint says the name is removed at takeover;
  - the Support Passport defaults to "Only me";
  - the job application shows the exact list that would be shared;
  - new **`takeover`** form.
- `savanna-onboarding/app.js` / `app.css`:
  - an ID status badge after sign-up, profile update and takeover;
  - **handover** screen after partner sign-up;
  - **takeover** page (`#/takeover`);
  - the Support Passport waits until takeover is done;
  - **private Support Passport card** ("Who can see this", trainer sharing on and off, "Shared with employers" with
    **Withdraw**, "Never shared" note);
  - applications use `supportForEmployer`.
- Docs: `api-schema.md` (trust values, takeover, consent helper, records), `for-developers.md` (badges, default,
  identity section), `README.md` (real vs simulated). `docs/audio-script.md` regenerated (4 hints changed).
- Tests: new `tests/identity.spec.mjs` (11 tests); 3 new screens in the accessibility sweep (private card, handover,
  takeover). The voice-consent test now waits for the saved value (it read storage too early once under load).

### Track 1 requirements

| Requirement | Status |
|---|---|
| ID routes: Fayda, kebele, passport, refugee ID / proof of registration, another document, partner referral | implemented (since the prototype) |
| Honest trust badges on each choice | **implemented** |
| Private support card: no diagnosis, private by default, explicit and revocable consent, clear "who can see this" | **implemented** (on the device; trainer and employer systems simulated) |
| Partner-assisted flow with learner consent and **learner takeover** | **implemented** |
| Staff name not kept in the learner's profile | **fixed:** kept only until takeover, then removed |
| Sharing choice enforced | **fixed:** employer data only via `supportForEmployer`, per application; trainer sharing never means employers |

### Tests (one worker, mobile then desktop)

| Project | Passed | Skipped | Failed |
|---|---|---|---|
| mobile (Pixel 5) | 129 | 5 | 0 |
| desktop | 133 | 1 | 0 |

- axe-core: **108 scans** (27 screens × 2 languages × 2 devices), **0 serious or critical**; structure, language of
  parts and 320px checks pass on all of them, including the badges, private card, handover and takeover screens.
- Found and fixed by the tests: the focus outline cut off at the bottom of the screen (module fix, above).
- Only one expected failure left: profile stored as plain text (Phase 6 decision).

### Section 8 routine

Keyboard, axe, 320px: automated, pass. **NVDA and TalkBack: by the team** (results go in the table above). Suggested
checks for this phase: ID choices with NVDA (the badge should be read with each option), and the takeover screen.

### Real vs simulated after Phase 5

- **ID:** never verified (no service), and honest about it everywhere.
- **Trainer sharing and employer sharing: simulated.** There is no trainer or employer system, so nothing is sent.
  Withdrawing changes the copy on the phone, and the screen says so.
- **Partner takeover:** implemented on one phone (the handover happens on the same device).

### Known issues still open

- **Phase 4:** read-aloud is silent when there are no voices; no pause/stop; the read-aloud and picture settings are combined.
- **Phase 6:** plain-text storage; the page doesn't yet open offline.
- **Phase 8:** realistic journey inside the starter pages, simulated log-in, mount API, Docker Compose.
- **Team:** NVDA/TalkBack checks by a person; Amharic review and recording.

### Decisions needed

None blocking Phase 8. Note for the Amharic review: `docs/audio-script.md` was regenerated after four hint changes in
this phase (ID question, ID number, staff name, "who can see this").

### Next step

Wait for "go to Phase 8".

---

## Phase 8 — Savanna integration ✅ (14 Nov 2026)

### What changed

- **Starter pulled again:** `alx-africa/Savanna-static-pages` is still `9e83ac7`. ALX's clone is untouched.
- **`vendor/savanna-static-pages/` (new):** Savanna's own stylesheets, plus the fonts and images they use (117 files,
  8 MB on disk), copied **byte for byte** by `tools/vendor-savanna.cjs`. `VENDOR.md` records the source and the commit.
  - Not copied: the Adobe Typekit fonts (licensed to ALX's domains).
  - `LICENSE` says these files belong to ALX and are not under our licence.
- **The learner journey inside Savanna's pages (the new site root):**
  - Pages: `index.html` (Savanna home), `signup.html`, `login.html` (simulated), `dashboard.html`, `profile.html`,
    `passport.html`, `takeover.html`, `jobs.html`, `apply.html?job=…`, `employer.html`, `settings.html`.
  - `journey/journey.js` draws Savanna's header and sidebar around the module.
  - `journey/journey.css` holds our additions, scoped so they never touch Savanna's own components.
  - The pages are generated by `tools/journey-pages.cjs`.
- **Accessibility fixes in our copy of Savanna's frame:**
  - the menu `<div>` became a real button with a visible "Menu" label;
  - the logo link got a text alternative;
  - the sidebar became a labelled `<nav>`, with `aria-current` on the current page;
  - grey sidebar text at 2.6:1 became navy;
  - added a skip link;
  - focused items never hide under the fixed header.

  The README lists these as recommendations for ALX.
- **Simulated log-in (WCAG 3.3.8):**
  - Phone number, then a code shown in a labelled "Simulated SMS".
  - No password to remember and no puzzle. The code can be pasted or filled in by the phone (`autocomplete="one-time-code"`), and there is no time limit.
  - Errors follow the module's pattern (summary, link to the field, `aria-invalid`, `aria-describedby`).
  - Log out is in the sidebar. Pages for learners ask you to log in.
- **`SavannaOnboarding.mount(target, options)` / `unmount()` (module 0.7.0):**
  - Options: form or settings, `lang`, `instance`, `welcome`, `focus`, `onComplete`, and **`headingLevel`**, which
    moves the module's headings down a level when the host page has its own `<h1>`.
  - Mounting into the same element again replaces the form instead of adding a second one.
  - The showroom and the Savanna pages both open their forms through `mount()`.
- **Test host page `test-host/`:** an ordinary page (not Savanna, not the showroom). It uses only two script tags,
  `mount()` and `unmount()`, and shows the events the host receives.
- **Docker Compose:** `docker-compose.yml` and `docker/nginx.conf` at the repo root. `docker compose up` serves
  everything on http://localhost:8080 with the free `nginx:1.27-alpine` image. Development files are blocked.
- **Showroom kept:** `index.html` → `showroom.html` (developer and test page), linked from every Savanna page footer.
  `app.js` now also exports the shared demo views (`window.SavannaDemoHost`) used by both hosts.
- **README rewritten around "Install it in under an hour"** (5 timed steps, troubleshooting, "Inside Savanna").
  Also: a new root `README.md`, and updates to `for-developers.md` (mount API), the conformance report scope,
  `CLAUDE.md` §10 and §12, and `LICENSE`.
- Tests: new `tests/journey.spec.mjs` (10 tests, including the **gate task** in English and Amharic, and with the
  keyboard only); 11 Savanna / test-host screens added to the accessibility sweep; the showroom tests now use
  `/showroom.html`.

### Gate task: "sign up for Savanna and save a Support Passport"

Automated, inside the Savanna pages:
- Savanna home → Sign up → one question per screen → "Your account is ready" (signed in, simulated) → "Next: tell us
  what helps you" → Support Passport (private by default) → saved → dashboard.
- **Passes** in English and Amharic, by mouse and with the keyboard only, on phone and desktop sizes.
- Every step has 0 serious or critical axe issues and no sideways scrolling at 320px.
- Still for people: NVDA, TalkBack, 200% zoom by hand, and sound off. The team is testing tonight on the live site.

### Tests (one worker, mobile then desktop)

| Project | Passed | Skipped | Failed |
|---|---|---|---|
| mobile (Pixel 5) | 161 | 5 | 0 |
| desktop | 165 | 1 | 0 |

(A temporary screenshot script was counted in the first run and then removed; the numbers above exclude it.)

- axe-core: **152 scans** (38 screens × 2 languages × 2 devices), **0 serious or critical**. Structure, language of
  parts and 320px checks pass on every screen, including 11 new Savanna / test-host screens.
- Found and fixed on the way:
  - Savanna's grey menu colour overrode ours (contrast);
  - Savanna's `.lead` style made our text fall back to a serif font;
  - the copy tool missed fonts behind an imported stylesheet (one 404, now 0).

### Real vs simulated after Phase 8

- **Log-in: simulated** (labelled).
- **Savanna pages:** a demo built from the starter's CSS, not the real Savanna app.
- **Docker Compose: written, not run.** Docker is not installed on this machine, so `docker compose up` has not been
  run yet. It needs a check on a machine with Docker (Phase 10 clean-machine check, or a teammate tonight).
- Everything else as after Phase 5.

### Live site

`https://savanna-accessible-onboarding.vercel.app/` now opens the Savanna journey. Developer and test page:
`/showroom.html`. Test host page: `/test-host/`. (Checked after the push — see the report.)

### Known issues still open

- **Phase 4:** read-aloud is silent when there are no voices; no pause/stop; recorded audio not yet added.
- **Phase 6:** plain-text storage; the page doesn't yet open offline.
- **Phase 8 follow-up:** Docker Compose not yet run with Docker.
- **Team:** NVDA/TalkBack checks by a person; Amharic review.

### Decisions needed

1. Someone with Docker installed: run `docker compose up` from the repo root and open http://localhost:8080
   (about 2 minutes), then tell me the result.
2. Optional: share the "Inside Savanna" fixes with the ALX engineer on the panel as recommendations.

### Next step

Wait for "go to Phase 4".
