# Savanna Accessible Onboarding Module

A reusable onboarding and learner-profile **module** for the Savanna learning platform, built for the Digital Bridge
Accessibility Hackathon 2026 (ALX Ethiopia), Track 1. It is not a website or an LMS: it is a web component that Savanna
or any other site adds with **two script tags**. No framework, no build step, no server, no paid service.

**Live demo:** https://savanna-accessible-onboarding.vercel.app

| Page | What it is |
|---|---|
| [`/`](https://savanna-accessible-onboarding.vercel.app/) | **The learner journey inside Savanna's own pages** (ALX starter kit): home → sign up → dashboard → profile and Support Passport → jobs and apply → employer form. Log-in is simulated |
| [`/test-host/`](https://savanna-accessible-onboarding.vercel.app/test-host/) | **Test host page**: an ordinary page (not Savanna) that uses only the public API, and shows exactly what the host receives |
| [`/showroom.html`](https://savanna-accessible-onboarding.vercel.app/showroom.html) | Developer and test page (all journeys behind one menu) |

**Access without disclosure:** learners choose how they want to interact (read-aloud, voice, larger text, simple
mode) without ever stating or proving a disability. **Nothing leaves the host without consent:** the module itself
sends nothing over the network.

---

## Install it in under an hour

You need: a terminal, and either **Docker** or **Node.js 18+** (or Python 3). Times are rough guides.

### Step 1 — Run the demo locally (5 minutes)

```bash
git clone https://github.com/zeamanuelmek/savanna-accessible-onboarding.git   # or unzip the submitted copy
cd savanna-accessible-onboarding
docker compose up
```

Open http://localhost:8080 (the Savanna journey), http://localhost:8080/test-host/ and
http://localhost:8080/showroom.html. Stop with `Ctrl+C`. Another port: `PORT=9000 docker compose up`.

**Without Docker:** any static file server works, because these are plain files.

```bash
cd savanna-accessible-onboarding/savanna-onboarding
npx --yes serve -l 8080 .          # or: python -m http.server 8080
```

### Step 2 — Add the module to your own page (15 minutes)

1. Copy these from `savanna-onboarding/` to your site, **keeping them side by side**:
   `savanna-onboarding.js`, `forms.js`, and the folder `assets/fonts/`. (The script finds the fonts next to itself.)
2. Add two script tags and an empty element where the form should appear:

```html
<script src="/path/to/savanna-onboarding.js" defer></script>
<script src="/path/to/forms.js" defer></script>

<div id="onboarding"></div>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    var handle = SavannaOnboarding.mount('#onboarding', {
      form: 'signup',          // signup | passport | profile | takeover | apply | employer
      welcome: true,           // start with "how would you like to answer?"
      headingLevel: 2,         // your page already has an <h1>: the question becomes an <h2>
      onComplete: function (detail, doneSlot) {
        // detail = { form, instance, lang, answers }  (exact JSON Schema: docs/api-schema.md)
        // Send it to YOUR server here, if the learner agreed. The module sends nothing itself.
        doneSlot.innerHTML = '<p><a href="/dashboard">Go to my dashboard</a></p>';
      }
    });
    // later: handle.unmount();   or   SavannaOnboarding.unmount('#onboarding');
  });
</script>
```

3. Open your page. You should see the first question, in the learner's language (Amharic by default).

Prefer plain HTML? `<savanna-onboarding-form form="signup" welcome></savanna-onboarding-form>` works too, and the
same data arrives in the `savanna-onboarding:complete` event (it bubbles to `document`).

### Step 3 — Save the data where you want it (15 minutes)

- **What you receive:** [`docs/api-schema.md`](docs/api-schema.md) has a JSON Schema for every form, plus the
  schema.org `JobPosting` mapping for jobs (integration Level 3). There is **no REST API and no endpoint** to call.
- **Support needs go to an employer only with consent for that application.** Use
  `SavannaOnboarding.supportForEmployer(detail.answers)`: it returns `[]` unless the learner said "share" for that job.
- **Device storage:** drafts and settings are kept in the browser under keys starting `savanna-onboarding.`. To keep
  them elsewhere, plug in your own storage:
  `SavannaOnboarding.setStorage({ getItem, setItem, removeItem, keys })`.
- **Speech engine:** voice input and read-aloud go through one adapter, `SavannaOnboarding.setSpeech({ input, output })`
  (see [`docs/for-developers.md`](docs/for-developers.md)). The default is the browser's own (free) engine.

### Step 4 — Make it look like your site (10 minutes)

All styles are scoped (classes start `dm-`) and every colour, font and size is a CSS custom property starting `--so-`.
Override any of them, for example `:root { --so-primary: #0b6e4f; }`. Values and contrast results:
[`../DESIGN_TOKENS.md`](../DESIGN_TOKENS.md). Learners' own settings (text size, high contrast) keep working.

### Step 5 — Check it (10 minutes)

- Open `/test-host/`: choose a journey, **Mount**, answer it, and read "Events the host received". **Unmount** removes it.
- Keyboard only: `Tab` through a whole sign-up. Then try 200% zoom, and a screen reader if you have one.
- Run the automated tests (optional): see [Tests](#tests).

**If something goes wrong:** no form appears → check the browser console for
`[savanna-onboarding] mount: no element matches …` (wrong selector) or a 404 on the script path. Squares instead of
Amharic letters → the `assets/fonts/` folder is not next to `savanna-onboarding.js`. Voice button missing → that
browser has no speech engine (typing and tapping always work).

### Inside Savanna

The demo's home page shows the module inside Savanna's own pages. Savanna's stylesheets are copied **unchanged** from
the official starter (`vendor/savanna-static-pages/`, see its `VENDOR.md`); our pages add Savanna's header and sidebar
around the module. In our copy of that frame we fixed four accessibility problems we found in the starter, and we
recommend the same fixes to ALX:

| In the starter | In our pages |
|---|---|
| The menu ("hamburger") is a `<div>`, so the keyboard and screen readers cannot use it | A real `<button>` with a visible "Menu" label and `aria-expanded` |
| The logo link has no text | The logo is an image with the alternative text "Savanna home" |
| The sidebar is not a navigation landmark, and the list contains `<hr>` elements | A `<nav aria-label="Savanna">` with a clean list; the current page has `aria-current="page"` |
| Sidebar text and icons are grey `#98a3ae` (2.6:1, below the 4.5:1 minimum) | Navy text and icons |

Also added: a "Skip to main content" link, and focused items never hide under the fixed header.

---

## One form engine, many journeys

| Form | What it does |
| --- | --- |
| `signup` | Sign-up with any ID or none (Fayda, kebele ID, passport, refugee ID, another document, or "refer me" through a partner). Includes a partner-assisted route with learner consent, and an Ethiopian-calendar date of birth |
| `passport` | Support Passport: "What would help you?", never a diagnosis. Private by default. Stays on the device |
| `profile` | Profile update: opens on a summary of the learner's details, prefilled; "Change" only what needs updating |
| `takeover` | After a partner signs a learner up, the learner checks the details alone and takes over the account; the staff name is then removed |
| `apply` | Job application prefilled from the profile (no asking twice), with sharing of the Support Passport only if the learner says yes for that job |
| `employer` | Employers tick the support a job offers, from the same list. Published as schema.org `JobPosting` |

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
| Savanna look: Poppins, navy text, Savanna red actions, Noto Sans Ethiopic for Amharic | implemented |
| The module inside Savanna's own pages (starter kit) | implemented as a demo: Savanna's CSS unchanged, our pages around it |
| Log-in | **simulated**: a labelled demo. No server, no SMS; the code is shown on screen. Meets WCAG 3.3.8: nothing to remember, no puzzle, the code can be pasted or filled in by the phone, no time limit |
| Text size, high contrast, language settings | implemented |
| Read-aloud | implemented: "Listen" on every question and a Listen button on every answer, with Pause/Resume, Stop and Play again; Escape stops it. Plays the recorded Amharic clips named in [`docs/audio-script.md`](docs/audio-script.md) when they exist, otherwise the phone's voice, otherwise a short message that everything is on screen. **The recordings are being made by the team; until they are added, Amharic relies on the phone's voice, which most phones do not have.** Audio is never required |
| Pictures and bigger buttons | implemented: a separate setting from read aloud |
| Voice answers | partial: needs a browser with a speech engine (Chrome on Android, desktop Chrome) and a connection; audio goes to Google, so consent is asked first and can be withdrawn in Settings. **What you said is shown for checking and fixing, and never kept until you choose "Use this answer".** Never offered on ID or support-needs questions, or on the date. Clear fallback when unavailable. Not yet tested with a real microphone in Amharic |
| "Finish later" SMS | **simulated**: a labelled preview, no SMS is sent |
| ID verification | unavailable: IDs are never verified. Each ID choice shows an honest badge ("Self-declared · not verified", "Partner referral pending"); after sign-up the status is "Self-declared", "Number recorded — not verified" or "Partner referral pending" |
| Private Support Passport | implemented on the device: private by default, "who can see this" on the card, trainer sharing can be turned on and off, sharing with an employer only per application (the learner sees exactly what would be shared) and can be withdrawn. **Simulated:** there is no trainer or employer system, so nothing is actually sent; withdrawing changes only the copy on the phone |
| Partner-assisted sign-up | implemented: learner consent, then a handover and learner takeover step |
| Amharic text | AI draft: needs native-speaker review |
| Backend / API | unavailable by design: the module sends nothing; the host page decides where data goes. Data and events: [`docs/api-schema.md`](docs/api-schema.md) |
| Offline (minimum) | implemented and tested in the browser's offline mode: after one visit, the pages, module, fonts and styles open with no connection (`sw.js`); answers are saved on the phone; a clear offline message; recordings are kept once played. **Voice input never works offline.** Not yet tested on a real phone in flight mode. See [`docs/offline-plan.md`](docs/offline-plan.md) |
| Docker Compose | written (`docker compose up`); **not yet run on a machine with Docker** (planned clean-machine check in Phase 10) |

## Keyboard and screen-reader (ARIA) support

**Keyboard**

- Everything works with the keyboard alone: `Tab` / `Shift+Tab` to move, `Space` to choose an option, arrow keys
  inside a group of single choices, `Enter` to continue.
- Every control shows a 3px navy focus outline (at least 3:1 contrast), and focus is never hidden behind other content.
- Every page starts with a "Skip to main content" link. On phones the menu button opens with `Enter` or `Space`, and
  `Escape` closes it and returns focus to the button.
- There are no keyboard traps and no time limits.

**Focus management**

- On every new question, focus moves to the question (the page's `<h1>`, or `<h2>` with `headingLevel: 2`).
- After an error, focus moves to the "There is a problem" summary. Its link takes you to the field.
- After "Change" on the check-your-answers screen, you return to that question, and then back to the summary.

**Names, roles and states**

- Only real `<button>` and `<a>` elements act as controls. Every icon is decorative (`aria-hidden`) and sits next to
  visible text, so every button has a spoken name.
- Single and multiple choices are native radio buttons and checkboxes inside a `<fieldset>`, with the question as
  the `<legend>`. ID trust badges are part of each option's name.
- Toggles report their state (`aria-pressed` on "Read aloud" and the microphone, `aria-expanded` on "Get help" and the menu).
- Each answer's Listen button is a separate button beside the answer (never inside it), named "Listen: <the answer>".
  While audio plays, Pause and Stop appear next to "Listen to the question"; `Escape` also stops it (WCAG 1.4.2).
- Errors: the field gets `aria-invalid="true"` and is linked to its error message and hint with `aria-describedby`.
- Progress ("Question 2 of 7") is plain text. The visual bar is hidden from screen readers.
- Status messages ("Saved", "Welcome back", the number of jobs shown) are announced through a polite `role="status"` live region.
- Pop-ups are inline panels (help, voice consent, "I heard…"), so there is nothing to trap focus in.

**Structure and language**

- The module never adds a `<main>` landmark of its own; the host page keeps its single `<main>`. Headings never skip
  a level (use `headingLevel` when the host has its own `<h1>`).
- The page and every Amharic or English part declare their language (`lang="am"` / `lang="en"`), so screen readers
  switch voice.

**Learner settings:** text size (16 / 20 / 24px base, and never smaller inside Savanna's 14px pages), high contrast,
language, how I like to answer, read aloud, pictures and bigger buttons, voice answers on or off. Settings are saved on the device and apply
everywhere the module appears.

**What has been tested:**

- **Automated (Playwright + axe-core), on phone and desktop sizes, in Amharic and English:** zero serious or critical
  axe issues on every screen, including the Savanna journey pages and the test host page; keyboard-only sign-up and
  the gate task (sign up and save a Support Passport) with the keyboard only; focus outline contrast; no sideways
  scrolling at 320px (= 400% zoom); one `<main>`; heading order; language of parts.
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

- `savanna-onboarding.js`: the module (web component, mount API, design tokens, no dependencies)
- `forms.js`: the six form recipes (plain data)
- `assets/fonts/`: Poppins and Noto Sans Ethiopic (SIL Open Font Licence, licence files included)
- `index.html`, `signup.html`, `dashboard.html`, … and `journey/`: the learner journey inside Savanna's pages
  (pages generated by `tools/journey-pages.cjs`)
- `vendor/savanna-static-pages/`: Savanna's stylesheets, fonts and images from the ALX starter, **unchanged** and
  **not** under this project's licence (`VENDOR.md`; refresh with `node tools/vendor-savanna.cjs`)
- `test-host/`: the test host page
- `showroom.html`, `app.js`, `app.css`: developer and test page; `app.js` also holds the demo views both hosts share
- `docs/`: developer guide, data and events (`api-schema.md`), offline plan, audio script, conformance report
- `tests/`: Playwright + axe-core tests. `tools/`: small generators (not deployed)
- `../docker-compose.yml`, `../docker/nginx.conf`: run everything with `docker compose up`
- Design tokens and their sources: [`../DESIGN_TOKENS.md`](../DESIGN_TOKENS.md). Progress: [`../DEVELOPMENT_PROGRESS.md`](../DEVELOPMENT_PROGRESS.md)
