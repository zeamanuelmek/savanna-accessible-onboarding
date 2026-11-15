# For developers: add the Savanna Accessible Onboarding Module to a site

The step-by-step install guide (under an hour) is in [`../README.md`](../README.md). This page is the reference.
The test host page (`/test-host/`) proves the module works on any site using only what is described here.

The module is a framework-free web component. It works inside Savanna (server-rendered pages, Bootstrap, React
islands) and on any other site, such as a job board.

> **Integration:** Level 1 (script tag) + Level 3 (schema.org `JobPosting`). There is no REST API and no endpoint.
> Amharic text is an AI draft awaiting native-speaker review.

## 1. Install with a script tag

```html
<script src="https://YOUR-HOST/savanna-onboarding.js" defer></script>
<script src="https://YOUR-HOST/forms.js" defer></script>

<savanna-onboarding-form form="signup"></savanna-onboarding-form>
```

- Keep the `assets/fonts/` folder next to `savanna-onboarding.js`. The script finds the fonts relative to its own
  address.
- Built-in forms: `signup`, `profile`, `takeover`, `passport`, `employer`, `apply`.
- Add `lang="en"` or `lang="am"` to choose the starting language, and `welcome` to show the "how would you like to
  answer?" screen first.
- Settings panel: `<savanna-onboarding-settings></savanna-onboarding-settings>`.
- Host page with its own `<h1>`: add `heading-level="2"` so the question becomes an `<h2>` (all module headings move down).

### 1a. Or mount it from JavaScript

```js
var handle = SavannaOnboarding.mount('#where', {
  form: 'signup',            // or settings: true for the settings panel
  lang: 'am',                // optional: otherwise the learner's saved language
  instance: 'job-42',        // optional: a separate draft per instance
  welcome: true,             // optional: "how would you like to answer?" first
  headingLevel: 2,           // optional: when your page has its own <h1>
  focus: true,               // optional: move focus to the question (default)
  onComplete: function (detail, doneSlot) { /* save detail.answers; put your next steps into doneSlot */ }
});
handle.unmount();            // or SavannaOnboarding.unmount('#where')
```

- Mounting into the same element again replaces the form; it never adds a second one.
- Unmounting stops any speech and listeners. The learner's draft stays saved on the device, so mounting again resumes it.
- A wrong selector throws `[savanna-onboarding] mount: no element matches …`.

## 2. Listen for the result

```js
document.addEventListener('savanna-onboarding:complete', function (e) {
  // e.detail = { form, instance, lang, answers }. Exact schemas: docs/api-schema.md
  // Send it to your own API here. The module itself sends nothing anywhere.
});
```

Other events: `savanna-onboarding:prefs` (learner changed a setting; `detail` = the settings) and
`savanna-onboarding:ready` (the script has loaded).

## 3. Make your own form

```js
SavannaOnboarding.register('my-form', {
  fields: [
    { id: 'name', type: 'text', label: { en: 'What is your name?', am: 'ስምዎ ማን ነው?' } },
    { id: 'needs', type: 'multi', options: 'NEEDS', optional: true,
      label: { en: 'What would help you?', am: 'ምን ይረዳዎታል?' },
      audio: { am: '/audio/needs-am.mp3' } }   // optional pre-recorded clip
  ],
  doneTitle: { en: 'Thank you', am: 'እናመሰግናለን' }
});
```

- **Field types:** `text`, `tel`, `email`, `textarea`, `choice`, `multi`, `consent`, `ethdate` (Ethiopian calendar,
  stored with the Gregorian date).
- **Field options:** `optional`, `hint`, `body`, `showIf`, `prefill`, `default`, `voice: false`, `reviewLabel`, `reviewHide`, `audio`, `validate`.
  - Any text (label, hint, body, review texts) can be `{ en, am }` or a function `(lang) => text`, for wording that uses
    the learner's own data (for example the takeover screen names who helped).
  - `default`: an answer chosen in advance when there is none yet, for a privacy-first choice (the Support Passport
    starts as "Only me"). It is not marked as "filled in from your profile".
  - Option `badge`: a short status shown on the option (and in "Check your answers"), for example the honest ID trust
    status. It is visible text, so screen readers read it as part of the option.
  - `sensitive: true`: support needs and ID questions. Voice input is never offered on them, so the answer never goes to a
    cloud speech service.
  - `clearIfChanged: 'fieldId'`: throw this answer away when that field's answer changes (an ID number belongs to one ID type).
    After "Change" on the summary, the learner is asked the emptied or newly opened question before returning.
- **Form options:** `startAt: 'review'` (open on the summary, for "update my details"), `reviewTitle`, `reviewHint`,
  `reviewNote`, `submitLabel`, `doneTitle`, `doneText`, `help`, `allowLater`, `welcome`.
- Answers to questions that are no longer shown (an abandoned route) are deleted from the draft and never sent.
- Several forms can be on one page: every id inside a form is prefixed with that form's own id.

## 3a. Identity and private support (Phase 5)

- **Trust status, never "verified":** `SavannaOnboarding.TRUST` (badge texts) and `trustLevel(answers)` →
  `self_declared`, `document_number_recorded` or `partner_referral_pending`.
- **Employer sharing:** `SavannaOnboarding.supportForEmployer(applyAnswers)` returns the Support Passport needs only
  when the learner said "share" for that application. Never the learner's own words, never a reason.
- **Learner takeover:** the `takeover` form opens on a summary of what the partner entered; the learner checks it
  alone and confirms. The host then removes the staff name (the demo keeps only the organisation).

## 3a-2. How the engine is organised

One file, `savanna-onboarding.js`, in clear layers:

| Layer | What it does |
|---|---|
| Storage adapter (`store`) | Everything kept on the device, under keys starting `savanna-onboarding.`. Replace it with `SavannaOnboarding.setStorage({ getItem, setItem, removeItem, keys })` |
| Config | The form registry (`register`), `showIf`, `validate` |
| State (`SavannaOnboarding.FormState`) | One form's answers, position, pruning, prefill, saving. No page elements, so it can be tested on its own |
| Presentation (`View`) | Turns the state into HTML |
| Component | Reads the page, updates the state, asks the view to draw |

## 3b. Voice input and the speech adapter

- **Never saved unchecked.** After the learner speaks, the module shows "I heard: …" with the words in an editable box
  (or, for a choice, the option it matched). Nothing goes into the answer until they choose **Use this answer**, and,
  like typing, it is saved only when they choose **Continue**. **Say it again** and **Type it instead** throw the words
  away. Changing language or leaving the question also throws them away.
- **Consent first.** The first time, the module explains that the browser sends the recording to Google. The learner
  can turn voice answers off (or on) at any time in Settings.
- **Never on sensitive questions** (`sensitive: true`: ID and support needs), and **not on the date question**: the
  Ethiopian date has three parts that browsers recognise badly, so it is typed or chosen (a team decision).
- **Fallbacks:** when the browser has no speech engine (for example inside some apps' WebView), there is no microphone
  button; a learner who chose "Speak my answers" sees a plain note. Blocked microphone, no network, nothing heard, no
  microphone and unsupported language each give a clear message, and typing or tapping always works.
- **Replaceable engine.** All speech goes through one adapter:

```js
SavannaOnboarding.setSpeech({
  input: {
    supported: () => true,
    // call h.result(['best guess', 'other guess']), h.error('network' | 'not-allowed' | 'no-speech' | ...), then h.end()
    start: (lang, h) => { /* start your engine */ return { stop() {}, abort() {} }; }
  },
  output: { speak: (text, lang, audioUrl) => true, stop: () => {} }
});
```

  An engine should keep listening until `stop()` is called: the learner, not a pause, decides when they have finished
  (`stop()` → deliver what was heard → `h.end()`). The default engine does this by restarting the browser's recogniser
  whenever it stops by itself after a silence (Android Chrome does so after about a second), and joining the words.

  The default is the browser's own engine (free; needs a connection; audio goes to Google). **Addis AI** (Amharic speech
  to text and text to speech) is a possible future engine behind this adapter, **not a dependency**.

## 3c. Read aloud and recorded audio (Phase 4)

- **Settings:** `easy` = read aloud (questions read out, a Listen button on every answer); `pictures` = pictures
  and bigger buttons. They are separate. Choosing "Simple steps with pictures" turns both on; "Listen and respond"
  and "Speak my answers" turn on read aloud only; "Read and type" turns both off.
- **Player:** one at a time on the page (`SavannaOnboarding.player`): Listen, Pause/Resume, Stop, Play again;
  Escape stops. A new question is read automatically only when read aloud is on, with Pause and Stop showing at once.
- **Recorded clips:** `assets/audio/<lang>/<name>.mp3` (or `.m4a`), named as in `docs/audio-script.md`:
  `<form>-<field>-question`, `<form>-<field>-option-<value>`, `<form>-check-answers`, `<form>-done`,
  `welcome-question`, `welcome-option-<mode>`, `error-…`, `saved-for-later` (underscores become hyphens).
  A field's own `audio: { am: 'url' }` overrides the name.
- **Manifest:** `assets/audio/manifest.json` lists the clips that exist; `node tools/check-audio.cjs` writes it.
  Only listed clips are requested, so missing clips never cause failed downloads (and work offline once cached).
- **Fallback:** recorded clip → the phone's voice → a status message ("There is no recording for this yet … Everything is
  written on the screen"). A clip that fails to play is marked and the phone's voice reads instead, with a message.
- **Offline download (Settings):** "Download Amharic audio for offline use (about X MB)" stores every listed clip in the
  browser's Cache Storage (`savanna-onboarding-audio`), one at a time with progress; "Remove downloaded audio" deletes
  it (and clips kept on first play). The size comes from `manifest.json` (`bytes`, written by `check-audio.cjs`).
  The player uses a downloaded copy even on sites without a service worker.
- **Screen-reader tip:** the welcome screen and Help show, in English then Amharic: "If your screen reader spells Amharic
  letters one by one, turn on Read aloud to hear recorded Amharic, or switch to English." (NVDA's default voice has no Amharic.)
- **Speech output adapter:** `output.speak(text, lang, audioUrl, done)` must call `done()` when a piece finishes,
  so the player can continue; `pause()` and `resume()` are optional.

## 4. Styling

- **Scoped classes:** all classes start with `dm-`, so nothing clashes with Bootstrap.
- **Design tokens:** colours, font, sizes and radii are CSS custom properties starting with `--so-` (see
  `../../DESIGN_TOKENS.md`). Override any of them on `:root` or on the element.
- **Text size:** the module sets its own base size (`max(1rem, 16px)`), so it does not shrink inside Savanna's 14px
  pages, and it follows the learner's text-size setting.

## 5. Old names (deprecated, still work for now)

| Old | New |
|---|---|
| `dimts.js` | `savanna-onboarding.js` |
| `<dimts-form>`, `<dimts-settings>` | `<savanna-onboarding-form>`, `<savanna-onboarding-settings>` |
| `window.Dimts` | `window.SavannaOnboarding` |
| `dimts:complete`, `dimts:prefs`, `dimts:ready` | `savanna-onboarding:complete`, `…:prefs`, `…:ready` (both are sent) |

Browser storage keys now start with `savanna-onboarding.`. Data saved under the old `dimts.` keys is moved automatically the first time the new script loads.

## Built in

- One question per screen. The question is the page heading, and focus moves to it on every screen.
- No time limits. Answers are saved after every question. "Finish later" shows a resume link with a **simulated** SMS
  preview.
- Read-aloud for every question: a pre-recorded clip when provided, otherwise the device's speech engine.
- Voice answers in Amharic or English, with consent asked first because the browser sends audio to Google. (Known bug:
  an unconfirmed transcript is saved; this is fixed in Phase 3.)
- Plain error messages with an error summary, "Check your answers" with change links, and prefill so people are never
  asked twice.
- Job posts are output as schema.org `JobPosting`, with a `workplaceSupportOffered` property.
