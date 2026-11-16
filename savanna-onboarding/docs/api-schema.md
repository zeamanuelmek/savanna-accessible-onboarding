# Data and events the module gives the host

> **Integration level:** Level 1 (script tag) + Level 3 (schema.org `JobPosting`). The module **never requires a
> server, REST API or endpoint**. It sends no answers over the network: it hands data to the host page as browser
> events, and the host decides where the data goes. The one exception is optional speech: when the host passes its
> own proxy (`speechProxy`, see `for-developers.md` 3b-2), Amharic and Afaan Oromo recordings and screen text go to
> that proxy (after consent for voice). Privacy rule: **nothing leaves the host without consent.**
>
> This page is the contract a developer needs. It matches module version `0.12.0` (15 Nov, before Phase 10). The schemas use
> JSON Schema 2020-12. Amharic labels are a draft pending native-speaker review; stored **values** are always the
> English codes below, never translated text.

## 1. Events

All events are `CustomEvent`s. Each is also sent with the old `dimts:` prefix (deprecated, to be removed).

| Event | Sent on | When | `event.detail` |
|---|---|---|---|
| `savanna-onboarding:ready` | `document` | The script has loaded | `null` |
| `savanna-onboarding:prefs` | `document` | The learner changed a setting | [Preferences](#2-preferences) |
| `savanna-onboarding:complete` | the form element (bubbles) | The learner pressed the final button on "Check your answers" | [Completion envelope](#3-completion-envelope) |
| `savanna-onboarding:audioblocked` | `document` | The browser refused to play sound (autoplay rules: no interaction with this page yet). The player stopped quietly | `null`. The Savanna pages then show "Tap anywhere or press any key to hear this page" |
| `savanna-onboarding:step` | the form element (bubbles) | A new screen of the form opened (a question, "Check your answers", done) | `{ form, mode, step, summary }`: `mode` is `welcome`, `question`, `review`, `done` or `saved`; `summary` is a short hand-written English summary of the screen, for example `"Step 3 of 5: your phone number. You can type it or say it. Below are Continue and Back."` (empty in other languages for now). The Savanna pages put it first in `<main>` and read it aloud when automatic reading is on. |

```js
document.addEventListener('savanna-onboarding:complete', function (e) {
  if (e.detail.form === 'signup') { /* send e.detail.answers to your own API, if the learner agreed */ }
});
```

The module sends **only answers to questions the learner was actually shown**. Answers from a route they abandoned
(for example an ID number typed before switching to "I have none of these") are deleted, not sent. The draft is
deleted from the device when the form is completed.

## 2. Preferences

Stored on the device as `savanna-onboarding.prefs`. They describe **how** the learner likes to use forms, never why.
They are never sent to employers.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "savanna-onboarding/prefs",
  "type": "object",
  "properties": {
    "lang":     { "enum": ["am", "en", "om"] },
    "easy":     { "type": "boolean", "description": "Read questions aloud" },
    "mode":     { "enum": ["", "read_type", "listen", "speak", "simple"] },
    "size":     { "enum": ["normal", "large", "xlarge"] },
    "contrast": { "enum": ["normal", "high"] },
    "motion":   { "enum": ["normal", "reduce"], "description": "Stop motion" },
    "pictures": { "type": "boolean", "description": "Simple steps with pictures and big text" },
    "autoRead": { "enum": ["ask", "on", "off"], "description": "Automatic reading of page summaries. ask = not chosen yet (the first tap or key press turns it on)" }
  },
  "required": ["lang", "easy", "mode", "size", "contrast"],
  "additionalProperties": false
}
```

Also stored on the device: `savanna-onboarding.voiceConsent` (`true` / `false`), the learner's choice about voice
input. Unconfirmed speech is never stored or sent; a spoken answer becomes part of `answers` only after the learner
checks it and chooses "Use this answer".

## 3. Completion envelope

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "savanna-onboarding/complete",
  "type": "object",
  "properties": {
    "form":     { "enum": ["signup", "identity", "profile", "takeover", "passport", "employer", "apply"], "description": "Or the id of a form the host registered itself" },
    "instance": { "type": ["string", "null"], "description": "The element's instance attribute (for example the job id on apply)" },
    "lang":     { "enum": ["am", "en", "om"], "description": "Language the learner used (om = Afaan Oromo)" },
    "answers":  { "type": "object", "description": "One of the answer schemas below, chosen by `form`" }
  },
  "required": ["form", "instance", "lang", "answers"]
}
```

### Shared definitions

```json
{
  "$defs": {
    "ethDate": {
      "description": "A date in the calendar the learner chose (Ethiopian or Gregorian). `gregorian` is always the same day in the Gregorian calendar, worked out on the device: use it for storage and comparison. Answers saved before 15 Nov have no `cal` and are Ethiopian. Since 16 Nov a learner answering by voice can choose \"I don't know my exact date of birth\" and give only the year ({ cal, precision: 'year', y }) or only the age ({ cal, precision: 'age', age, asOf }): these have no `d`, `m` or `gregorian`, and are shown as \"About ...\". An Ethiopian year covers parts of two Gregorian years (y + 7 and y + 8).",
      "type": "object",
      "properties": {
        "precision": { "enum": ["year", "age"], "description": "Present only when the exact date is not known. Absent = an exact date" },
        "age": { "type": "integer", "minimum": 1, "maximum": 129, "description": "precision 'age': the age the learner said" },
        "asOf": { "type": "string", "format": "date", "description": "precision 'age': the day the age was given (Gregorian)" },
        "cal": { "enum": ["eth", "greg"], "default": "eth", "description": "eth = Ethiopian calendar, greg = Gregorian" },
        "d": { "type": "integer", "minimum": 1, "maximum": 31 },
        "m": { "type": "integer", "minimum": 1, "maximum": 13, "description": "Ethiopian: 1 = Meskerem ... 13 = Pagume. Gregorian: 1 = January ... 12 = December" },
        "y": { "type": "integer", "minimum": 1900, "maximum": 2030 },
        "gregorian": { "type": "string", "format": "date" }
      },
      "oneOf": [
        { "required": ["d", "m", "y", "gregorian"], "not": { "required": ["precision"] } },
        { "required": ["precision", "y"], "properties": { "precision": { "const": "year" } } },
        { "required": ["precision", "age", "asOf"], "properties": { "precision": { "const": "age" } } }
      ]
    },
    "need": {
      "description": "Shared support vocabulary, used by learners AND employers. A need, never a diagnosis.",
      "enum": ["screen_reader", "audio", "sign_language", "captions", "simple_words", "written",
               "step_free", "extra_time", "flexible_hours", "remote", "helper"]
    },
    "idRoute": { "enum": ["fayda", "kebele", "passport", "refugee", "other", "none"] },
    "partner": { "enum": ["aaapd", "tib", "other"] },
    "referralPartner": { "enum": ["aaapd", "tib", "unhcr_partner", "unsure"] },
    "phone": { "type": "string", "description": "As typed; validated as 10 digits (or +251 / 251 followed by 9 digits)" }
  }
}
```

`SavannaOnboarding.NEEDS` gives the labels for every `need` in English and Amharic.

### 3.1 `signup`: registration

```json
{
  "$id": "savanna-onboarding/answers/signup",
  "type": "object",
  "properties": {
    "filler":          { "enum": ["self", "partner"] },
    "partner_org":     { "$ref": "#/$defs/partner", "description": "Only when filler = partner" },
    "staff_name":      { "type": "string", "description": "Only when filler = partner" },
    "learner_consent": { "const": "yes", "description": "Only when filler = partner. The learner must agree" },
    "name":            { "type": "string", "description": "What the learner wants to be called (\"What should we call you?\"). Amharic (Ethiopic) or Latin letters, spaces, ' - . only. Not necessarily the full legal name" },
    "phone":           { "$ref": "#/$defs/phone" },
    "dob":             { "oneOf": [{ "$ref": "#/$defs/ethDate" }, { "const": "" }], "description": "Optional" },
    "consent":         { "const": "yes" }
  },
  "required": ["filler", "name", "phone", "consent"]
}
```

Sign-up asks **no ID** (since 15 Nov): 5 questions for a learner alone, 8 with a partner organisation. Nobody needs an
ID to start learning (21 Oct co-design finding: refugees were asked for ID they do not have).

### 3.1a `identity`: "Add your ID (optional)"

Opened from My profile and from the dashboard, whenever the learner wants. The six ID routes, the honest trust
badges and the "I have none of these, refer me through a partner" path, prefilled from the profile so nothing is
asked twice. Never offered with voice input (`sensitive`): ID numbers are typed, not spoken.

```json
{
  "$id": "savanna-onboarding/answers/identity",
  "type": "object",
  "properties": {
    "id_route":        { "$ref": "#/$defs/idRoute" },
    "id_number":       { "type": "string", "description": "Optional; may be empty. Only when id_route is not none. NEVER verified" },
    "referral_partner":{ "$ref": "#/$defs/referralPartner", "description": "Only when id_route = none" }
  },
  "required": ["id_route"]
}
```

### 3.2 `profile`: profile update

Starts on the summary, prefilled from the profile the host saved. Same fields and values as `signup`, without the
partner questions and the consent question: `name`, `phone`, `dob` — plus **`full_name`** (optional, string, same
letters rule as `name`; the only place the full name is asked). The ID has its own form, `identity`.

### 3.2a `takeover`: learner takes over after partner sign-up

Fields `name`, `phone` and `dob`, as in `profile`. Shown to the learner (alone) after a partner organisation signed
them up. The learner adds an ID later, alone, in `identity`, if they want to. The
host should then remove the staff member's name and keep only the organisation (the demo does this).

### 3.3 `passport`: Support Passport

```json
{
  "$id": "savanna-onboarding/answers/passport",
  "type": "object",
  "properties": {
    "want":       { "enum": ["yes", "later"] },
    "needs":      { "type": "array", "items": { "$ref": "#/$defs/need" }, "minItems": 1, "description": "Only when want = yes" },
    "other_need": { "type": "string", "description": "Optional, free text in the learner's words" },
    "sharing":    { "enum": ["ask", "trainers"], "description": "ask = only me, ask every time I apply" }
  },
  "required": ["want"]
}
```

### 3.4 `apply`: job application

```json
{
  "$id": "savanna-onboarding/answers/apply",
  "type": "object",
  "properties": {
    "name":           { "type": "string", "description": "Prefilled from the profile: the full name if the learner added one, otherwise the name we call them" },
    "phone":          { "$ref": "#/$defs/phone", "description": "Prefilled from the profile" },
    "experience":     { "type": "string" },
    "interview":      { "type": "array", "items": { "enum": ["phone", "in_person", "written", "interpreter"] } },
    "share_passport": { "enum": ["share", "keep"], "description": "Only asked when a Support Passport with needs exists. Per application" }
  },
  "required": ["name", "phone", "experience"]
}
```

**Consent rule:** the host may add Support Passport needs to what an employer receives **only** when
`share_passport` is `"share"` for **this** application. Then it sends the list of needs only: never `other_need`,
never a reason or condition. Use the module's helper, which applies the rule for you:

```js
var support = SavannaOnboarding.supportForEmployer(e.detail.answers); // [] unless "share" for this application
packet.supportThatHelps = support.map(function (n) { return n.label.en; });
```

The learner's Support Passport setting "me and my ALX trainers" never means employers. Before answering, the learner
sees exactly the list that would be shared.

### 3.5 `employer`: post a job and the support it offers (employer accommodation form)

```json
{
  "$id": "savanna-onboarding/answers/employer",
  "type": "object",
  "properties": {
    "title":       { "type": "string" },
    "org":         { "type": "string" },
    "location":    { "type": "string" },
    "mode":        { "enum": ["onsite", "remote", "hybrid"] },
    "offers":      { "type": "array", "items": { "$ref": "#/$defs/need" }, "minItems": 1 },
    "description": { "type": "string" },
    "contact":     { "type": "string", "description": "Phone number or email, as typed" }
  },
  "required": ["title", "org", "location", "mode", "offers", "description", "contact"]
}
```

## 4. What the demo host builds from these (an example, not part of the module)

The demo page (`app.js`) shows one way a host can use the answers. A real host can store them differently.

| Record (device key) | Built from | Notes |
|---|---|---|
| `profile` | `signup`, then `identity` / `profile` / `takeover` | `{ name, full_name, phone, lang, id_route, assurance_level, referral_partner, registered_by, takeover_pending, dob, updated }`. **The ID number itself is not kept**, only the status. `registered_by` is `{ org, staff }` until the learner takes over, then `{ org }` only. |
| `passport` | `passport` | `{ needs, other_need, sharing, updated }`. Stays on the device. `sharing` is `"ask"` (private, the default) or `"trainers"`; the learner can change it on the Support Passport card at any time. |
| `applications` | `apply` | `{ at, packet, withdrawn? }`. On the Savanna pages the learner sees a plain confirmation ("Your application was sent to …", a readable summary from `SavannaOnboarding.describe('apply', answers, lang)`, "Support Passport: shared / not shared", and a line saying it is a demo and nothing was sent). The raw packet (below) is shown only on the developer pages (`showroom.html`, `test-host/`). Withdrawing removes `supportThatHelps` and sets `withdrawn`. |
| `jobs` | `employer` | Shown on the job board and as JSON-LD (section 5). |

`assurance_level` is the honest ID trust status from `SavannaOnboarding.trustLevel(answers)`. It never says
"verified", because there is no verification service:

| Value | Badge (en / am) | When |
|---|---|---|
| `no_id_yet` | No ID added yet / ገና መታወቂያ አልተጨመረም | After sign-up, until the learner adds an ID (optional) |
| `self_declared` | Self-declared / በራስ የተገለጸ | An ID type was chosen, no number given |
| `document_number_recorded` | Number recorded — not verified / ቁጥር ተመዝግቧል — አልተረጋገጠም | A number was given (not checked) |
| `partner_referral_pending` | Partner referral pending / የአጋር ድርጅት ማረጋገጫ በመጠበቅ ላይ | "I have none of these, refer me" |

Badge texts: `SavannaOnboarding.TRUST`. Partner help is recorded separately in `registered_by` (it says who helped,
not how trustworthy the ID is). The old value `partner_assisted` is no longer produced.

Application packet (what the employer receives in the demo; shown as JSON on the developer pages only):

```json
{
  "job": "Customer support agent", "employer": "Selam Contact Centre",
  "name": "…", "phone": "…", "experience": "…", "interview": ["phone"],
  "supportThatHelps": ["Works with a screen reader"]
}
```

`supportThatHelps` is present **only** when the learner chose "share" for this application.

## 5. Level 3: schema.org `JobPosting` mapping

Each job from the `employer` form is published as JSON-LD that other job platforms can read.

| `employer` answer | `JobPosting` property | Notes |
|---|---|---|
| `title` | `title` | |
| `description` | `description` | |
| (date posted) | `datePosted` | ISO date |
| `org` | `hiringOrganization` → `Organization.name` | |
| `location` | `jobLocation` → `Place.address` → `PostalAddress.addressLocality`; `addressCountry: "ET"` | |
| `mode = remote` | `jobLocationType: "TELECOMMUTE"` | Omitted for onsite / hybrid |
| `offers` | `jobBenefits` (English labels joined with "; ") | Human-readable |
| `offers` | `additionalProperty` → `PropertyValue { name: "workplaceSupportOffered", value: [codes] }` | Machine-readable, same vocabulary as the Support Passport |
| `contact` | `applicationContact` → `ContactPoint.description` | |

```json
{
  "@context": "https://schema.org", "@type": "JobPosting",
  "title": "Junior web developer", "description": "Build and fix web pages with a senior mentor.",
  "datePosted": "2026-11-14",
  "hiringOrganization": { "@type": "Organization", "name": "Entoto Tech" },
  "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Lideta, Addis Ababa", "addressCountry": "ET" } },
  "jobBenefits": "Sign language interpreter; Captions on videos and calls; Instructions in writing",
  "additionalProperty": [{ "@type": "PropertyValue", "name": "workplaceSupportOffered", "value": ["sign_language", "captions", "written"] }]
}
```

The demo job board also publishes every job on the page as one `<script type="application/ld+json">` array of these
objects, whatever the learner's private filter shows.

Matching jobs to a learner's needs happens **on the device** by comparing `workplaceSupportOffered` with the Support
Passport. The job board never learns the learner's needs.

## 6. What is not offered

- No REST API, no OpenAPI spec (Level 2): there is no real backend contract yet, and we do not invent one.
- No LTI 1.3 or Open Badges 3.0: no real use case yet.
- No ID verification: IDs are recorded, never checked.
