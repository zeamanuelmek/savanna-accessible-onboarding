# Dimts (ድምፅ): accessible onboarding prototype

Track 1 starting point for the Accessibility Hackathon 2026 (ALX Ethiopia / Digital Bridge).

Dimts is one accessible form engine, packaged as a web component, that runs four forms:

| Form | What it does |
| --- | --- |
| `signup` | Sign-up with any ID or none (Fayda, kebele, passport, refugee ID, other, "refer me" through a partner), partner-assisted mode with learner consent, Ethiopian-calendar date of birth |
| `passport` | Support Passport: "What would help you?", never a diagnosis. Stays on the device; the learner chooses who sees it |
| `employer` | Employers tick the support a job offers, from the same list. Output as schema.org `JobPosting` |
| `apply` | Job application prefilled from the profile (no asking twice), voice answers, opt-in sharing of the Support Passport |

The jobs page filters by the learner's support needs **on the device**, so the job board never sees them.

## Run it

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Add it to any site (Savanna, a job board)

```html
<script src="dimts.js" defer></script>
<script src="forms.js" defer></script>
<dimts-form form="signup" lang="am"></dimts-form>
<script>
  document.addEventListener('dimts:complete', e => {
    // e.detail = { form, instance, lang, answers } -> send to your own API
  });
</script>
```

## What is built in

- Welcome screen: the learner chooses how to answer (read and type, listen, speak, or simple steps with pictures). Turn it on with `<dimts-form form="signup" welcome>`
- Settings (`<dimts-settings>`): language, text size, contrast, how I answer, read-aloud. Saved once and applied everywhere the component is used on that phone

- One question per screen; the question is the page heading and focus moves to it on every screen
- No time limits; answers saved after every question; "Finish later" resume link (SMS preview)
- Read-aloud for every question (pre-recorded clip if provided via `audio`, else the device voice)
- Voice answers (Amharic `am-ET` / English) with "I heard… / Yes / Say it again / Type it instead", behind a consent screen
- Plain error messages + error summary, "Check your answers" with change links
- "Read everything to me" easy mode with large picture answers
- Amharic / English switch; Ethiopian calendar with Gregorian conversion
- axe-core: 0 critical or serious issues on all screens tested; no horizontal scroll at 320px (≈ 400% zoom)

## Files

- `dimts.js`: the engine (web component, no dependencies)
- `forms.js`: the four form recipes (plain data)
- `index.html`, `app.js`, `app.css`: demo host page standing in for Savanna / a job platform

## Next steps

1. Native speaker reviews all Amharic text
2. Record Amharic + English audio for every prompt and add `audio` paths
3. REST API (OpenAPI) + Docker Compose for the judges' one-hour install
4. Real SMS provider (AfroMessage / GeezSMS / SMSEthiopia) behind a pluggable interface
5. Partner console for AAAPD-style organisations
6. Test with co-designers using TalkBack and NVDA; write the WCAG 2.2 AA conformance report
