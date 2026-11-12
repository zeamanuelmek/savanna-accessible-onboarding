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
npm test                          # all tests, phone + desktop (about 7 minutes on this laptop)
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

The Savanna reference folder (`Desktop/Savanna-static-pages`) was **not** changed in this phase. It still holds
the old Phase 0 commit and the old `dimts/` folder from before the move — see "Decision needed" below.

### Vercel

Root Directory: **`savanna-onboarding`** · Framework Preset: Other · no build command · output directory default.

### Tests

- **Full browser suite: not re-run in the new location.** The run was stopped by Claude Code because the laptop was low on memory (not a test failure). Re-run with `npm test` in `savanna-onboarding/` before starting Phase 1.
- Checked without a browser: the test server serves the demo (`/index.html`, `/dimts.js` → 200) and the reference pages (`/reference/pages/…`, `/reference/assets/…` → 200), and refuses paths outside both folders (`..` → 404). Server file passes a syntax check.
- No app code changed in this phase; only test paths moved. The Phase 0 baseline (139 passed, 3 skipped) stands until the re-run confirms it.

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

Wait for "go to Phase 1".
