# CLAUDE.md — Savanna Accessible Onboarding Module

Instructions for Claude Code. Read this file fully before every session.
Project: Digital Bridge Accessibility Hackathon 2026 (ALX Ethiopia), Track 1 — Accessible Onboarding.
Event: 14–15 November 2026, ALX Tech Hub, Lideta, Addis Ababa. Submission deadline: 16:30 on 15 November.

---

## 0. How we work (MOST IMPORTANT)

- Work in **phases** (listed in section 6). Do **one phase at a time**.
- **STOP at the end of every phase.** Do not start the next phase until the user says "go to Phase N".
- At the end of each phase, give a short report in plain English (the user is a designer, not a full-time developer):
  1. What you changed (files, in one line each)
  2. What you tested and the results
  3. What is real vs simulated or still missing
  4. Anything the team must decide before the next phase
- Then update `DEVELOPMENT_PROGRESS.md` and make **one Git commit** for the phase, with a message like `Phase 2: form engine — one question per screen`.
- Inside a phase, work on your own. Do not ask approval for ordinary steps.
- Stop early and ask **only** when: an external resource or credential is missing; the official Savanna starter or docs are needed but not available; an integration contract would require guessing; a change risks privacy, security or learner safety; a destructive or irreversible action is needed; or a significant requirement needs an owner decision.
- When blocked, say: the exact blocker, what is done, what remains, and the smallest decision needed.
- Explain things simply. Avoid jargon in reports; if a technical word is needed, explain it in a few words.

## 1. Product

- **Official name: Savanna Accessible Onboarding Module.** The old prototype was called "Dimts". Remove "Dimts" from all user-facing text, headings, page titles, README and docs. Internal code names may be renamed when touched; do not leave "Dimts" visible anywhere a user or judge will see it.
- It is a reusable, portable onboarding and learner-profile **module** for the Savanna learning platform, installable on other sites. It is **not** a standalone website or LMS.
- Core principle: **ACCESS WITHOUT DISCLOSURE.** Learners choose accessible ways to interact (read-aloud, voice, larger text, simple mode) without ever stating or proving a disability. These preferences are never shared with employers automatically.
- Key differentiator: **ONE CONFIGURABLE FORM ENGINE, MANY JOURNEYS** (registration, profile update, support preferences, job application, employer form).

## 2. Decisions already made (do not reopen without asking)

1. **Stop after every phase** for team review (section 0).
2. **Keep the existing framework-free Web Component core.** Do NOT rewrite in React now. Add a `SavannaOnboarding.mount(selector, options)` / `unmount()` API on top of it. Revisit React only after the official ALX starter is inspected at kickoff (14 Nov).
3. **Scope and order** follow section 6. Offline sync, Docker and API work come after the core phases and are cut first if time runs out.
4. **Own repository** (Phase 0.5, 12 Nov): https://github.com/zeamanuelmek/savanna-accessible-onboarding. The module lives in `savanna-onboarding/` inside it. The Savanna reference is a separate, untouched clone next to it at `../Savanna-static-pages` (tests read it from there, or from `REFERENCE_DIR`). **Ask before resetting or deleting anything in the reference folder.**
5. **Names:** folder `savanna-onboarding/`, element `<savanna-onboarding-form>` (and `<savanna-onboarding-settings>`); `<dimts-form>` stays as an alias for now.
6. **Colour:** primary actions use Savanna red `#db3e3e`, darkened only as much as needed to reach 4.5:1 for text and buttons. Headings and text use navy `#002b56`. Green is for success states only, never for text. The focus outline must meet 3:1.
7. **Base text size:** the module sets its own base size so it does not shrink inside Savanna's 14px pages, and it respects the learner's text-size setting.

## 3. Starting point (what already exists)

The prototype (files `dimts.js`, `forms.js`, `app.js`, `app.css`, `index.html`, `README.md`, now in `savanna-onboarding/`) already has:
- A `<dimts-form>` web component: one question per screen, question as `<h1>` with focus moved to it, progress text + bar, back link, plain errors with an error summary, check-your-answers with change-and-return, no timeouts, autosave to localStorage, "finish later" with a simulated SMS preview.
- Field types: text, tel, email, textarea, choice, multi, consent, ethdate (Ethiopian calendar with Gregorian conversion). `showIf`, `prefill`, `optional`.
- Four form configs in `forms.js`: signup (with partner-assisted route, ID routes incl. "refer me"), passport (support needs), employer, apply.
- Read-aloud via SpeechSynthesis (with optional pre-recorded `audio` per question); voice input via Web Speech API (am-ET / en-US) with a consent screen and "I heard… / Yes / Say it again / Type it instead".
- Welcome screen (choose: read and type / listen / speak / simple), `<dimts-settings>` (language, text size, contrast, answer mode, read-aloud), preferences applied globally via `data-dm-size` / `data-dm-contrast` on `<html>`.
- Demo host (`app.js`): mobile menu, home, jobs list with on-device support filter, schema.org JobPosting output, "For developers" page.
- Amharic + English strings (Amharic is a DRAFT needing native-speaker review).
- Live demo: https://dimts-track1.vercel.app (Vercel project `dimts-track1`).

**Known problems to fix (found in review):**
- **Privacy bug:** after speech recognition, the engine writes the transcript into the answer and saves the draft BEFORE the learner confirms. Unreviewed speech must never be saved. Fix in Phase 3.
- No trust badge beside each ID choice; no per-option play button; no microphone on the date field; no profile page; no "learner takes over" step after partner sign-up; consent is not revocable in the UI.
- "For developers" page is inside the learner site — must move to docs and a separate test host page.
- Green theme is not Savanna branding.
- Sensitive data (profile, support needs) stored in plain localStorage.
- ~~No automated tests in the repo.~~ Done in Phase 0: Playwright + axe-core in `savanna-onboarding/tests/`.

## 4. Savanna reference and branding (high priority)

- Reference repo: https://github.com/alx-africa/Savanna-static-pages — three frozen learner pages (plain HTML/CSS), Sprockets-served `application_alx.css`, esbuild `app.css`, Bootstrap bundle + Popper, React/TypeScript islands, Google Fonts and Typekit, Rive animations. It is a visual/technical reference, **not** the real backend or starter. **Never modify it.** Local clone: `../Savanna-static-pages` (next to this repo).
- Extract the **real** colours, fonts, weights, sizes, radii, spacing, buttons, form controls and breakpoints from its CSS. Do not guess values from memory or screenshots.
- **Fonts:** check which fonts come from Typekit (Adobe, licensed, usually locked to ALX domains) vs Google Fonts. Test whether they actually load on localhost and on Vercel. If a licensed font cannot load, use the closest permitted alternative and document why. Always add an Ethiopic fallback (e.g. Noto Sans Ethiopic) for Amharic without replacing the Latin font.
- Check colour contrast (WCAG AA: 4.5:1 text, 3:1 large text and UI). If a brand colour fails, use an accessible variant for that use only.
- Record everything in `DESIGN_TOKENS.md` (token name, value, source file/line, contrast results).
- Style: modern, calm, welcoming, mobile-first, feels like part of Savanna. Avoid card clutter, decorative noise, tiny controls, icon-only buttons, medical aesthetics, developer panels in learner views.
- Keep all module styles scoped (prefixed classes or CSS custom properties) so nothing clashes with Savanna/Bootstrap.

## 5. Architecture rules

- Separate: presentation · form engine · question configs · answer state · accessibility services · voice service · audio service · identity and support logic · profile and career journeys · storage · API adapter · host integration adapter.
- Voice, audio and storage sit behind **replaceable adapters** (so Addis AI, recorded Amharic audio or a backend can be plugged in later).
- One shared answer state for typing, speaking and tapping.
- Integration levels: **Level 1 script tag first** (`<script src="savanna-onboarding.js">` + `SavannaOnboarding.mount(...)`). Level 2 (REST + OpenAPI) only when a real contract exists — never invent endpoints. Level 3: keep schema.org/JobPosting for jobs; add LTI 1.3 or Open Badges only with a real use case.
- The module emits events (e.g. `savanna:complete`) and lets the host decide where data goes.
- Dependencies: smallest set possible. Don't install a tool just because it is listed; record why each one is needed in `DEVELOPMENT_PROGRESS.md`. Candidates if useful: a small bundler (esbuild/Vite), `idb`, Lucide SVG icons, Playwright, axe-core, Vitest, ESLint (+ a11y lint).

## 6. Phases (stop after each one)

**Phase 0 — Audit and plan (no feature code).**
Inspect the repo and the Savanna reference. List what works, what is broken, gaps vs requirements, dependencies, risks, ALX-dependent assumptions. Propose the folder structure and the exact plan for Phases 1–3. Create `DEVELOPMENT_PROGRESS.md`. Set up the test harness (Playwright + axe-core) and record a baseline run. Commit.

**Phase 0.5 — Own repository (done 12 Nov).**
Move the work to its own repo with history, rename the folder to `savanna-onboarding/`, add the accessibility definition of done (section 8), push.

**Phase 1 — Brand and design system + rename.**
Extract real tokens → `DESIGN_TOKENS.md` and CSS custom properties. Typography incl. Ethiopic fallback. Focus, error, selected, disabled states. Rename to "Savanna Accessible Onboarding Module" everywhere user-facing. Move "For developers" out of the learner UI. Acceptance: looks like Savanna, plus the definition of done in section 8 (including 400% zoom / 320px with no sideways scrolling, and axe with zero critical/serious issues).

**Phase 2 — Form engine tidy-up.**
Keep the engine; separate config, state and presentation more cleanly; confirm at least two journeys use it. Add a profile-update journey. Accessible progress, error association, answer retention.

**Phase 3 — Answer input system (speak, type, tap).**
Speech as a clear state machine: idle → permission → listening → processing → transcript ready → review/edit (editable transcript) → confirmed, plus error/retry and discard. **Never save unreviewed speech** (fix the known bug). Mic permission only after the learner chooses voice; clear "microphone on" status; handle denial, unsupported browser, network errors. Explain that browser speech may use a remote service. Add a mic to the date field (or document why not).

**Phase 4 — Low-literacy and read-aloud.**
Play button on every option, plus replay / pause / stop. Icons always with text. Simplified wording option. Clear selected states. Audio adapter ready for reviewed Amharic recordings. Never assume a good Amharic browser voice; never make audio mandatory.

**Phase 5 — Identity and private support.**
ID routes: Fayda, kebele ID, passport, refugee ID / proof of registration, other document, partner referral. **Honest trust-status badges** on each choice (e.g. "Self-declared", "Number recorded — not verified", "Partner referral pending"). Private support card: no diagnosis, private by default, explicit and **revocable** consent, clear "who can see this". Partner-assisted flow with learner consent and a **learner takeover** step.

**Phase 6 — Settings, saving and offline (cut-first if short of time).**
Persistent text size, contrast, audio-first, language, interaction mode. Minimise stored personal data; clear drafts after submit; decide with the team what sensitive data may be kept locally. IndexedDB drafts + service-worker app-shell caching + offline/sync status only if time allows. Never claim offline speech.

**Phase 7 — Career journeys.**
Job application reuses the engine, prefilled from the profile, voice for open questions; employer accommodation form; on-device matching that never reveals disability; JobPosting output.

**Phase 8 — Savanna integration (needs the official starter, 14 Nov).**
Script-tag build, mount/unmount API, host configuration, scoped styles, integration guide, a **separate test host page** proving it works outside the demo site. Reassess when the starter arrives; stop and ask if the contract is unclear.

**Phase 9 — Accessibility, privacy and security testing.**
axe-core, keyboard-only, NVDA, TalkBack (incl. Android WebView), 200% and 400% zoom, 320px reflow, sound off, large text, high contrast, transcript editing, error handling. Privacy and security review. Write the **accessibility conformance report** (test · expected · actual · pass/fail · evidence · limitations · untested). Map the official ALX 35-feature checklist when provided — never invent it.

**Phase 10 — Submission.**
README, install and integration guide, Docker Compose (if required), testing evidence, demo script, architecture overview, clear list of real vs simulated features. Verify a clean setup works.

## 7. Non-negotiable rules

- Preserve working features; don't replace the whole project. Small, logical changes.
- Never mark a feature done just because its UI exists. Label each feature: implemented / partial / simulated / unavailable.
- Never claim WCAG 2.2 AA compliance, offline support, Amharic speech quality, SMS or a backend without tested evidence.
- A mock SMS must be visibly labelled as a simulation.
- Never claim an ID is verified; there is no verification API.
- Never expose support or disability information to employers without explicit per-application consent.
- AI-generated Amharic is a draft until a native speaker reviews it. AI must never decide identity or change a learner's answers without confirmation.
- Don't modify frozen Savanna reference files. Don't delete original materials.
- No developer controls in learner-facing views.
- Run the test suite after each feature; fix regressions before moving on.

## 8. Accessibility definition of done (ALX training, 12 Nov)

**WCAG 2.2 AA is the definition of done for every phase.** A phase is not finished until its changes pass the routine below. Record results in `DEVELOPMENT_PROGRESS.md` (and later `ACCESSIBILITY_CONFORMANCE.md`). Steps that need a person (NVDA, TalkBack) are listed as "to do by the team" until someone runs them — never reported as passed without evidence.

**End-of-phase test routine (in this order):**
1. **Keyboard only** — every control reachable and usable, visible focus, logical order, no traps.
2. **NVDA** — `H` (headings), `D` (landmarks), `F` (form fields): every item has a sensible name and order.
3. **TalkBack inside an Android WebView** — e.g. the demo link opened inside Telegram.
4. **400% zoom** (= 320 CSS px wide) — no sideways scrolling, nothing cut off.
5. **axe-core** — zero serious or critical issues.

**Rules:**
- **Android WebView:** the component must work inside one. Detect when speech recognition or speech synthesis is unavailable and fall back cleanly to typing and tapping, with a clear message.
- **Name, role, state:** every control has a correct accessible name, role and state. Icon buttons have names. Only real `<button>` elements act as buttons.
- **Errors:** linked to their field with `aria-describedby`; focus moves to the error summary.
- **Pop-ups:** either trap focus (use `<dialog>` with `showModal()`) or are inline panels.
- **Language:** the page and every Amharic or English part declare their language (`lang`).
- **Landmarks and headings:** the module must not add a second `<main>` landmark inside a host page; headings stay in order.
- **Target size:** at least 24×24 px (2.5.8); we use 44–48 px.
- **Focus not obscured (2.4.11):** focus is never hidden behind sticky headers or other overlays.
- **Consistent help (3.2.6):** help stays in the same place on every screen.
- **Redundant entry (3.3.7):** never ask for the same information twice (prefill or let the learner choose earlier answers).
- **Accessible authentication (3.3.8):** any future login allows pasting and password managers, with no puzzles.
- **Career gateway:** job titles are headings; links make sense on their own; the result count is announced on load and after filtering.
- **Timing (2.2.1):** time limits are never used; if one ever exists, it can be turned off or extended.
- **README** must describe keyboard and ARIA support.

## 9. Documents to keep up to date

- `DEVELOPMENT_PROGRESS.md` — per phase: changed files, tests run, results, known issues, real vs simulated, next step, decisions needed.
- `DESIGN_TOKENS.md` — colours, typography, fonts, spacing, sources and contrast results.
- `README.md` — what it is, setup, run, install on another site, configuration.
- `ACCESSIBILITY_CONFORMANCE.md` — from Phase 9 (start collecting evidence earlier).

## 10. Deployment

- Live demo is on Vercel (project `dimts-track1`). Prefer connecting the GitHub repo to Vercel so each push deploys. Ask the user before renaming the Vercel project or changing its domain.
- Vercel settings for this repo: **Root Directory `savanna-onboarding`**, Framework Preset "Other", no build command, output directory `.` (default). `savanna-onboarding/.vercelignore` keeps tests out of the deploy. Revisit when Phase 8 adds a build step.
- Users may see a cached old version; remind the user to refresh after deploys.
