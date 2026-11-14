# Savanna Accessible Onboarding Module

Live demo (developer and test page): https://savanna-accessible-onboarding.vercel.app

A reusable onboarding and learner-profile **module** for the Savanna learning platform, built for the Digital Bridge
Accessibility Hackathon 2026 (ALX Ethiopia), Track 1. It is not a website or an LMS. It is a web component that
Savanna or any other site can add with a script tag.

**Access without disclosure:** learners choose how they want to interact (read-aloud, voice, larger text, simple
mode) without ever stating or proving a disability.

**One form engine, many journeys:**

| Form | What it does |
| --- | --- |
| `signup` | Sign-up with any ID or none (Fayda, kebele ID, passport, refugee ID, another document, or "refer me" through a partner). Includes a partner-assisted route with learner consent, and an Ethiopian-calendar date of birth |
| `passport` | Support Passport: "What would help you?", never a diagnosis. Stays on the device |
| `employer` | Employers tick the support a job offers, from the same list. Output as schema.org `JobPosting` |
| `apply` | Job application prefilled from the profile (no asking twice), with opt-in sharing of the Support Passport |
| `profile` | Profile update: opens on a summary of the learner's details, prefilled; "Change" only what needs updating |

## How we address the 21 October co-design findings

| What co-designers found | What this module does |
|---|---|
| **Forms timed out** | There are no time limits anywhere. Answers are saved on the phone after every question, and "Finish later" gives a link to continue on the same phone. |
| **Refugees were asked for ID they don't have** | Six ID routes: Fayda, kebele ID, passport, refugee ID or proof of registration (RRS / UNHCR), another document, or "I have none of these, refer me through a partner". The ID number is optional, nobody is asked for a photo of their ID, and learning can start without any ID. IDs are never claimed to be verified. |
| **Help was English only** | Every question, hint, error and help panel is in Amharic and English (the Amharic is a draft for native-speaker review). A language switch and "Get help" are in the same place on every screen. |
| **Job boards broke under screen readers** | Job titles are headings, every "Apply" link names its job, the number of jobs is announced on load and after filtering, and the filter is a normal checkbox. Tested automatically; NVDA and TalkBack checks by a person are still to do. |

## What is real and what is not

| Feature | Status |
|---|---|
| One question per screen, error summary, check your answers, autosave, Ethiopian calendar | implemented |
| Savanna look: Poppins, navy text, Savanna red actions, Noto Sans Ethiopic for Amharic | implemented (Phase 1) |
| Text size, high contrast, language settings | implemented |
| Read-aloud | partial: uses the device voice; most phones have no Amharic voice; no recorded audio yet |
| Voice answers | partial: needs a browser with a speech engine (Chrome on Android, desktop Chrome) and a connection; audio goes to Google, so consent is asked first and can be withdrawn in Settings. **What you said is shown for checking and fixing, and never kept until you choose "Use this answer".** Never offered on ID or support-needs questions, or on the date. Clear fallback when unavailable. Not yet tested with a real microphone in Amharic |
| "Finish later" SMS | **simulated**: a labelled preview, no SMS is sent |
| ID verification | unavailable: IDs are never verified |
| Amharic text | AI draft: needs native-speaker review |
| Backend / API | unavailable by design: the module sends nothing; the host page decides where data goes. Data and events: [`docs/api-schema.md`](docs/api-schema.md) |
| Offline | partial: answers are saved on the phone; opening the page with no connection comes in Phase 6. See [`docs/offline-plan.md`](docs/offline-plan.md) |

## Run the demo

No build step. Serve this folder with any static server:

```bash
cd savanna-onboarding
python -m http.server 8080        # or: node tests/static-server.mjs  (port 4173)
# open http://localhost:8080
```

## Add it to a site

```html
<script src="savanna-onboarding.js" defer></script>
<script src="forms.js" defer></script>
<savanna-onboarding-form form="signup" lang="am"></savanna-onboarding-form>
<script>
  document.addEventListener('savanna-onboarding:complete', e => {
    // e.detail = { form, instance, lang, answers } -> send to your own API (schemas: docs/api-schema.md)
  });
</script>
```

Full guide: [`docs/for-developers.md`](docs/for-developers.md). The old names (`dimts.js`, `<dimts-form>`,
`window.Dimts`, `dimts:*` events) still work as deprecated aliases.

## Keyboard and screen-reader (ARIA) support

**Keyboard**

- Everything works with the keyboard alone: `Tab` / `Shift+Tab` to move, `Space` to choose an option, arrow keys
  inside a group of single choices, `Enter` to continue.
- Every control shows a 3px navy focus outline (at least 3:1 contrast), and focus is never hidden behind other content.
- The demo page starts with a "Skip to main content" link. On small screens the menu button opens with `Enter` or
  `Space`, and `Escape` closes it and returns focus to the button.
- There are no keyboard traps and no time limits.

**Focus management**

- On every new question, focus moves to the question, which is the page's only `<h1>`.
- After an error, focus moves to the "There is a problem" summary. Its link takes you to the field.
- After "Change" on the check-your-answers screen, you return to that question, and then back to the summary.

**Names, roles and states**

- Only real `<button>` and `<a>` elements act as controls. Every icon is decorative (`aria-hidden`) and sits next to
  visible text, so every button has a spoken name.
- Single and multiple choices are native radio buttons and checkboxes inside a `<fieldset>`, with the question as
  the `<legend>`.
- Toggles report their state (`aria-pressed` on "Read aloud", `aria-expanded` on "Get help" and the menu).
- Errors: the field gets `aria-invalid="true"` and is linked to its error message and hint with `aria-describedby`.
- Progress ("Question 2 of 6") is plain text. The visual bar is hidden from screen readers.
- Status messages ("Saved", "Welcome back", the number of jobs shown) are announced through a polite `role="status"` live region.
- Pop-ups are inline panels (help, voice consent), so there is nothing to trap focus in.

**Structure and language**

- The module never adds a `<main>` landmark of its own; the host page keeps its single `<main>`. Headings never skip
  a level.
- The page and every Amharic or English part declare their language (`lang="am"` / `lang="en"`), so screen readers
  switch voice.

**Learner settings:** text size (16 / 20 / 24px base, and never smaller inside Savanna's 14px pages), high contrast,
language, how I like to answer, read aloud. Settings are saved on the device and apply everywhere the module appears.

**What has been tested:**

- **Automated (Playwright + axe-core):** axe-core with zero serious or critical issues; keyboard-only sign-up; focus
  outline contrast; no sideways scrolling at 320px (= 400% zoom); one `<main>`; heading order; language of parts.
- **Not yet tested by a person:** NVDA, TalkBack inside an Android WebView. Until those are done, the module makes no
  claim of WCAG 2.2 AA conformance.

## Tests

```bash
cd savanna-onboarding
npm install
npx playwright install chromium                     # first time only
npx playwright test --workers=1 --project=mobile    # phone size
npx playwright test --workers=1 --project=desktop   # desktop size
```

The Savanna reference pages are read from `../../Savanna-static-pages` (or set `REFERENCE_DIR`). The reference
audit test is skipped if they are not there.

## Files

- `savanna-onboarding.js`: the engine (web component, design tokens, no dependencies)
- `forms.js`: the five form recipes (plain data)
- `assets/fonts/`: Poppins and Noto Sans Ethiopic (SIL Open Font Licence, licence files included)
- `index.html`, `app.js`, `app.css`: demo host page standing in for Savanna or a job platform
- `docs/`: developer guide, data and events (`api-schema.md`), offline plan, conformance report
- `tests/`: Playwright + axe-core tests
- Design tokens and their sources: [`../DESIGN_TOKENS.md`](../DESIGN_TOKENS.md). Progress: [`../DEVELOPMENT_PROGRESS.md`](../DEVELOPMENT_PROGRESS.md)
