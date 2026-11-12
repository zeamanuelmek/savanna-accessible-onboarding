# For developers: add the Savanna Accessible Onboarding Module to a site

This page used to sit inside the learner demo. It now lives in the docs so learners never see developer
controls. A separate test host page that proves the module works outside the demo comes in Phase 8.

The module is a framework-free web component. It works inside Savanna (server-rendered pages, Bootstrap, React
islands) and on any other site, such as a job board.

> **Status:** Level 1 (script tag) only. There is no REST API yet. `SavannaOnboarding.mount()` / `unmount()` arrive
> in Phase 8. Amharic text is an AI draft awaiting native-speaker review.

## 1. Install with a script tag

```html
<script src="https://YOUR-HOST/savanna-onboarding.js" defer></script>
<script src="https://YOUR-HOST/forms.js" defer></script>

<savanna-onboarding-form form="signup"></savanna-onboarding-form>
```

- Keep the `assets/fonts/` folder next to `savanna-onboarding.js`. The script finds the fonts relative to its own
  address.
- Built-in forms: `signup`, `passport`, `employer`, `apply`.
- Add `lang="en"` or `lang="am"` to choose the starting language, and `welcome` to show the "how would you like to
  answer?" screen first.
- Settings panel: `<savanna-onboarding-settings></savanna-onboarding-settings>`.

## 2. Listen for the result

```js
document.addEventListener('savanna-onboarding:complete', function (e) {
  // e.detail = { form, instance, lang, answers }
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
- **Field options:** `optional`, `hint`, `showIf`, `prefill`, `voice: false`.

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

Browser storage keys still start with `dimts.`. They will move to the new storage adapter in Phase 2.

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
