# Data and events the module gives the host

> **Integration level:** Level 1 (script tag) + Level 3 (schema.org `JobPosting`). There is **no server, no REST
> API and no endpoint**. The module sends nothing over the network. It hands data to the host page as browser
> events; the host decides where the data goes. Privacy rule: **nothing leaves the host without consent.**
>
> This page is the contract a developer needs. It matches module version `0.5.0` (Phase 3). The schemas use
> JSON Schema 2020-12. Amharic labels are a draft pending native-speaker review; stored **values** are always the
> English codes below, never translated text.

## 1. Events

All events are `CustomEvent`s. Each is also sent with the old `dimts:` prefix (deprecated, to be removed).

| Event | Sent on | When | `event.detail` |
|---|---|---|---|
| `savanna-onboarding:ready` | `document` | The script has loaded | `null` |
| `savanna-onboarding:prefs` | `document` | The learner changed a setting | [Preferences](#2-preferences) |
| `savanna-onboarding:complete` | the form element (bubbles) | The learner pressed the final button on "Check your answers" | [Completion envelope](#3-completion-envelope) |

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
    "lang":     { "enum": ["am", "en"] },
    "easy":     { "type": "boolean", "description": "Read questions aloud" },
    "mode":     { "enum": ["", "read_type", "listen", "speak", "simple"] },
    "size":     { "enum": ["normal", "large", "xlarge"] },
    "contrast": { "enum": ["normal", "high"] }
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
    "form":     { "enum": ["signup", "profile", "passport", "employer", "apply"], "description": "Or the id of a form the host registered itself" },
    "instance": { "type": ["string", "null"], "description": "The element's instance attribute (for example the job id on apply)" },
    "lang":     { "enum": ["am", "en"], "description": "Language the learner used" },
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
      "description": "Ethiopian-calendar date, with the Gregorian date worked out on the device",
      "type": "object",
      "properties": {
        "d": { "type": "integer", "minimum": 1, "maximum": 30 },
        "m": { "type": "integer", "minimum": 1, "maximum": 13, "description": "1 = Meskerem ... 13 = Pagume" },
        "y": { "type": "integer", "minimum": 1900, "maximum": 2030 },
        "gregorian": { "type": "string", "format": "date" }
      },
      "required": ["d", "m", "y", "gregorian"]
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
    "name":            { "type": "string" },
    "phone":           { "$ref": "#/$defs/phone" },
    "id_route":        { "$ref": "#/$defs/idRoute" },
    "id_number":       { "type": "string", "description": "Optional; may be empty. Only when id_route is not none. NEVER verified" },
    "referral_partner":{ "$ref": "#/$defs/referralPartner", "description": "Only when id_route = none" },
    "dob":             { "oneOf": [{ "$ref": "#/$defs/ethDate" }, { "const": "" }], "description": "Optional" },
    "consent":         { "const": "yes" }
  },
  "required": ["filler", "name", "phone", "id_route", "consent"]
}
```

### 3.2 `profile`: profile update

Starts on the summary, prefilled from the profile the host saved. Same fields and values as `signup`, without the
partner questions and the consent question: `name`, `phone`, `id_route`, `id_number` (only if the learner typed a new
one), `referral_partner`, `dob`.

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
    "name":           { "type": "string", "description": "Prefilled from the profile" },
    "phone":          { "$ref": "#/$defs/phone", "description": "Prefilled from the profile" },
    "why":            { "type": "string" },
    "experience":     { "type": "string" },
    "interview":      { "type": "array", "items": { "enum": ["phone", "in_person", "written", "interpreter"] } },
    "share_passport": { "enum": ["share", "keep"], "description": "Only asked when a Support Passport with needs exists. Per application" }
  },
  "required": ["name", "phone", "why", "experience"]
}
```

**Consent rule:** the host may add Support Passport needs to what an employer receives **only** when
`share_passport` is `"share"` for **this** application. Then it sends the list of needs only: never `other_need`,
never a reason or condition.

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
| `profile` | `signup`, then `profile` | `{ name, phone, lang, id_route, assurance_level, referral_partner, registered_by, dob, updated }`. **The ID number itself is not kept**, only the level. |
| `passport` | `passport` | `{ needs, other_need, sharing, updated }`. Stays on the device. |
| `applications` | `apply` | The packet shown on screen as "What the employer receives" (below). |
| `jobs` | `employer` | Shown on the job board and as JSON-LD (section 5). |

`assurance_level` is honest and never says "verified": `partner_assisted`, `partner_referral_pending`,
`document_number_recorded` or `self_declared`.

Application packet (what the employer receives in the demo):

```json
{
  "job": "Customer support agent", "employer": "Selam Contact Centre",
  "name": "…", "phone": "…", "why": "…", "experience": "…", "interview": ["phone"],
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

Matching jobs to a learner's needs happens **on the device** by comparing `workplaceSupportOffered` with the Support
Passport. The job board never learns the learner's needs.

## 6. What is not offered

- No REST API, no OpenAPI spec (Level 2): there is no real backend contract yet, and we do not invent one.
- No LTI 1.3 or Open Badges 3.0: no real use case yet.
- No ID verification: IDs are recorded, never checked.
