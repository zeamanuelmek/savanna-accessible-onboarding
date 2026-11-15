# WCAG 2.2 AA conformance report — Savanna Accessible Onboarding Module

> **Status: automated evidence filled in (Phase 9, 14 Nov 2026). Manual checks still to do.**
> Every criterion below has the automated evidence collected so far. **No criterion is marked "Supports"**, because
> each one still needs a person to confirm it (NVDA, TalkBack, co-designer). The team fills in the "Manual result"
> column. **No claim of WCAG 2.2 AA conformance is made** until the manual results are in.

## 1. About this report

| Item | Value |
|---|---|
| Product | Savanna Accessible Onboarding Module (web component, mount API) and its demo hosts |
| Version / commit | Module 0.12.0; automated results from the 15 Nov team-fixes commit (see `DEVELOPMENT_PROGRESS.md`) |
| Standard | WCAG 2.2, Levels A and AA (55 success criteria; 4.1.1 Parsing is obsolete in WCAG 2.2) |
| Report date | 15 Nov 2026 (automated part: final pass for the submission). Manual part: _to fill in by the team_ |
| Evaluated by | Automated: Playwright + axe-core 4.14, Chromium. Manual: _names / roles, including co-designers_ |
| Scope | The module (seven journeys and the settings panel) as used in: the Savanna learner journey pages (site root: home, sign-up, simulated log-in, dashboard, profile, Support Passport, takeover, jobs, apply, employer, settings), the test host page (`/test-host/`) and the developer page (`/showroom.html`). Our accessibility fixes to the Savanna page frame are in scope; Savanna's own unchanged stylesheets are not evaluated on their own |
| Out of scope | The Savanna platform itself; the browser's speech services; screen-reader voices |

### What changed on 15 Nov (all covered by the automated evidence below)

- **Header:** one bar on every Savanna page (Home; Language ▾, Accessibility ▾, Log in or account; on phones Home,
  Accessibility ▾ and Menu). The Accessibility panel ("Accessibility options") holds Larger text, High contrast, Stop
  motion and Automatic reading.
- **Reading layer:** hand-written summaries for every page and form step (English, with Amharic and Afaan Oromo
  drafts), read when a page or step opens if automatic reading is on; Listen on every question, answer and in Help;
  "Read all my answers"; reading back voice and typed answers; a playback bar ("Now reading… Pause · Stop") only while
  audio plays. Order of sources: recorded clip, Addis AI (optional proxy), the phone's voice.
- **ID after sign-up:** sign-up asks no ID; "Add your ID (optional)" from My profile and the dashboard.
- **Phone numbers** shown 0911 23 45 67 and read in natural numbers, on the phone only; ID numbers digit by digit,
  on request, on the phone only.
- **Addis AI** speech for Amharic and Afaan Oromo through the demo host's optional proxy; consent names Addis AI and
  Google; never on ID or support-needs questions.
- **Content:** reassuring claims removed ("show trust, do not claim it"); consent facts kept.

### Result values used here

- **Automated: no failures** — the automated checks listed found no failure. A person must still confirm.
- **Not applicable** — nothing in scope that the criterion applies to; the reason is given.
- **Known limitation** — a limitation found and described (see section 5).
- **Supports / Partially supports / Does not support** — used **only** in the "Manual result" column, by the team.

### Automated evidence (Ev)

| Code | Test file | What it checks |
|---|---|---|
| A1 | `tests/a11y.spec.mjs` | axe-core (WCAG 2.0/2.1/2.2 A and AA rules + best practice) on **48 screens × 2 languages × 2 sizes = 192 scans: 0 serious or critical** (including the header's Accessibility panel and Menu open). Also: one `<main>`, one `<h1>`, no skipped heading levels, only real buttons and links, Amharic/English parts marked with `lang`, no sideways scrolling at 320 px (= 400% zoom) |
| A2 | `tests/gate.spec.mjs` | The gate task (sign up and save a Support Passport) in the Savanna pages, **keyboard only, 200% zoom, sound off**, phone and desktop: visible focus outline, fully on screen and not hidden at every one of 61 Tab stops; axe 0 serious/critical on all 12 screens; no sideways scrolling |
| A3 | `tests/keyboard.spec.mjs`, `tests/journey.spec.mjs` | Keyboard-only sign-up; skip link; menu with Escape; the gate task by keyboard in English and Amharic |
| A4 | `tests/design.spec.mjs` | Contrast of every colour pair in normal and high-contrast modes; focus outline ≥ 3:1; base text size |
| A5 | `tests/wcag.spec.mjs` | 1.4.12 text spacing, 1.3.4 landscape, 2.5.8 target size, 2.4.2 titles, 3.2.3 navigation order, 3.2.6 help position, 1.3.5 input purpose, 2.2.1 no time-out |
| A6 | `tests/smoke.spec.mjs`, `tests/engine.spec.mjs` | Error summary and field errors, check your answers and change, autosave and resume, progress |
| A7 | `tests/voice.spec.mjs`, `tests/readaloud.spec.mjs`, `tests/names.spec.mjs`, `tests/summaries.spec.mjs`, `tests/readback.spec.mjs` | Voice consent and review, nothing used before checking; recording start and "I heard" announced, focus on Stop and then on the editable transcript; read aloud with pause/stop/Escape; page summaries first in `<main>`; automatic reading only after the learner interacts, "Turn off automatic reading" remembered, Escape stops, no errors when sound is blocked; audio never required |
| A8 | `tests/identity.spec.mjs`, `tests/career.spec.mjs` | ID badges in option names; private card; job board headings, links and announced count |
| A9 | `tests/offline.spec.mjs`, `tests/security.spec.mjs` | Offline message as a status; security headers; no third-party requests |

## 2. Judging gate (`CLAUDE.md` §11)

Main task (confirmed): **sign up for Savanna and save a Support Passport.**

| Gate | Expected | Automated dry run (A2) | Manual result (co-designer, unaided) | Evidence |
|---|---|---|---|---|
| With **NVDA** | Completes without help | — (needs a person) | _to fill in_ | |
| With **TalkBack** (incl. Android WebView) | Completes without help | — (needs a person) | _to fill in_ | |
| **Keyboard only** | Completes without help | Completes; focus visible and not hidden at all 61 Tab stops (phone and desktop) | _to fill in_ | A2 |
| **200% zoom** | Completes without help | Completes at 640×400 CSS px (1280×800 at 200%) and with 200% text on a phone | _to fill in_ | A2 |
| **Sound off** | Completes without help | Completes with no speech and no audio at all | _to fill in_ | A2, A7 |
| **axe-core**: 0 critical, 0 serious | 0 | **0** on 192 scans and on every gate screen | n/a | A1, A2 |
| Conformance report submitted | This file, completed | Automated part done | _manual part to fill in_ | |

## 2a. The 21 October co-design findings

| Finding | How the module addresses it | Related criteria | Evidence |
|---|---|---|---|
| Forms timed out | No time limits; answers saved on the device after every question; "Finish later" | 2.2.1 | A5 (no time-out after 3 hours), A6 (autosave, resume); co-designers to confirm |
| Refugees were asked for ID they don't have | **Sign-up asks no ID** (since 15 Nov). "Add your ID (optional)" is on My profile and the dashboard, whenever the learner wants: six ID routes incl. refugee ID / proof of registration and "refer me through a partner"; ID number optional and typed, never spoken; no ID photo; honest badges, never "verified" | 3.3.2 | A8, journey tests |
| Help was English only | All text in Amharic, English and Afaan Oromo (drafts for review); Language in the header of every page; help in the same place on every question, with its own Listen button; page summaries in all three languages; screen-reader tip in all three | 3.1.1, 3.1.2, 3.2.6 | A1 (language of parts), A5 (help position); Amharic review pending; see NVDA limitation |
| Job boards broke under screen readers | Job titles as headings, named "Apply" links, count announced, native checkbox filter | 1.3.1, 2.4.4, 2.4.6, 4.1.3 | A1, A8; NVDA and TalkBack to do |

## 3. Test environments

| Assistive technology / setting | Browser / device | Version | Tested by | Date |
|---|---|---|---|---|
| axe-core 4.14 (automated) | Playwright 1.65, Chromium, Pixel 5 and desktop profiles | | Automated | 14 Nov 2026 |
| Keyboard only, 200% zoom, sound off (automated dry run) | Chromium, phone and desktop | | Automated | 14 Nov 2026 |
| Slow 3G + 4× slower CPU (automated) | Chromium, Moto G4 profile, live site | | Automated | 14 Nov 2026 |
| NVDA | Windows, default voice | | Team | 14 Nov 2026 (first finding, see §5) |
| TalkBack | _Android WebView inside Telegram, cheapest Android phone_ | | | |
| Keyboard only (person) | | | | |
| Zoom 200% / 400% (person) | | | | |
| Sound off (person) | | | | |
| High contrast / forced colours (person) | | | | |
| Cheapest Android phone, 3G, flight mode after one visit | | | | |

## 4. Success criteria

Columns: **Automated evidence** (what the checks show) · **Automated result** · **Manual check needed** (what a person
must confirm) · **Manual result** (team: NVDA / TalkBack / co-designer; Supports, Partially supports or Does not
support, with who and when) · **Notes / limitations**.

### Principle 1 — Perceivable

| SC | Name | Level | Automated evidence | Automated result | Manual check needed | Manual result | Notes / limitations |
|---|---|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | A1: axe image-alt, button-name, link-name; icons `aria-hidden` beside text; no logo (the module is for any organisation) | Automated: no failures | Screen reader: no unlabelled images or icons | _to fill in_ | |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | Every recording has the same words on screen (the script is generated from the screen text, `docs/audio-script.md`) | Automated: no failures | Listen to recordings, compare with the screen | _to fill in_ | Recordings are being made on 14 Nov |
| 1.2.2 | Captions (Prerecorded) | A | No video in scope | Not applicable | — | — | |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | No video in scope | Not applicable | — | — | |
| 1.2.4 | Captions (Live) | AA | No live media | Not applicable | — | — | |
| 1.2.5 | Audio Description (Prerecorded) | AA | No video in scope | Not applicable | — | — | |
| 1.3.1 | Info and Relationships | A | A1: headings, landmarks, lists, labels, fieldset/legend for choices (axe + structure checks) | Automated: no failures | NVDA H/D/F and TalkBack: structure makes sense | _to fill in_ | |
| 1.3.2 | Meaningful Sequence | A | A2: Tab order follows the visual order through the whole task; tip read before the first answer (A8) | Automated: no failures | Screen reader reading order | _to fill in_ | |
| 1.3.3 | Sensory Characteristics | A | Content review: instructions never rely on shape, colour, position or sound | Automated: no failures (review) | Confirm by reading | _to fill in_ | |
| 1.3.4 | Orientation | AA | A5: landscape phone, no sideways scrolling | Automated: no failures | Rotate a real phone | _to fill in_ | |
| 1.3.5 | Identify Input Purpose | AA | A5: `autocomplete` nickname / name / tel; `type="tel"` | Automated: no failures | — | _to fill in_ | |
| 1.4.1 | Use of Color | A | A1 axe; selected options also have a thicker border and bold text; errors have text | Automated: no failures | High contrast and greyscale check | _to fill in_ | |
| 1.4.2 | Audio Control | A | A7. Nothing plays by itself on a first visit: the first control after the skip link is "Tap anywhere or press any key to hear this page", and browsers' autoplay rules are respected: on a new page the summary is tried at once only when automatic reading is on and the learner has already interacted with the site in this session, and if the browser blocks it (play promise rejected, or speech "not allowed") the prompt is shown instead, with no error. A summary can last longer than 3 seconds, so 1.4.2 is met by these controls: **while any audio plays, "Now reading… Pause · Stop" is pinned to the bottom of the page** (announced politely; the same bar for page summaries and questions); **Escape stops the sound at once**; **"Automatic reading" is one on/off switch** in the header's Accessibility panel (and in Settings) and is remembered. Tab never starts the audio. The bar never covers the focused control: the page gets bottom padding while it shows (2.4.11) | Automated: no failures | With NVDA and TalkBack running: our audio does not cover the screen reader, and the off switch is easy to find | _to fill in_ | |
| 1.4.3 | Contrast (Minimum) | AA | A4: all text pairs ≥ 4.5:1 in normal and high contrast; A1 axe color-contrast | Automated: no failures | — | _to fill in_ | |
| 1.4.4 | Resize Text | AA | A2: 200% zoom and 200% text; A1: extra-large text setting | Automated: no failures | Browser zoom and phone font size by a person | _to fill in_ | |
| 1.4.5 | Images of Text | AA | No images of text | Automated: no failures (review) | — | _to fill in_ | |
| 1.4.10 | Reflow | AA | A1: no sideways scrolling at 320 CSS px on every screen; A2 at 640 px | Automated: no failures | 400% zoom on a desktop browser | _to fill in_ | |
| 1.4.11 | Non-text Contrast | AA | A4: control borders 4.10:1, focus outline ≥ 3:1, selected border | Automated: no failures | — | _to fill in_ | |
| 1.4.12 | Text Spacing | AA | A5: WCAG spacing applied; no sideways scrolling, no clipped text | Automated: no failures | — | _to fill in_ | |
| 1.4.13 | Content on Hover or Focus | AA | No tooltips or hover pop-ups; help and voice panels are opened by a button and stay | Automated: no failures (review) | — | _to fill in_ | |

### Principle 2 — Operable

| SC | Name | Level | Automated evidence | Automated result | Manual check needed | Manual result | Notes / limitations |
|---|---|---|---|---|---|---|---|
| 2.1.1 | Keyboard | A | A2, A3: the whole gate task and sign-up by keyboard; arrow keys in choice groups | Automated: no failures | Keyboard-only person; NVDA keys | _to fill in_ | |
| 2.1.2 | No Keyboard Trap | A | A2: Tab moves through every page and back to the start | Automated: no failures | — | _to fill in_ | |
| 2.1.4 | Character Key Shortcuts | A | No single-key shortcuts. Escape stops audio and closes panels. On a page showing "Tap anywhere or press any key to hear this page", the first key press (not Tab) starts reading; this can be turned off ("Automatic reading" off in the Accessibility panel or Settings) | Automated: no failures (review) | — | _to fill in_ | |
| 2.2.1 | Timing Adjustable | A | A5: an answer after 3 hours is accepted; no time limits anywhere | Automated: no failures | — | _to fill in_ | Simulated log-in code has no expiry |
| 2.2.2 | Pause, Stop, Hide | A | A7: audio can be paused and stopped from the bottom playback bar or with Escape; nothing moves or updates on its own | Automated: no failures | — | _to fill in_ | |
| 2.3.1 | Three Flashes or Below Threshold | A | No flashing or animation; reduced motion respected | Automated: no failures (review) | — | _to fill in_ | |
| 2.4.1 | Bypass Blocks | A | A3: "Skip to main content" is the first link and works; landmarks (A1) | Automated: no failures | — | _to fill in_ | |
| 2.4.2 | Page Titled | A | A5: every Savanna page has its own title "… \| Savanna" | Automated: no failures | — | _to fill in_ | |
| 2.4.3 | Focus Order | A | A2: logical order; focus moves to the question or the error summary on each screen | Automated: no failures | Screen reader | _to fill in_ | |
| 2.4.4 | Link Purpose (In Context) | A | A1 axe; "Apply" and "Listen" include the job title in their names (A8) | Automated: no failures | NVDA links list | _to fill in_ | |
| 2.4.5 | Multiple Ways | AA | Header (Home, account menu), sidebar menu (Menu on phones), dashboard cards and links between steps | Automated: no failures (review) | — | _to fill in_ | |
| 2.4.6 | Headings and Labels | AA | A1: one h1 per screen (the question); labels on every field | Automated: no failures | NVDA H list | _to fill in_ | |
| 2.4.7 | Focus Visible | AA | A2: visible outline at all 61 Tab stops (phone and desktop, 200% zoom); A3 | Automated: no failures | — | _to fill in_ | Found and fixed in Phase 9: Savanna's Bootstrap hid our outline on buttons and sidebar links |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | A2: every focused item fully on screen and not hidden under the sticky header; A7: the bottom playback bar never covers the focused control (bottom padding and scroll padding while it shows) | Automated: no failures | — | _to fill in_ | |
| 2.5.1 | Pointer Gestures | A | No multi-point or path gestures | Automated: no failures (review) | — | _to fill in_ | |
| 2.5.2 | Pointer Cancellation | A | Native buttons and links (action on release) | Automated: no failures (review) | — | _to fill in_ | |
| 2.5.3 | Label in Name | A | Accessible names start with the visible label ("Listen: …", "Apply …"), by design and checked in A7 and A8 (axe's label-in-name rule is experimental and not in our rule set) | Automated: no failures | Voice control (if available) | _to fill in_ | |
| 2.5.4 | Motion Actuation | A | Nothing uses shaking or tilting | Automated: no failures (review) | — | _to fill in_ | |
| 2.5.7 | Dragging Movements | AA | No dragging | Automated: no failures (review) | — | _to fill in_ | |
| 2.5.8 | Target Size (Minimum) | AA | A5: every control ≥ 24×24 px (most 44–56 px high); inline text links exempt | Automated: no failures | — | _to fill in_ | |

### Principle 3 — Understandable

| SC | Name | Level | Automated evidence | Automated result | Manual check needed | Manual result | Notes / limitations |
|---|---|---|---|---|---|---|---|
| 3.1.1 | Language of Page | A | A1: `<html lang>` follows the chosen language | Automated: no failures | — | _to fill in_ | |
| 3.1.2 | Language of Parts | AA | A1: every Amharic or English part marked with `lang` | Automated: no failures | NVDA / TalkBack switch voice | _to fill in_ | **Known limitation:** NVDA's default Windows voice spells Amharic letter by letter even though `lang="am"` is correct (§5). Amharic is an AI draft pending native review |
| 3.2.1 | On Focus | A | Focus never changes the page or submits | Automated: no failures (review) | — | _to fill in_ | |
| 3.2.2 | On Input | A | Choosing an option never moves on by itself; Continue is always a separate step. In Settings, choosing a language or text size applies at once (announced as "Saved"), which is expected for settings | Automated: no failures | Confirm the Settings behaviour is not surprising | _to fill in_ | |
| 3.2.3 | Consistent Navigation | AA | A5: same menu, same order, on every page; one header bar in the same order on every page (journey tests) | Automated: no failures | — | _to fill in_ | |
| 3.2.4 | Consistent Identification | AA | Same names for the same functions everywhere (Continue, Change, Get help, Listen to the question, Read all my answers, Pause, Stop) | Automated: no failures (review) | — | _to fill in_ | |
| 3.2.6 | Consistent Help | A | A5: "Get help" in the same place on every question; Accessibility and Language in the same place in the header on every page | Automated: no failures | — | _to fill in_ | |
| 3.3.1 | Error Identification | A | A6: error summary with link, field error text, `aria-invalid`, `aria-describedby` | Automated: no failures | Screen reader hears the error | _to fill in_ | |
| 3.3.2 | Labels or Instructions | A | Every field has a visible label and hint where needed (A1 axe label) | Automated: no failures | — | _to fill in_ | |
| 3.3.3 | Error Suggestion | AA | A6: errors say how to fix (phone format, letters only, date range) | Automated: no failures | — | _to fill in_ | |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | A6: "Check your answers" with Change before every submit; consent required | Automated: no failures | — | _to fill in_ | |
| 3.3.7 | Redundant Entry | A | A8, journey tests: application, profile and "Add your ID" prefilled from earlier answers | Automated: no failures | — | _to fill in_ | |
| 3.3.8 | Accessible Authentication (Minimum) | AA | Journey test: simulated log-in has no password to remember and no puzzle; the code can be pasted or filled in by the phone; no time limit | Automated: no failures | — | _to fill in_ | The log-in is simulated; Savanna's real sign-in must meet this too |

### Principle 4 — Robust

| SC | Name | Level | Automated evidence | Automated result | Manual check needed | Manual result | Notes / limitations |
|---|---|---|---|---|---|---|---|
| 4.1.2 | Name, Role, Value | A | A1 axe (aria, button-name, label); toggles expose `aria-pressed` / `aria-expanded` (A7, A8, journey) | Automated: no failures | NVDA / TalkBack announce states | _to fill in_ | |
| 4.1.3 | Status Messages | AA | Saved, welcome back, job count, offline, voice ("Recording…", "I heard…"), sharing and download messages in `role="status"`; "Now reading…" announced politely (A6–A9) | Automated: no failures | Screen reader hears them | _to fill in_ | |

## 5. Known limitations

- **Screen readers and Amharic (manual test, 14 Nov).** NVDA on Windows with its default voice reads Amharic
  text letter by letter ("Amharic letter …") instead of speaking it. The module marks the language correctly
  (`lang="am"`); the screen reader's voice has no Amharic. This affects blind Amharic learners. Mitigations in the
  module: (1) recorded Amharic audio for every question and answer, played by "Listen" (read aloud); (2) a one-tap
  switch to English on every screen; (3) correct language tags, so a screen reader with an Amharic voice switches to
  it; (4) a tip on the welcome screen, before the first question, and in Help, in English and Amharic: "If your screen
  reader spells Amharic letters one by one, turn on Automatic reading (under Accessibility) to hear recorded Amharic, or switch to English."
  Still to check: TalkBack on Android (Google's speech service has Amharic on some phones).
- **Amharic text is an AI draft** until a native speaker reviews it.
- **Addis AI speech** (voice answers and reading aloud in Amharic and Afaan Oromo, through the demo's optional proxy)
  is checked on the live site (16 Nov) and in mocked tests; real recognition quality for Ethiopian names and accents is not yet tested
  with learners. Without a key, credit or connection it falls back to the browser's speech with a plain message.
- **Amharic audio is synthetic.** Demo Amharic audio was generated with Microsoft's Amharic neural voice (edge-tts, an unofficial tool) from our reviewed text. It will be replaced with human recordings, or Microsoft's official Azure service, in the hardening sprint. Afaan Oromo has no Microsoft voice: it is text only, plus the phone's
  voice if it has one.
- **Page summaries and automatic reading** cover every Savanna page and form step, in English with Amharic and Afaan
  Oromo drafts (inventory in `DEVELOPMENT_PROGRESS.md`). Gap: Settings has no per-setting Listen
  (the page summary is read). Browsers allow sound only after an interaction with each new page; then the
  prompt "Tap anywhere or press any key to hear this page" is shown.
- **Phone and ID numbers are read on the phone only** (recorded Amharic numbers, otherwise a voice on the phone);
  every fixed text is pre-recorded in Amharic and Afaan Oromo (754 clips), so reading never depends on a live service.
- **Voice input** depends on the browser's speech service (cloud, with consent); it is optional and never required.
- **Simulated parts** (log-in, SMS, trainer and employer systems) are out of scope for conformance but are built to
  the same standard.
- **Not yet tested by people:** everything in the "Manual result" column; forced-colours mode on Windows; real
  phones on 3G.

## 6. Evidence index

| ID | What | Where |
|---|---|---|
| E1 | Automated test run (Playwright + axe-core), A1–A9 | `savanna-onboarding/tests/`, results in `DEVELOPMENT_PROGRESS.md` (Phase 9) |
| E2 | NVDA session notes | `DEVELOPMENT_PROGRESS.md`, "Manual test results from the team" |
| E3 | TalkBack session notes | _to add_ |
| E4 | Co-designer gate session | _to add_ |
| E5 | Slow 3G cheap-phone measurement | `node tools/perf-3g.cjs`; results in `DEVELOPMENT_PROGRESS.md` (Phase 9) |
